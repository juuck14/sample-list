// YouTube Data API v3 — 좋아요한 영상 불러오기.
// 응답을 계약 스키마(camelCase)로 정규화해서 반환한다.
import { getToken, signIn } from '../auth/google.js'

const API = 'https://www.googleapis.com/youtube/v3/videos'

async function authedFetch(url) {
  let token = getToken()
  if (!token) token = await signIn()
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 401) {
    // 토큰 만료 → 재로그인 1회 시도
    token = await signIn()
    const retry = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!retry.ok) throw new Error(`YouTube API 오류: ${retry.status}`)
    return retry.json()
  }
  if (!res.ok) throw new Error(`YouTube API 오류: ${res.status}`)
  return res.json()
}

function normalize(item) {
  const t = item.snippet.thumbnails || {}
  return {
    videoId: item.id,
    title: item.snippet.title,
    thumbnail: (t.medium && t.medium.url) || (t.default && t.default.url) || '',
    channelTitle: item.snippet.channelTitle,
  }
}

// 좋아요한 영상 전체를 페이지네이션으로 모두 가져온다.
// YouTube는 최근 좋아요한 영상부터 반환하므로, 그 순서를 likedRank(0=가장 최근)로 부여한다.
// 반환: LikedVideo[] = { videoId, title, thumbnail, channelTitle, likedRank }[]
export async function fetchLikedVideos() {
  const results = []
  let pageToken = ''
  do {
    const url =
      `${API}?part=snippet&myRating=like&maxResults=50` +
      (pageToken ? `&pageToken=${pageToken}` : '')
    const data = await authedFetch(url)
    for (const item of data.items || []) {
      const v = normalize(item)
      v.likedRank = results.length // 좋아요 최신순 위치 (0이 가장 최근)
      results.push(v)
    }
    pageToken = data.nextPageToken || ''
  } while (pageToken)
  return results
}
