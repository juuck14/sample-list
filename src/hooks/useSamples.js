// store/samples.js 를 감싼 React 훅. Drive API는 비동기이므로 로컬 state로 동기화한다.
import { useState, useCallback, useEffect } from 'react'
import * as store from '../store/samples.js'

export function useSamples() {
  const [samples, setSamples] = useState([])

  const refresh = useCallback(async () => {
    setSamples(await store.getSamples())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addSample = useCallback(async (video) => {
    await store.addSample(video)
    await refresh()
  }, [refresh])

  const removeSample = useCallback(async (videoId) => {
    await store.removeSample(videoId)
    await refresh()
  }, [refresh])

  // 코멘트는 입력 빈도가 높으므로 로컬 state를 먼저 낙관적으로 갱신하고
  // Drive 저장은 백그라운드로 보낸다(전체 refresh 재조회 없음).
  const updateComment = useCallback(async (videoId, comment) => {
    setSamples((prev) =>
      prev.map((s) => (s.videoId === videoId ? { ...s, comment } : s)),
    )
    await store.updateComment(videoId, comment)
  }, [])

  return { samples, refresh, addSample, removeSample, updateComment }
}
