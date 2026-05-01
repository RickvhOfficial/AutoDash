// Custom hook: cache-first render + server fetch + cache overschrijven + 30s polling (zoals dashboard).
// Server (via /api/dashboard-snapshot) blijft de bron van waarheid.
import { useEffect, useRef, useState } from 'react'
import { LOADER_MIN_VISIBLE_MS } from '../constants/uiTiming'
import { CACHE_KEY_DRIVER_STANDINGS, readCache, writeCache } from '../services/cacheService'
const PAGE_DATA_POLL_MS = 30000

export function useF1Drivers() {
  const cachedRef = useRef(readCache(CACHE_KEY_DRIVER_STANDINGS))
  const cached = cachedRef.current
  const initialDrivers = Array.isArray(cached?.seasonStats) ? cached.seasonStats : []

  const [drivers, setDrivers] = useState(initialDrivers)
  const [seasonYear, setSeasonYear] = useState(cached?.seasonStatsYear ?? null)
  const [loading, setLoading] = useState(initialDrivers.length === 0)
  const [refreshing, setRefreshing] = useState(initialDrivers.length > 0)
  const [error, setError] = useState(null)
  const requestRunningRef = useRef(false)

  useEffect(() => {
    let pollTimer = null
    let currentController = null
    let cancelled = false

    async function loadDrivers(signal) {
      if (requestRunningRef.current) return
      requestRunningRef.current = true
      const hadCachedData = (cachedRef.current?.seasonStats?.length ?? 0) > 0
      const refreshStartedAt = Date.now()

      if (!hadCachedData) {
        setLoading(true)
        setError(null)
      } else {
        setRefreshing(true)
      }

      try {
        const res = await fetch('/api/dashboard-snapshot', { signal })
        if (!res.ok) throw new Error('Coureurs konden niet worden geladen.')
        const data = await res.json()
        const list = Array.isArray(data?.seasonStats) ? data.seasonStats : []
        const year = data?.seasonStatsYear ?? null
        setDrivers(list)
        setSeasonYear(year)
        setError(null)
        writeCache(CACHE_KEY_DRIVER_STANDINGS, {
          seasonStats: list,
          seasonStatsYear: year,
        })
        cachedRef.current = {
          ...cachedRef.current,
          seasonStats: list,
          seasonStatsYear: year,
        }
      } catch (err) {
        if (err?.name === 'AbortError') return
        if (!hadCachedData) {
          setError(err?.message || 'Onbekende fout bij laden coureurs.')
        }
      } finally {
        if (!signal.aborted) {
          const elapsed = Date.now() - refreshStartedAt
          if (elapsed < LOADER_MIN_VISIBLE_MS) {
            await new Promise((r) => setTimeout(r, LOADER_MIN_VISIBLE_MS - elapsed))
          }
        }
        setLoading(false)
        setRefreshing(false)
        requestRunningRef.current = false
      }
    }

    async function tick() {
      if (cancelled) return
      currentController = new AbortController()
      await loadDrivers(currentController.signal)
      if (cancelled) return
      pollTimer = window.setTimeout(tick, PAGE_DATA_POLL_MS)
    }

    tick()
    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
      currentController?.abort()
    }
  }, [])

  return { drivers, seasonYear, loading, refreshing, error }
}
