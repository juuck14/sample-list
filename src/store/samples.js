// Google Drive appDataFolder 데이터 레이어.
// 샘플 목록 + 코멘트의 단일 진실원은 Drive의 숨김 앱 데이터 파일이고,
// localStorage는 첫 마이그레이션/오프라인 캐시 용도로 유지한다.
import { getToken, signIn } from '../auth/google.js'

const KEY = 'sampleList.v1'
const FILE_NAME = 'sampleList.v1.json'
const DRIVE_FILES_API = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files'

let cachedFileId = null

function emptyData() {
  return { samples: [] }
}

function normalizeData(data) {
  if (!data || !Array.isArray(data.samples)) return emptyData()
  return {
    samples: data.samples.filter((s) => s && s.videoId),
  }
}

function readLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyData()
    return normalizeData(JSON.parse(raw))
  } catch {
    return emptyData()
  }
}

function writeLocal(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(normalizeData(data)))
  } catch {
    /* 무시 */
  }
}

async function authedFetch(url, options = {}) {
  let token = getToken()
  if (!token) token = await signIn()

  const request = async (accessToken) => fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  })

  let res = await request(token)
  if (res.status === 401 || res.status === 403) {
    token = await signIn()
    res = await request(token)
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Google Drive API 오류: ${res.status}${body ? ` ${body}` : ''}`)
  }
  return res
}

async function findRemoteFileId() {
  if (cachedFileId) return cachedFileId

  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name='${FILE_NAME}' and trashed=false`,
    fields: 'files(id,name,modifiedTime)',
    pageSize: '1',
  })
  const res = await authedFetch(`${DRIVE_FILES_API}?${params}`)
  const data = await res.json()
  cachedFileId = data.files?.[0]?.id || null
  return cachedFileId
}

async function readRemote() {
  const fileId = await findRemoteFileId()
  if (!fileId) return null

  const res = await authedFetch(`${DRIVE_FILES_API}/${fileId}?alt=media`)
  return normalizeData(await res.json())
}

function multipartBody(metadata, content) {
  const boundary = 'sample_list_boundary'
  const json = JSON.stringify(content)
  return [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    json,
    `--${boundary}--`,
  ].join('\r\n')
}

async function createRemote(data) {
  const boundary = 'sample_list_boundary'
  const body = multipartBody(
    { name: FILE_NAME, parents: ['appDataFolder'] },
    normalizeData(data),
  )
  const params = new URLSearchParams({
    uploadType: 'multipart',
    fields: 'id',
  })
  const res = await authedFetch(`${DRIVE_UPLOAD_API}?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  const created = await res.json()
  cachedFileId = created.id
}

async function updateRemote(fileId, data) {
  await authedFetch(`${DRIVE_UPLOAD_API}/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(normalizeData(data)),
  })
}

async function writeRemote(data) {
  const fileId = await findRemoteFileId()
  if (fileId) {
    await updateRemote(fileId, data)
  } else {
    await createRemote(data)
  }
}

async function readRemoteOrLocal() {
  try {
    const remote = await readRemote()
    if (remote) {
      writeLocal(remote)
      return remote
    }

    // 최초 사용 또는 기존 localStorage 사용자: 로컬 데이터를 Drive로 마이그레이션한다.
    const local = readLocal()
    if (local.samples.length > 0) await writeRemote(local)
    return local
  } catch (e) {
    console.warn('Drive 동기화 실패, localStorage 캐시를 사용합니다.', e)
    return readLocal()
  }
}

async function writeRemoteAndLocal(data) {
  const normalized = normalizeData(data)
  writeLocal(normalized)
  try {
    await writeRemote(normalized)
  } catch (e) {
    console.warn('Drive 저장 실패, localStorage에만 저장했습니다.', e)
  }
}

// 반환: Sample[] = { videoId, title, thumbnail, channelTitle, comment, addedAt }[]
export async function getSamples() {
  return (await readRemoteOrLocal()).samples
}

export async function isSampled(videoId) {
  return (await readRemoteOrLocal()).samples.some((s) => s.videoId === videoId)
}

// video: { videoId, title, thumbnail, channelTitle } (LikedVideo)
export async function addSample(video) {
  const data = await readRemoteOrLocal()
  if (data.samples.some((s) => s.videoId === video.videoId)) return
  data.samples.unshift({
    videoId: video.videoId,
    title: video.title,
    thumbnail: video.thumbnail,
    channelTitle: video.channelTitle,
    comment: '',
    addedAt: new Date().toISOString(),
    // YouTube 좋아요 최신순 위치(0=가장 최근). "최근 추가순" 정렬 기준.
    likedRank: typeof video.likedRank === 'number' ? video.likedRank : null,
  })
  await writeRemoteAndLocal(data)
}

export async function removeSample(videoId) {
  const data = await readRemoteOrLocal()
  data.samples = data.samples.filter((s) => s.videoId !== videoId)
  await writeRemoteAndLocal(data)
}

export async function updateComment(videoId, comment) {
  const data = await readRemoteOrLocal()
  const s = data.samples.find((x) => x.videoId === videoId)
  if (s) {
    s.comment = comment
    await writeRemoteAndLocal(data)
  }
}

// 좋아요 목록을 받아 기존 샘플의 likedRank를 채운다(이미 값이 있으면 최신값으로 갱신).
// likedVideos: { videoId, likedRank }[]  → 변경 발생 시 true 반환.
export async function backfillLikedRanks(likedVideos) {
  const rankById = new Map(
    likedVideos
      .filter((v) => typeof v.likedRank === 'number')
      .map((v) => [v.videoId, v.likedRank]),
  )
  const data = await readRemoteOrLocal()
  let changed = false
  for (const s of data.samples) {
    if (rankById.has(s.videoId) && s.likedRank !== rankById.get(s.videoId)) {
      s.likedRank = rankById.get(s.videoId)
      changed = true
    }
  }
  if (changed) await writeRemoteAndLocal(data)
  return changed
}

export function watchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`
}
