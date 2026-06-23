// store/samples.js 를 감싼 React 훅. localStorage는 동기이므로 로컬 state로 동기화한다.
import { useState, useCallback } from 'react'
import * as store from '../store/samples.js'

export function useSamples() {
  const [samples, setSamples] = useState(() => store.getSamples())

  const refresh = useCallback(() => setSamples(store.getSamples()), [])

  const addSample = useCallback((video) => {
    store.addSample(video)
    setSamples(store.getSamples())
  }, [])

  const removeSample = useCallback((videoId) => {
    store.removeSample(videoId)
    setSamples(store.getSamples())
  }, [])

  const updateComment = useCallback((videoId, comment) => {
    store.updateComment(videoId, comment)
    setSamples(store.getSamples())
  }, [])

  return { samples, refresh, addSample, removeSample, updateComment }
}
