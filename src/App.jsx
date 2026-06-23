import { useState, useEffect } from 'react'
import { signIn, signOut, isSignedIn, trySilentSignIn } from './auth/google.js'
import { useSamples } from './hooks/useSamples.js'
import LoginPage from './pages/LoginPage.jsx'
import SamplesPage from './pages/SamplesPage.jsx'
import LikedModal from './components/LikedModal.jsx'

export default function App() {
  const [signedIn, setSignedIn] = useState(isSignedIn())
  const [authChecking, setAuthChecking] = useState(!isSignedIn())
  const [authError, setAuthError] = useState('')
  const [sort, setSort] = useState('recent') // recent | oldest | title
  const [modalOpen, setModalOpen] = useState(false)
  const { samples, refresh, addSample, removeSample, updateComment } = useSamples()

  // 앱 로드 시 저장된 토큰/조용한 재발급으로 자동 로그인 시도 (팝업 없음).
  useEffect(() => {
    if (signedIn) return
    let alive = true
    // GIS 스크립트 로드를 잠깐 기다린 뒤 시도
    const t = setTimeout(() => {
      trySilentSignIn()
        .then((ok) => { if (alive) setSignedIn(ok) })
        .finally(() => { if (alive) setAuthChecking(false) })
    }, 300)
    return () => { alive = false; clearTimeout(t) }
  }, [])

  async function handleSignIn() {
    setAuthError('')
    try {
      await signIn()
      setSignedIn(true)
    } catch (e) {
      setAuthError(e.message)
    }
  }

  function handleSignOut() {
    signOut()
    setSignedIn(false)
  }

  if (authChecking) return <div className="state">로그인 확인 중…</div>
  if (!signedIn) return <LoginPage onSignIn={handleSignIn} error={authError} />

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand">
            <span className="brand__name">Sample List</span>
            <span className="brand__count">{samples.length} samples</span>
          </div>

          <div className="sort">
            <span className="sort__label">SORT</span>
            <select className="sort__select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recent">최근 추가순</option>
              <option value="oldest">오래된순</option>
              <option value="title">제목순</option>
            </select>
          </div>

          <button className="btn-add" onClick={() => setModalOpen(true)}>
            <span className="btn-add__plus">+</span> 좋아요에서 추가
          </button>
          <button className="btn-signout" onClick={handleSignOut}>로그아웃</button>
        </div>
      </header>

      <main className="content">
        <SamplesPage
          samples={samples}
          sort={sort}
          onRemove={removeSample}
          onCommentChange={updateComment}
          onOpenModal={() => setModalOpen(true)}
        />
      </main>

      {modalOpen && (
        <LikedModal
          samples={samples}
          onAdd={addSample}
          onSync={refresh}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
