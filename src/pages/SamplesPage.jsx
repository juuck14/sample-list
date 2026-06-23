import VideoCard from '../components/VideoCard.jsx'
import { sortSamples } from '../utils/format.js'

export default function SamplesPage({ samples, sort, onRemove, onCommentChange, onOpenModal }) {
  if (samples.length === 0) {
    return (
      <div className="empty">
        <div className="empty__icon">♪</div>
        <div className="empty__title">아직 샘플이 없어요</div>
        <p className="empty__text">좋아요한 영상 중 샘플로 쓸 것을 골라 메모와 함께 모아두세요.</p>
        <button className="empty__btn" onClick={onOpenModal}>+ 좋아요에서 추가</button>
      </div>
    )
  }

  const sorted = sortSamples(samples, sort)
  return (
    <div className="grid">
      {sorted.map((s) => (
        <VideoCard
          key={s.videoId}
          video={s}
          onRemove={onRemove}
          onCommentChange={onCommentChange}
        />
      ))}
    </div>
  )
}
