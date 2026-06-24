import { useEffect, useRef, useState } from 'react'
import { watchUrl } from '../store/samples.js'
import { dateLabel } from '../utils/format.js'

const SAVE_DELAY = 600 // ms: 입력이 멈춘 뒤에만 Drive에 저장

// 샘플 목록 카드: 썸네일(재생 오버레이 + 길이), 제목/채널, 자동높이 코멘트, 날짜/원본/삭제
export default function VideoCard({ video, onRemove, onCommentChange }) {
  const url = watchUrl(video.videoId)
  const taRef = useRef(null)

  // 타이핑은 로컬 state로 즉시 반영해 입력 지연을 없앤다.
  const [comment, setComment] = useState(video.comment)
  const saveTimer = useRef(null)

  // 외부(동기화 등)에서 코멘트가 바뀌면 로컬 값에 반영
  useEffect(() => { setComment(video.comment) }, [video.comment])

  function fit(el) {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  // 초기/코멘트 변경 시 높이 맞춤
  useEffect(() => { fit(taRef.current) }, [comment])

  function scheduleSave(value) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null
      onCommentChange(video.videoId, value)
    }, SAVE_DELAY)
  }

  function flushSave(value) {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    if (value !== video.comment) onCommentChange(video.videoId, value)
  }

  // 언마운트 시 미저장분 보존
  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
  }, [])

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
          value={comment}
          onChange={(e) => {
            setComment(e.target.value)
            fit(e.target)
            scheduleSave(e.target.value)
          }}
          onBlur={(e) => flushSave(e.target.value)}
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
