---
name: youtube-api-integration
description: "백엔드 없이 브라우저에서 Google OAuth PKCE 로그인과 YouTube Data API(좋아요 목록, 페이지네이션)를 연동하고 localStorage 데이터 레이어를 구현한다. youtube-api-engineer 에이전트가 사용. 인증, 토큰, 좋아요 불러오기, 데이터 저장 구현 시 반드시 적용."
---

# YouTube API Integration — 인증 + 데이터 레이어

백엔드/시크릿 없이 브라우저 단독으로 Google 인증과 YouTube Data API를 다루고, 샘플/코멘트를 localStorage에 저장한다.

## 핵심 원칙
- 노출 가능한 값은 **Client ID뿐**. 실제 방어선은 Google Console의 "승인된 JavaScript 원본"(도메인 화이트리스트)이다. client_secret을 코드에 넣지 않는다.
- API 응답을 그대로 UI로 흘리지 않는다. architect 스키마(camelCase)로 **정규화**해서 반환한다.
- 반환 함수의 정확한 shape을 `_workspace/02_api_contract.md`에 적어 UI/QA가 대조하게 한다.

## 1. OAuth 2.0 PKCE (정적 호스팅 호환)

Authorization Code + PKCE 흐름을 쓴다 (Implicit는 deprecated). 시크릿 불필요.

흐름:
1. `code_verifier`(랜덤) 생성 → SHA-256 해시한 `code_challenge` 만듦
2. `https://accounts.google.com/o/oauth2/v2/auth`로 리다이렉트
   - `client_id`, `redirect_uri`(현재 origin), `response_type=code`,
   - `scope=https://www.googleapis.com/auth/youtube.readonly`,
   - `code_challenge`, `code_challenge_method=S256`, `state`(CSRF 방지)
3. 리다이렉트로 돌아온 `code`를 `https://oauth2.googleapis.com/token`에 POST
   - `code`, `client_id`, `code_verifier`, `grant_type=authorization_code`, `redirect_uri` (시크릿 없음)
4. `access_token`(약 1시간) 수령 → 메모리/sessionStorage 보관

> 더 단순하게 가려면 Google Identity Services(GIS) 토큰 클라이언트(`google.accounts.oauth2.initTokenClient`)로 access token만 받아도 된다. 본인 전용이면 GIS가 구현이 가장 짧다. PKCE 직접 구현은 의존성이 없다는 장점.

`code_verifier`/`state`는 리다이렉트 동안 sessionStorage에 임시 보관 후 사용 즉시 삭제.

## 2. 좋아요 목록 불러오기 (페이지네이션)

```
GET https://www.googleapis.com/youtube/v3/videos
  ?part=snippet&myRating=like&maxResults=50&pageToken=<token>
Authorization: Bearer <access_token>
```

- 응답의 `nextPageToken`이 있으면 없을 때까지 반복 호출해 전부 모은다.
- 좋아요는 `myRating=like`로만 가져올 수 있다(별도 playlist 불필요).

### 정규화 (raw → 계약 shape)

```js
items.map(it => ({
  videoId: it.id,
  title: it.snippet.title,
  thumbnail: it.snippet.thumbnails.medium?.url ?? it.snippet.thumbnails.default.url,
  channelTitle: it.snippet.channelTitle,
}))
```

## 3. localStorage 데이터 레이어

architect 스키마를 따른다. UI가 직접 localStorage를 만지지 않도록 함수로 캡슐화한다. 권장 함수 시그니처(계약):

```js
getSamples(): Sample[]
addSample(video): void          // 좋아요 항목을 samples에 추가(addedAt 채움)
removeSample(videoId): void
updateComment(videoId, comment): void
isSampled(videoId): boolean     // 좋아요 목록에서 이미 추가됐는지 표시용
```

- 단일 키(`sampleList.v1`)에 `{ samples: [...] }`로 저장. 읽기 실패/JSON 깨짐은 빈 배열로 폴백.
- 좋아요 목록 자체는 저장하지 않는다.

## 4. 토큰/에러 처리
- 401/만료 → 재로그인 트리거. 조용히 실패 금지.
- API 실패는 UI가 표현할 수 있도록 에러 상태를 반환(throw 또는 result 객체).

## 출력
인증/api/store 소스 + `_workspace/02_api_contract.md`(노출 함수 시그니처와 반환 타입). 시그니처 확정 시 ui-engineer에 통보.
