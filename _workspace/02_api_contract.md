# 02 API Contract (데이터 레이어 노출 함수)

UI는 아래 함수만 호출한다. 직접 fetch/localStorage 금지.

## auth/google.js
| 함수 | 시그니처 | 반환 |
|------|---------|------|
| signIn | `signIn()` | `Promise<string>` (access_token) |
| isSignedIn | `isSignedIn()` | `boolean` |
| signOut | `signOut()` | `void` |

## api/youtube.js
| 함수 | 시그니처 | 반환 |
|------|---------|------|
| fetchLikedVideos | `fetchLikedVideos()` | `Promise<LikedVideo[]>` |

`LikedVideo = { videoId, title, thumbnail, channelTitle, likedRank }`
- `videoId/title/thumbnail/channelTitle`: string
- `likedRank`: number — YouTube 좋아요 최신순 위치(0=가장 최근). "최근 추가순" 정렬 기준.
- 토큰 없으면 내부에서 signIn 호출. 401 시 1회 재로그인 후 재시도.
- 좋아요 전체를 페이지네이션으로 모두 반환(배열, 래핑 없음).

## store/samples.js
| 함수 | 시그니처 | 반환 |
|------|---------|------|
| getSamples | `getSamples()` | `Sample[]` (배열, 래핑 없음) |
| isSampled | `isSampled(videoId)` | `boolean` |
| addSample | `addSample(video: LikedVideo)` | `void` (comment="" , addedAt 자동) |
| removeSample | `removeSample(videoId)` | `void` |
| updateComment | `updateComment(videoId, comment)` | `void` |
| watchUrl | `watchUrl(videoId)` | `string` |
| backfillLikedRanks | `backfillLikedRanks(likedVideos)` | `boolean` (변경 시 true) — 기존 샘플의 likedRank 보정 |

`Sample = { videoId, title, thumbnail, channelTitle, comment, addedAt, likedRank }`
- `likedRank`: number | null — 좋아요 최신순 위치(0=가장 최근). 예전 샘플은 null(추가 시점 폴백, 정렬 후순위).

## UI 주의
- `getSamples()`/`fetchLikedVideos()`는 **배열을 직접 반환**(`{samples:[]}` 아님).
- 필드명은 모두 camelCase. 추측 금지.
