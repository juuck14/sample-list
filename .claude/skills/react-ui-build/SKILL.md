---
name: react-ui-build
description: "YouTube 샘플 매니저의 React 화면과 컴포넌트를 구현한다(좋아요 목록, 샘플 목록, 코멘트 편집, 영상 카드/링크). react-ui-engineer 에이전트가 사용. 화면 구현, 컴포넌트 작성, UI 연결 작업 시 적용."
---

# React UI Build — 화면·컴포넌트 구현

데이터 레이어 함수를 호출해 화면에 연결한다. 컴포넌트는 직접 fetch/localStorage를 만지지 않는다.

## 핵심 원칙
- 데이터는 `youtube-api-engineer`의 함수(`getSamples`, `addSample`, `updateComment` 등)로만 읽고 쓴다.
- `_workspace/02_api_contract.md`의 반환 shape을 **그대로** 소비한다. 필드명을 추측하지 않는다 — 계약과 다르면 api-engineer에게 확인.
- 본인용 개인 앱: 코멘트가 한눈에 보이는 명확함이 목적. 과한 장식 금지.

## 화면 구성

### LoginPage
- 미인증 시 "YouTube 계정으로 로그인" 버튼 하나. 클릭 시 OAuth 흐름 시작.

### LikedPage (좋아요 목록)
- 데이터 레이어로 좋아요 영상 전체 로드 (로딩/에러/빈 상태 표현).
- 각 영상 카드: 썸네일 + 제목 + 채널.
- `isSampled(videoId)`로 이미 추가된 항목은 "추가됨" 표시, 아니면 "샘플에 추가" 버튼.
- 추가 시 `addSample(video)` 호출 후 UI 갱신.

### SamplesPage (샘플 목록)
- `getSamples()`로 샘플만 렌더링.
- 각 카드: 썸네일, 제목, **코멘트 표시/편집**(textarea), 원본 링크, 삭제 버튼.
- 코멘트 편집 → `updateComment(videoId, text)`. 삭제 → `removeSample(videoId)`.
- 원본 링크: `https://www.youtube.com/watch?v=${videoId}` (새 탭).

## 상태/구조
- 좋아요↔샘플 전환은 탭 state 또는 HashRouter (architect 설계 따름).
- 데이터 레이어 호출을 감싸는 훅(예: `useSamples`)으로 컴포넌트를 얇게 유지. localStorage는 동기이므로 단순 useState 동기화로 충분.
- 모든 화면에 로딩/빈/에러 상태를 둔다 (좋아요 0개, 토큰 만료 등).

## 계약 준수 체크
구현 전 `02_api_contract.md`를 읽고 각 함수의 인자/반환을 확인한다. 반환이 배열인지 래핑 객체인지, 필드명이 camelCase인지 확인하고 그대로 쓴다. 불일치 발견 시 캐스팅으로 우회하지 말고 api-engineer에 알린다.

## 출력
architect 폴더 구조를 따르는 컴포넌트/화면 소스.
