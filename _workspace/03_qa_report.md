# 03 QA Report — 통합 정합성 검증

검증일: 2026-06-23 / 빌드: ✅ 성공 (vite build, 39 modules, 0 error)

## 경계면 교차검증 (양쪽 동시 읽기)

| 경계면 | 생산자 | 소비자 | 결과 |
|--------|--------|--------|------|
| 좋아요 반환 | `fetchLikedVideos()` → `LikedVideo[]` (배열) | `LikedPage` `videos.map`, `samples.some` | ✅ 배열 직접 소비, 래핑 없음 |
| 샘플 반환 | `getSamples()` → `Sample[]` (배열) | `useSamples`/`SamplesPage.map` | ✅ 일치 |
| Sample 필드 | store가 채우는 `{videoId,title,thumbnail,channelTitle,comment,addedAt}` | `VideoCard` 사용부 | ✅ 필드명/케이스 일치(camelCase) |
| 정규화 매핑 | `normalize()` (id, snippet.*) | UI 기대 필드 | ✅ 모든 계약 필드 채움 |
| 영상 링크 | `watchUrl(videoId)` | VideoCard href | ✅ |
| isSampled | store 판별 | LikedPage 버튼 분기 | ✅ |

## 스키마 일관성
- localStorage 단일 키 `sampleList.v1` ✅
- JSON 파싱 실패 시 `{samples:[]}` 폴백 ✅
- `addSample`이 comment="", addedAt(ISO) 채움 ✅

## 경계 위반 검사
- UI(components/pages)에서 직접 `fetch`/`localStorage` 호출 없음 ✅ (모두 store/api/auth 경유)

## 배포/설정
- vite `base: '/sample-list/'` 설정됨 (저장소명 다르면 수정 필요 — 주석 명시) ✅
- 라우팅: 탭 state (GitHub Pages 딥링크 문제 없음) ✅
- Client ID는 `.env`의 `VITE_GOOGLE_CLIENT_ID`, client_secret 코드에 없음 ✅

## 기능 스펙
- 좋아요 페이지네이션(nextPageToken 반복) ✅
- 로딩/빈/에러 상태 각 화면에 존재 ✅
- 토큰 401 시 1회 재로그인 재시도 ✅

## 미검증 (런타임 필요 — 실제 Google 계정/Client ID 있어야 확인 가능)
- 실제 OAuth 로그인 팝업 흐름
- 실제 좋아요 API 응답 정규화 (모킹 아닌 실데이터)
→ 사용자가 Client ID 설정 후 `npm run dev`로 수동 확인 필요.

## 결론
정적 검증 전부 통과. 잔여 항목은 실계정 런타임 확인뿐.
