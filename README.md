# Sample List

내 YouTube **좋아요한 영상**을 불러와서, 그중 음악 샘플로 쓸만한 것들만 골라
간단한 코멘트를 달아 따로 관리하는 개인용 웹앱.

> "이 노래를 내가 왜 저장했지?" 싶을 때, 그때 남긴 메모를 보고 떠올릴 수 있게 하는 게 목적.

---

## 목적 / 배경

- 음악을 만들기 위해 샘플로 쓸만한 노래를 YouTube에서 좋아요 눌러 기록 중.
- 그런데 좋아요 목록에는 샘플용 말고 그냥 개인적으로 좋아한 영상도 섞여 있음.
- 그래서:
  1. 좋아요한 영상을 전부 불러오고
  2. 그중 **샘플용으로 쓸 것만 선택**해서 별도 리스트로 관리하고
  3. 각 영상에 **왜 저장했는지 코멘트**를 달고
  4. 나중에 목록에서 코멘트 + **원본 영상 링크**를 한눈에 본다.

---

## 핵심 기능

| 기능 | 설명 |
|------|------|
| YouTube 로그인 | 내 계정으로 OAuth 인증 (본인 계정만 사용) |
| 좋아요 목록 불러오기 | `videos.list (myRating=like)` 로 좋아요한 영상 전체 가져오기 |
| 샘플 선택 | 좋아요 목록에서 샘플용 영상만 골라 별도 리스트에 추가 |
| 코멘트 작성 | 각 샘플 영상에 메모 작성 / 수정 |
| 목록 보기 | 썸네일 · 제목 · 코멘트 · 원본 링크를 카드/리스트로 표시 |
| 검색 / 필터 | (선택) 제목·코멘트로 검색 |

---

## 기술 스택

- **프론트엔드만** (백엔드 / DB 없음)
- **React** + Vite
- **YouTube Data API v3**
- **Google OAuth 2.0 (PKCE)** — 브라우저에서 직접 인증, 서버 불필요
- **localStorage** — 선택한 샘플 목록 + 코멘트 저장

### 백엔드 없이 가능한가? → **가능함**

- **인증**: Google OAuth 2.0의 *PKCE 흐름*은 클라이언트 시크릿 없이 브라우저에서 완결됨.
  Google Identity Services (GIS) 라이브러리로 access token만 받아 API 호출.
- **데이터 읽기**: 좋아요 목록은 매번 YouTube API에서 실시간으로 불러옴 (저장 불필요).
- **데이터 쓰기**: "샘플로 선택했다"는 표시와 코멘트는 YouTube에 저장할 수 없으므로
  → 브라우저 **localStorage**에 `{ videoId, comment, addedAt }` 형태로 저장.

> ⚠️ localStorage 한계: 한 브라우저/기기에만 저장됨. 기기 바꾸거나 캐시 지우면 코멘트 사라짐.
> 추후 백업이 필요하면 **JSON 내보내기/가져오기** 기능을 추가하거나, 그때 가서 가벼운 저장소
> (예: GitHub Gist, Firebase, Supabase) 연동을 고려.

---

## 데이터 구조 (localStorage)

```json
{
  "samples": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "Artist - Track",
      "thumbnail": "https://i.ytimg.com/...",
      "channelTitle": "Artist",
      "comment": "드럼 브레이크 4마디, 80년대 펑크 느낌. 인트로 0:12부터",
      "addedAt": "2026-06-23T10:00:00Z"
    }
  ]
}
```

- 좋아요 목록 화면: API에서 받아온 전체 좋아요 영상 + 각 영상이 이미 `samples`에 있는지 표시.
- 샘플 목록 화면: `samples` 배열만 렌더링. 영상 링크는 `https://www.youtube.com/watch?v=${videoId}`.

---

## YouTube API 사용

### 필요한 권한 (scope)
- `https://www.googleapis.com/auth/youtube.readonly`

### 주요 엔드포인트
- 좋아요한 영상:
  `GET https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=50`
  - `pageToken` 으로 페이지네이션 (좋아요 많으면 반복 호출).

### 사전 준비 (Google Cloud Console)
1. 프로젝트 생성 → **YouTube Data API v3** 사용 설정
2. **OAuth 동의 화면** 구성 (테스트 사용자에 본인 계정 추가 → 게시 안 해도 됨)
3. **OAuth 2.0 클라이언트 ID** 생성 (유형: 웹 애플리케이션)
   - 승인된 자바스크립트 원본: `http://localhost:5173` (개발), 배포 도메인
4. 발급받은 **Client ID** 를 `.env` 에 넣기

```
VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
```

> API 키/시크릿이 아니라 **Client ID** 만 필요 (PKCE라 시크릿 노출 위험 없음).

---

## 화면 구성 (초안)

1. **로그인 화면** — "YouTube 계정으로 로그인" 버튼
2. **좋아요 목록** — 그리드/리스트, 각 카드에 "샘플에 추가" 버튼
3. **샘플 목록** — 코멘트 표시·편집, 원본 링크, 삭제
4. (탭 or 라우팅으로 좋아요 ↔ 샘플 전환)

---

## 개발 / 실행

```bash
npm install
cp .env.example .env       # 그리고 VITE_GOOGLE_CLIENT_ID 채우기
npm run dev                # http://localhost:5173
npm run build              # dist/ 생성
npm run deploy             # gh-pages 브랜치로 배포
```

### 처음 세팅 (한 번만)
1. Google Cloud Console → YouTube Data API v3 사용 설정
2. OAuth 동의 화면 구성 + 테스트 사용자에 본인 계정 추가
3. OAuth 2.0 클라이언트 ID(웹) 생성 → 승인된 JS 원본에
   `http://localhost:5173` 과 `https://<user>.github.io` 등록
4. 발급된 Client ID를 `.env`의 `VITE_GOOGLE_CLIENT_ID`에 입력
5. 저장소명이 `sample-list`가 아니면 `vite.config.js`의 `base`를 `/저장소명/`으로 수정

---

## 로드맵

- [x] Vite + React 프로젝트 초기화
- [x] Google OAuth 로그인 (GIS 토큰, 시크릿 없음)
- [x] 좋아요 목록 불러오기 (+ 페이지네이션)
- [x] 샘플 선택 / 해제
- [x] 코멘트 작성·수정·저장 (localStorage)
- [x] 샘플 목록 화면
- [ ] (선택) JSON 내보내기/가져오기 백업
- [ ] (선택) 제목·코멘트 검색
- [x] 배포 스크립트 (gh-pages) — 실제 배포는 저장소 연결 후
- [ ] 실계정 런타임 검증 (Client ID 설정 후)
