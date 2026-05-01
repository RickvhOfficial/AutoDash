// Centrale dashboard-hook: cache-first render + server fetch + cache overschrijven.
import { useEffect, useMemo, useRef, useState } from 'react'
import { LOADER_MIN_VISIBLE_MS } from '../constants/uiTiming'
import { CACHE_KEY, readCache, readUnsplashCache, writeCache } from '../services/cacheService'
import {
  buildFallbackPhotos,
  fetchDashboardBackgroundPhotos,
  getHourlyUnsplashCacheKey,
} from '../services/unsplashService'

const WEATHER_POLL_MS = 30000
const INITIAL_LOADING_MAX_WAIT_MS = 2200
export function useDashboardData() {
  const cached = readCache(CACHE_KEY)
  const currentSeasonYear = new Date().getFullYear()
  const canUseLegacySeasonStatsCache =
    !cached?.seasonStatsYear &&
    Array.isArray(cached?.seasonStats) &&
    cached.seasonStats.length > 0 &&
    Number(cached?.nextRace?.year) === currentSeasonYear

  // Bouwt een consistente state-shape voor alle dashboardwidgets.
  const buildWidgetState = (data, emptyValue, updatedAt) => {
    const normalizedData = data ?? emptyValue
    const hasData = Array.isArray(normalizedData)
      ? normalizedData.length > 0
      : Boolean(normalizedData)
    return {
      loading: !hasData,
      error: '',
      data: normalizedData,
      stale: false,
      lastUpdated: hasData ? updatedAt || null : null,
    }
  }

  const [nextRace, setNextRace] = useState(() =>
    buildWidgetState(cached?.nextRace, null, cached?.nextRaceUpdatedAt)
  )
  const [weather, setWeather] = useState(() =>
    buildWidgetState(cached?.weather, null, cached?.weatherUpdatedAt)
  )
  const [drivers, setDrivers] = useState(() =>
    buildWidgetState(cached?.drivers, [], cached?.driversUpdatedAt)
  )
  const [seasonStats, setSeasonStats] = useState(() =>
    buildWidgetState(
      cached?.seasonStatsYear === currentSeasonYear || canUseLegacySeasonStatsCache
        ? cached?.seasonStats
        : [],
      [],
      cached?.seasonStatsYear === currentSeasonYear || canUseLegacySeasonStatsCache
        ? cached?.seasonStatsUpdatedAt
        : null
    )
  )
  const [bgPhotos, setBgPhotos] = useState(() => {
    const hourlyCachedPhotos = readUnsplashCache(getHourlyUnsplashCacheKey())
    return Array.isArray(hourlyCachedPhotos) ? hourlyCachedPhotos : []
  })
  const [initialLoading, setInitialLoading] = useState(() => !cached)
  const [refreshing, setRefreshing] = useState(() => Boolean(cached))

  const didLoadOnceRef = useRef(!!cached)
  const requestRunningRef = useRef(false)
  const refreshDelayRef = useRef(WEATHER_POLL_MS)
  const refreshFailureStreakRef = useRef(0)

  const unsplashApiUrl = import.meta.env.VITE_UNSPLASH_API_URL || 'https://api.unsplash.com'
  const unsplashAccessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY

  const fallbackPhotos = useMemo(() => buildFallbackPhotos(), [])

  // Pollt dashboard-snapshot; cache wordt na elke succesvolle fetch overschreven.
  useEffect(() => {
    let refreshTimer = null
    let currentController = null
    const initialLoadingGuardTimer = setTimeout(() => {
      setInitialLoading(false)
      didLoadOnceRef.current = true
    }, INITIAL_LOADING_MAX_WAIT_MS)

    function scheduleNextPoll() {
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(loadDashboardData, refreshDelayRef.current)
    }

    async function loadDashboardData() {
      if (requestRunningRef.current) return
      requestRunningRef.current = true
      const refreshStartedAt = Date.now()
      setRefreshing(true)
      currentController = new AbortController()
      const signal = currentController.signal
      const cacheUpdate = {}
      setNextRace((prev) => ({ ...prev, loading: !prev.data, error: '' }))
      setWeather((prev) => ({ ...prev, loading: !prev.data, error: '' }))
      setDrivers((prev) => ({ ...prev, loading: prev.data.length === 0 && !prev.error, error: '' }))
      setSeasonStats((prev) => ({ ...prev, loading: prev.data.length === 0 && !prev.error, error: '' }))

      try {
        const res = await fetch('/api/dashboard-snapshot', { signal })
        if (!res.ok) throw new Error('Dashboard API tijdelijk niet beschikbaar.')
        const data = await res.json()
        const nowTs = Date.now()

        if (data?.nextRace) {
          setNextRace({
            loading: false,
            error: '',
            data: data.nextRace,
            stale: Boolean(data.stale),
            lastUpdated: data?.timestamps?.nextRaceUpdatedAt || nowTs,
          })
          cacheUpdate.nextRace = data.nextRace
          cacheUpdate.nextRaceUpdatedAt = data?.timestamps?.nextRaceUpdatedAt || nowTs
        } else {
          setNextRace((prev) =>
            prev.data
              ? { ...prev, loading: false, error: '', stale: true }
              : { ...prev, loading: false, error: 'Geen komende Grand Prix gevonden.', stale: false }
          )
        }

        if (data?.weather) {
          setWeather({
            loading: false,
            error: '',
            data: data.weather,
            stale: Boolean(data.stale),
            lastUpdated: data?.timestamps?.weatherUpdatedAt || nowTs,
          })
          cacheUpdate.weather = data.weather
          cacheUpdate.weatherUpdatedAt = data?.timestamps?.weatherUpdatedAt || nowTs
        } else {
          setWeather((prev) =>
            prev.data
              ? { ...prev, loading: false, error: '', stale: true }
              : { ...prev, loading: false, error: 'Weer tijdelijk niet beschikbaar.', stale: false }
          )
        }

        if (Array.isArray(data?.drivers) && data.drivers.length > 0) {
          setDrivers({
            loading: false,
            error: '',
            data: data.drivers,
            stale: Boolean(data.stale),
            lastUpdated: data?.timestamps?.driversUpdatedAt || nowTs,
          })
          cacheUpdate.drivers = data.drivers
          cacheUpdate.driversUpdatedAt = data?.timestamps?.driversUpdatedAt || nowTs
        } else {
          setDrivers((prev) =>
            prev.data.length > 0
              ? { ...prev, loading: false, error: '', stale: true }
              : { ...prev, loading: false, error: 'Coureurs tijdelijk niet beschikbaar.', stale: false }
          )
        }

        if (Array.isArray(data?.seasonStats) && data.seasonStats.length > 0) {
          setSeasonStats({
            loading: false,
            error: '',
            data: data.seasonStats,
            stale: Boolean(data.stale),
            lastUpdated: data?.timestamps?.seasonStatsUpdatedAt || nowTs,
          })
          cacheUpdate.seasonStats = data.seasonStats
          cacheUpdate.seasonStatsUpdatedAt = data?.timestamps?.seasonStatsUpdatedAt || nowTs
          cacheUpdate.seasonStatsYear = data?.seasonStatsYear || new Date().getFullYear()
        } else {
          setSeasonStats((prev) =>
            prev.data.length > 0
              ? { ...prev, loading: false, error: '', stale: true }
              : { ...prev, loading: false, error: 'Geen actuele seizoensstand beschikbaar.', stale: false }
          )
        }

        if (Object.keys(cacheUpdate).length > 0) {
          writeCache(CACHE_KEY, cacheUpdate)
        }
        refreshFailureStreakRef.current = 0
        refreshDelayRef.current = WEATHER_POLL_MS
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('[DashboardLoad]', error)
          setNextRace((prev) =>
            prev.data
              ? { ...prev, loading: false, error: '', stale: true }
              : { ...prev, loading: false, error: 'Race-data tijdelijk niet beschikbaar.', stale: false }
          )
          setWeather((prev) =>
            prev.data
              ? { ...prev, loading: false, error: '', stale: true }
              : { ...prev, loading: false, error: 'Weer tijdelijk niet beschikbaar.', stale: false }
          )
          setDrivers((prev) =>
            prev.data.length > 0
              ? { ...prev, loading: false, error: '', stale: true }
              : { ...prev, loading: false, error: 'Coureurs tijdelijk niet beschikbaar.', stale: false }
          )
          setSeasonStats((prev) =>
            prev.data.length > 0
              ? { ...prev, loading: false, error: '', stale: true }
              : { ...prev, loading: false, error: 'Geen actuele seizoensstand beschikbaar.', stale: false }
          )
        }
        refreshFailureStreakRef.current += 1
        refreshDelayRef.current = Math.min(
          10000 * (2 ** (refreshFailureStreakRef.current - 1)),
          60000
        )
      } finally {
        if (!signal.aborted) {
          const elapsed = Date.now() - refreshStartedAt
          if (elapsed < LOADER_MIN_VISIBLE_MS) {
            await new Promise((r) => setTimeout(r, LOADER_MIN_VISIBLE_MS - elapsed))
          }
        }
        if (!didLoadOnceRef.current) {
          didLoadOnceRef.current = true
          setInitialLoading(false)
        }
        setRefreshing(false)
        requestRunningRef.current = false
        scheduleNextPoll()
      }
    }

    loadDashboardData()
    return () => {
      clearTimeout(initialLoadingGuardTimer)
      if (refreshTimer) clearTimeout(refreshTimer)
      if (currentController) currentController.abort()
      requestRunningRef.current = false
    }
  }, [])

  // Achtergrondfotos: API + optionele client-cache (los van F1-data).
  useEffect(() => {
    const controller = new AbortController()
    async function loadUnsplashImages() {
      const photos = await fetchDashboardBackgroundPhotos({
        unsplashApiUrl,
        unsplashAccessKey,
        fallbackPhotos,
        signal: controller.signal,
      })
      setBgPhotos(photos)
    }
    loadUnsplashImages()
    return () => controller.abort()
  }, [fallbackPhotos, unsplashAccessKey, unsplashApiUrl])

  return {
    nextRace,
    weather,
    drivers,
    seasonStats,
    bgPhotos,
    fallbackPhotos,
    initialLoading,
    refreshing,
  }
}
