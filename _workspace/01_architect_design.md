# 01 Architect Design (확정본)

## 결정 요약
- React 18 + Vite, 백엔드 없음. 상태: (1) YouTube API 실시간, (2) localStorage.
- 인증: Google Identity Services(GIS) token client — Client ID만 사용, 시크릿 없음, GitHub Pages 호환.
- 라우팅: 무거운 라우터 대신 **탭 state**(좋아요 ↔ 샘플). GitHub Pages 딥링크 문제 회피.
- 배포: Vite `base`, gh-pages. Client ID는 `.env`의 `VITE_GOOGLE_CLIENT_ID`.

## localStorage 데이터 스키마 (계약)
- 키: `sampleList.v1`
- 값: `{ "samples": Sample[] }`

| 필드 | 타입 | 출처(YouTube API) |
|------|------|------------------|
| videoId | string | `item.id` |
| title | string | `item.snippet.title` |
| thumbnail | string | `item.snippet.thumbnails.medium.url ?? .default.url` |
| channelTitle | string | `item.snippet.channelTitle` |
| comment | string | 사용자 입력 (기본 "") |
| addedAt | string(ISO) | `addSample` 시각 |

- 좋아요 목록은 저장하지 않음(매번 API 조회). 저장 대상은 `samples`뿐.
- 모든 필드 camelCase 통일.

## 폴더 구조
```
src/
├── main.jsx
├── App.jsx
├── styles.css
├── auth/google.js        ← GIS 토큰 (api-engineer)
├── api/youtube.js        ← 좋아요 목록 + 정규화 (api-engineer)
├── store/samples.js      ← localStorage 데이터 레이어 (api-engineer)
├── hooks/useSamples.js   ← store 래핑 훅
├── components/VideoCard.jsx
└── pages/{LoginPage,LikedPage,SamplesPage}.jsx  (ui-engineer)
```
- 경계: UI는 store/api/auth 함수만 호출. 직접 fetch/localStorage 접근 금지.

## 배포/설정
- `vite.config.js` base: `/sample-list/` (저장소명 가정. user.github.io 루트면 `/`).
- OAuth 승인된 JS 원본: `http://localhost:5173`, `https://<user>.github.io`.
- 의존성: react, react-dom, vite, @vitejs/plugin-react, gh-pages(dev). 상태관리 라이브러리 없음.

## 변경 이력
- 2026-06-23 초기 확정.
