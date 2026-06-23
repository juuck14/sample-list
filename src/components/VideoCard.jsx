import { useEffect, useRef } from 'react'
import { watchUrl } from '../store/samples.js'
import { dateLabel } from '../utils/format.js'

// 샘플 목록 카드: 썸네일(재생 오버레이 + 길이), 제목/채널, 자동높이 코멘트, 날짜/원본/삭제
export default function VideoCard({ video, onRemove, onCommentChange }) {
  const url = watchUrl(video.videoId)
  const taRef = useRef(null)

  function fit(el) {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  // 초기/코멘트 변경 시 높이 맞춤
  useEffect(() => { fit(taRef.current) }, [video.comment])

  return (
    <article className="card">
      <a href={url} target="_blank" rel="noreferrer" className="thumb-link">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} className="thumb" />
        ) : null}
        <span className="thumb-play">
          <span className="thumb-play__circle">
            <span className="thumb-play__tri" />
          </span>
        </span>
        {video.dur ? <span className="thumb-dur">{video.dur}</span> : null}
      </a>

      <div className="card-body">
        <div>
          <a href={url} target="_blank" rel="noreferrer" className="title">{video.title}</a>
          <div className="channel">{video.channelTitle}</div>
        </div>

        <textarea
          ref={taRef}
          className="comment sl-scroll"
          rows={1}
          placeholder="왜 저장했는지 메모… (예: 드럼 브레이크 0:12)"
          value={video.comment}
          onChange={(e) => onCommentChange(video.videoId, e.target.value)}
          onInput={(e) => fit(e.target)}
        />

        <div className="card-foot">
          <span className="card-date">{dateLabel(video.addedAt)}</span>
          <div className="card-actions">
            <a href={url} target="_blank" rel="noreferrer" className="link-src">원본 ↗</a>
            <button className="btn-remove" onClick={() => onRemove(video.videoId)}>삭제</button>
          </div>
        </div>
      </div>
    </article>
  )
}
