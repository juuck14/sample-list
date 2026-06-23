export default function LoginPage({ onSignIn, error }) {
  return (
    <div className="login">
      <h1>Sample List</h1>
      <p>YouTube에서 좋아요한 영상 중 음악 샘플로 쓸 것을 골라 메모와 함께 모아둡니다.</p>
      <button className="login__btn" onClick={onSignIn}>
        YouTube 계정으로 로그인
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  )
}
