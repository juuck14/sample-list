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

  const updateComment = useCallback(async (videoId, comment) => {
    await store.updateComment(videoId, comment)
    await refresh()
  }, [refresh])

  return { samples, refresh, addSample, removeSample, updateComment }
}
