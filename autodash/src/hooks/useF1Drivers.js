// Custom hook: cache-first + directe GET naar /api/dashboard-snapshot, daarna 30s polling.
// Geen “wachten op de server”: de client start zelf meteen meerdere pogingen bij koude start (lege snapshot).
import { useEffect, useRef, useState } from 'react'
import {
  LOADER_MIN_VISIBLE_MS,
  SNAPSHOT_STARTUP_MAX_ATTEMPTS,
  SNAPSHOT_STARTUP_RETRY_BASE_MS,
} from '../constants/uiTiming'
import { CACHE_KEY_DRIVER_STANDINGS, readCache, writeCache } from '../services/cacheService'
import { fetchDashboardSnapshotForStandings } from '../services/dashboardService'
import { enrichDriverList } from '../utils/driverList'

const PAGE_DATA_POLL_MS = 30000

export function useF1Drivers() {
  const cachedRef = useRef(readCache(CACHE_KEY_DRIVER_STANDINGS))
  const cached = cachedRef.current
  const initialDrivers = enrichDriverList(cached?.seasonStats)

  const [drivers, setDrivers] = useState(initialDrivers)
  const [seasonYear, setSeasonYear] = useState(cached?.seasonStatsYear ?? null)
  const [loading, setLoading] = useState(initialDrivers.length === 0)
  const [error, setError] = useState(null)

  useEffect(() => {
    let pollTimer = null
    let activeController = null
    let cancelled = false

    async function loadDrivers(signal) {
      const hadCachedData = (cachedRef.current?.seasonStats?.length ?? 0) > 0
      const refreshStartedAt = Date.now()

      if (!hadCachedData) {
        setLoading(true)
        setError(null)
      }

      const coldStart = !hadCachedData
      const maxAttempts = coldStart ? SNAPSHOT_STARTUP_MAX_ATTEMPTS : 1
      let list = []
      let year = null
      let lastError = null

      try {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (signal.aborted) break
          if (attempt > 0) {
            await new Promise((r) =>
              setTimeout(
                r,
                Math.min(800, SNAPSHOT_STARTUP_RETRY_BASE_MS * attempt)
              )
            )
          }
          try {
            const data = await fetchDashboardSnapshotForStandings({ signal })
            list = enrichDriverList(data?.seasonStats)
            year = data?.seasonStatsYear ?? null
            lastError = null
            if (list.length > 0) break
            if (!coldStart) break
          } catch (err) {
            if (err?.name === 'AbortError') break
            lastError = err
            if (!coldStart || attempt === maxAttempts - 1) break
          }
        }

        if (signal.aborted) return

        if (list.length > 0) {
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
        } else if (coldStart && lastError) {
          setDrivers([])
          setError(lastError?.message || 'Onbekende fout bij laden coureurs.')
        } else if (coldStart) {
          setDrivers([])
          setSeasonYear(year)
          setError(null)
        } else if (lastError) {
          setError(null)
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
          setLoading(false)
        }
      }
    }

    async function runPoll() {
      if (cancelled) return
      activeController = new AbortController()
      await loadDrivers(activeController.signal)
      if (!cancelled) {
        pollTimer = window.setTimeout(runPoll, PAGE_DATA_POLL_MS)
      }
    }

    ;(async function initialFetch() {
      activeController = new AbortController()
      await loadDrivers(activeController.signal)
      if (!cancelled) {
        pollTimer = window.setTimeout(runPoll, PAGE_DATA_POLL_MS)
      }
    })()

    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
      activeController?.abort()
    }
  }, [])

  return { drivers, seasonYear, loading, error }
}
