import { useEffect, useState } from 'react'
import { fetchLikedVideos } from '../api/youtube.js'
import { isSampled, backfillLikedRanks } from '../store/samples.js'

// 좋아요한 영상 모달. samples: 추가됨 표시 갱신용, onAdd: 샘플 추가, onClose: 닫기, onSync: 백필 후 새로고침
export default function LikedModal({ samples, onAdd, onClose, onSync }) {
  const [videos, setVideos] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setStatus('loading')
    fetchLikedVideos()
      .then((list) => {
        if (!alive) return
        setVideos(list)
        setStatus('ready')
        // 기존 샘플의 likedRank를 좋아요 순서로 보정 → 목록 새로고침
        if (backfillLikedRanks(list) && onSync) onSync()
      })
      .catch((e) => {
        if (!alive) return
        setError(e.message)
        setStatus('error')
      })
    return () => { alive = false }
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sl-scroll" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div style={{ marginRight: 'auto' }}>
            <div className="modal__title">좋아요한 영상</div>
            <div className="modal__sub">샘플로 쓸 영상을 골라 추가하세요</div>
          </div>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        {status === 'loading' && <div className="modal__state">좋아요 목록 불러오는 중…</div>}
        {status === 'error' && <div className="modal__state error">불러오기 실패: {error}</div>}
        {status === 'ready' && videos.length === 0 && (
          <div className="modal__state">좋아요한 영상이 없습니다.</div>
        )}

        {status === 'ready' && videos.length > 0 && (
          <div className="modal__body">
            {videos.map((v) => {
              const sampled = samples.some((s) => s.videoId === v.videoId) || isSampled(v.videoId)
              return (
                <div className="lcard" key={v.videoId}>
                  <div className="lcard__thumb">
                    {v.thumbnail ? <img src={v.thumbnail} alt={v.title} /> : null}
                    <span className="lcard__play">
                      <span className="lcard__play-circle">
                        <span className="lcard__play-tri" />
                      </span>
                    </span>
                  </div>
                  <div className="lcard__body">
                    <div className="lcard__title">{v.title}</div>
                    <div className="lcard__channel">{v.channelTitle}</div>
                    <div className="lcard__foot">
                      {sampled ? (
                        <span className="lcard__added">✓ 추가됨</span>
                      ) : (
                        <button className="lcard__add" onClick={() => onAdd(v)}>+ 샘플에 추가</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
