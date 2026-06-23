---
name: frontend-architecture
description: "백엔드 없는 React+Vite 정적 앱의 구조·라우팅·localStorage 스키마·GitHub Pages 배포 설정을 설계한다. frontend-architect 에이전트가 사용. 구조 설계, 데이터 모델 확정, 스캐폴딩, 배포 설정 작업 시 적용."
---

# Frontend Architecture — 정적 React 앱 설계

백엔드 없이 동작하는 React+Vite SPA를 설계한다. 상태는 (1) YouTube API 실시간 호출, (2) localStorage 두 곳뿐이다.

## 설계 산출 순서

1. **데이터 스키마 확정 (최우선)** — 데이터 레이어와 UI의 공유 계약. 여기서 흔들리면 경계면 버그가 난다.
2. 폴더 구조 / 컴포넌트 트리
3. 라우팅 또는 탭 전환 (좋아요 목록 ↔ 샘플 목록)
4. Vite 설정 + GitHub Pages 배포
5. 의존성 목록 (최소화)

## 1. localStorage 데이터 스키마 (계약)

필드명은 **camelCase로 통일**한다. API raw 응답(snake/중첩)을 그대로 저장하지 않고 정규화한다.

```json
{
  "samples": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "Artist - Track",
      "thumbnail": "https://i.ytimg.com/vi/.../default.jpg",
      "channelTitle": "Artist",
      "comment": "드럼 브레이크 4마디, 0:12 인트로",
      "addedAt": "2026-06-23T10:00:00Z"
    }
  ]
}
```

- localStorage 키는 단일 키(예: `sampleList.v1`) 사용 — 버전 접미사로 향후 마이그레이션 대비.
- 좋아요 목록은 저장하지 않는다 (매번 API 실시간 조회). 저장 대상은 `samples`뿐.
- 각 필드의 출처를 표로 명시한다 (어느 API 필드에서 매핑되는지) → api-engineer가 정규화 시 참조.

## 2. 폴더 구조 (권장 기본형)

```
src/
├── main.jsx
├── App.jsx
├── auth/        ← OAuth PKCE (api-engineer)
├── api/         ← YouTube API 호출 (api-engineer)
├── store/       ← localStorage 데이터 레이어 (api-engineer)
├── components/  ← VideoCard, CommentEditor 등 (ui-engineer)
├── pages/       ← LikedPage, SamplesPage, LoginPage (ui-engineer)
└── hooks/       ← 데이터 레이어를 감싼 React 훅 (협의)
```

> 데이터 레이어(api/store)와 UI(components/pages)의 경계를 명확히 둔다. UI는 store/api 함수만 호출하고 직접 fetch/localStorage 접근을 하지 않는다.

## 3. 라우팅

본인용 단순 앱이므로 무거운 라우터 대신 상태 기반 탭 전환 또는 `react-router`의 HashRouter를 권장한다.

- **GitHub Pages는 BrowserRouter의 딥링크가 깨진다** (서버가 SPA 폴백을 안 함). HashRouter(`/#/samples`) 또는 단순 탭 state를 쓰면 안전하다.

## 4. Vite + GitHub Pages

- `vite.config.js`의 `base`를 `/저장소이름/`으로 설정 (사용자/조직 페이지 `user.github.io` 루트 배포면 `/`).
- 배포는 `gh-pages` 패키지 또는 GitHub Actions. `dist/`를 `gh-pages` 브랜치로.
- 환경변수: `VITE_GOOGLE_CLIENT_ID`를 `.env`로. 빌드 결과에 Client ID가 박혀도 안전(공개 가능 값).
- OAuth 승인된 JavaScript 원본에 `http://localhost:5173`과 `https://<user>.github.io` 등록 (경로 없이 origin만).

## 5. 의존성 최소화

필수: `react`, `react-dom`, `vite`. 인증은 Google Identity Services 스크립트 또는 직접 PKCE 구현(라이브러리 불필요). 라우터는 선택. 상태관리 라이브러리는 이 규모에서 불필요(useState/Context로 충분).

## 출력
`_workspace/01_architect_design.md`에 위 5개 항목을 확정본으로 기록하고, 데이터 스키마 변경 시 문서 하단에 변경 이력을 남긴다. 확정 후 api-engineer와 ui-engineer 양쪽에 통보한다.
