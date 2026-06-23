// localStorage 데이터 레이어. 샘플 목록 + 코멘트의 단일 진실원.
// UI는 이 함수들만 사용하고 localStorage를 직접 만지지 않는다.

const KEY = 'sampleList.v1'

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { samples: [] }
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.samples)) return { samples: [] }
    return parsed
  } catch {
    return { samples: [] }
  }
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

// 반환: Sample[] = { videoId, title, thumbnail, channelTitle, comment, addedAt }[]
export function getSamples() {
  return read().samples
}

export function isSampled(videoId) {
  return read().samples.some((s) => s.videoId === videoId)
}

// video: { videoId, title, thumbnail, channelTitle } (LikedVideo)
export function addSample(video) {
  const data = read()
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
  write(data)
}

export function removeSample(videoId) {
  const data = read()
  data.samples = data.samples.filter((s) => s.videoId !== videoId)
  write(data)
}

export function updateComment(videoId, comment) {
  const data = read()
  const s = data.samples.find((x) => x.videoId === videoId)
  if (s) {
    s.comment = comment
    write(data)
  }
}

// 좋아요 목록을 받아 기존 샘플의 likedRank를 채운다(이미 값이 있으면 최신값으로 갱신).
// likedVideos: { videoId, likedRank }[]  → 변경 발생 시 true 반환.
export function backfillLikedRanks(likedVideos) {
  const rankById = new Map(
    likedVideos
      .filter((v) => typeof v.likedRank === 'number')
      .map((v) => [v.videoId, v.likedRank]),
  )
  const data = read()
  let changed = false
  for (const s of data.samples) {
    if (rankById.has(s.videoId) && s.likedRank !== rankById.get(s.videoId)) {
      s.likedRank = rankById.get(s.videoId)
      changed = true
    }
  }
  if (changed) write(data)
  return changed
}

export function watchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`
}
