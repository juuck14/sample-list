// Google Identity Services 토큰 클라이언트 래퍼.
// Client ID만 사용하며 client_secret이 필요 없다(브라우저/정적 호스팅 호환).
//
// 정적 호스팅 한계: refresh token은 받을 수 없다(서버 필요). 대신
//  (1) access_token을 만료시각과 함께 localStorage에 저장해 새로고침을 견디고
//  (2) 만료 시 prompt:'' 로 "조용한 재발급"(팝업 없음, 이미 동의했으므로)을 시도한다.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPE = 'https://www.googleapis.com/auth/youtube.readonly'
const STORE_KEY = 'sampleList.auth.v1'

let accessToken = null
let expiresAt = 0 // epoch ms
let tokenClient = null

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return
    const { token, exp } = JSON.parse(raw)
    if (token && exp && exp > Date.now()) {
      accessToken = token
      expiresAt = exp
    }
  } catch {
    /* 무시 */
  }
}
loadFromStorage()

function saveToStorage() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ token: accessToken, exp: expiresAt }))
  } catch {
    /* 무시 */
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORE_KEY)
  } catch {
    /* 무시 */
  }
}

function ensureClient() {
  if (tokenClient) return tokenClient
  if (!window.google || !window.google.accounts) {
    throw new Error('Google Identity Services 스크립트가 아직 로드되지 않았습니다.')
  }
  if (!CLIENT_ID) {
    throw new Error('VITE_GOOGLE_CLIENT_ID 가 설정되지 않았습니다 (.env 확인).')
  }
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: () => {}, // 매 요청 시 동적으로 교체
  })
  return tokenClient
}

// 내부 공통: 토큰 요청. prompt='' 면 조용히(가능하면 팝업 없이), 'consent'면 동의 창.
function requestToken(prompt) {
  return new Promise((resolve, reject) => {
    let client
    try {
      client = ensureClient()
    } catch (e) {
      reject(e)
      return
    }
    client.callback = (resp) => {
      if (resp.error) {
        reject(new Error(resp.error))
        return
      }
      accessToken = resp.access_token
      // expires_in(초) → 약간의 여유(60초)를 빼고 만료시각 계산
      const ttl = (Number(resp.expires_in) || 3600) - 60
      expiresAt = Date.now() + ttl * 1000
      saveToStorage()
      resolve(accessToken)
    }
    client.requestAccessToken({ prompt })
  })
}

// 명시적 로그인 (버튼 클릭). 필요 시 동의 창을 띄운다.
export function signIn() {
  return requestToken('')
}

// 앱 로드 시 자동 호출용: 저장된 토큰이 유효하면 그대로,
// 아니면 팝업 없이 조용히 재발급 시도. 실패하면 false 반환(로그인 버튼 노출).
export async function trySilentSignIn() {
  if (accessToken && expiresAt > Date.now()) return true
  try {
    await requestToken('')
    return true
  } catch {
    return false
  }
}

export function getToken() {
  if (accessToken && expiresAt > Date.now()) return accessToken
  return null
}

export function isSignedIn() {
  return !!getToken()
}

export function signOut() {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => {})
  }
  accessToken = null
  expiresAt = 0
  clearStorage()
}
