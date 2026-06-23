---
name: frontend-qa-check
description: "데이터 레이어 반환 shape과 UI 소비부의 일치, localStorage 스키마 일관성, 빌드/배포 설정을 교차 검증한다. frontend-qa 에이전트가 사용. 정합성 검증, QA, 빌드 확인, 경계면 점검 시 적용."
---

# Frontend QA Check — 통합 정합성 검증

개별 모듈이 각각 맞아도 연결 지점에서 계약이 어긋나면 런타임 버그가 난다. "존재 확인"이 아니라 "교차 비교"를 한다.

## 핵심: 양쪽 동시 읽기

경계면은 반드시 생산자·소비자 코드를 같이 열어 비교한다.

| 검증 대상 | 왼쪽 (생산자) | 오른쪽 (소비자) | 흔한 버그 |
|----------|-------------|---------------|----------|
| 데이터 함수 반환 | api/store 함수 + `02_api_contract.md` | 컴포넌트의 호출부 | 배열 기대 vs `{samples:[]}` 반환 |
| localStorage 스키마 | `01_architect_design.md` 스키마 | 저장/읽기 코드 필드명 | `addedAt` vs `added_at` |
| 정규화 매핑 | YouTube raw 응답 → 정규화 | UI가 기대하는 필드 | `thumbnail` vs `thumbnails.default.url` |
| 영상 링크 | `videoId` 필드 | `watch?v=` href | videoId 누락/오타 |
| isSampled | store의 판별 로직 | LikedPage 버튼 분기 | id 비교 타입 불일치 |

## 검증 체크리스트

### 데이터 레이어 ↔ UI
- [ ] 모든 데이터 함수의 반환 shape이 호출측 기대와 일치 (배열/래핑 구분)
- [ ] 필드명이 양쪽 모두 camelCase로 일치 (계약 위반 없음)
- [ ] API raw → 정규화 매핑이 스키마의 모든 필드를 채움
- [ ] UI가 직접 fetch/localStorage를 호출하지 않는지 (경계 위반 검사)

### localStorage
- [ ] 저장 키가 단일/일관 (`sampleList.v1`)
- [ ] JSON 파싱 실패 시 빈 배열 폴백 존재
- [ ] addSample이 addedAt 등 필수 필드를 빠짐없이 채움

### 빌드/배포
- [ ] `npm run build` 성공 (단, 통과 ≠ 정상 동작. 필드 불일치는 빌드를 통과하니 위 항목을 직접 대조)
- [ ] vite `base`가 GitHub Pages 경로와 일치
- [ ] 라우팅이 GitHub Pages에서 안전한지 (Hash 또는 탭 state; BrowserRouter 딥링크 주의)
- [ ] Client ID가 `.env`(`VITE_GOOGLE_CLIENT_ID`)에서 오고, client_secret이 코드에 없음

### 기능 스펙
- [ ] 좋아요 50개 초과 시 페이지네이션으로 전부 로드
- [ ] 로딩/빈/에러 상태가 각 화면에 존재

## 작업 방식
- general-purpose 타입이므로 Grep으로 패턴 추출(모든 store 함수 호출부, 모든 `watch?v=` 등)하고 빌드를 실행한다.
- 각 모듈 완성 직후 점진 검증(incremental). 전체 완성 후 1회로 미루지 않는다.
- 발견 즉시 생산자·소비자 양쪽 에이전트에 파일:라인 + 수정 방법을 전달.

## 출력
`_workspace/03_qa_report.md` — 통과/실패/미검증 구분. 실패는 파일:라인 + 수정 방법 명시.
