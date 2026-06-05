import { useCallback, useEffect, useState } from 'react'
import { fetchMotorsportNews } from '../services/motorsportNewsService'

export function useMotorsportNews() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [source, setSource] = useState(null)

  const load = useCallback(async (signal) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMotorsportNews({ signal })
      setArticles(data.articles)
      setSource(data.source ?? null)
    } catch (err) {
      if (signal?.aborted || err?.name === 'AbortError') return
      setArticles([])
      setSource(null)
      setError(err instanceof Error ? err.message : 'Nieuws kon niet worden geladen.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const retry = useCallback(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  return { articles, loading, error, source, retry }
}
