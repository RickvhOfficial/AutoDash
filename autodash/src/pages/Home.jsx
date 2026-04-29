import axios from 'axios'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'

// Route: /. — HomeHero staat in App.jsx buiten <main> (volle breedte, geen menu-padding).
// Unsplash — Abhinand Venugopal: unsplash.com/photos/a-man-driving-a-race-car-on-top-of-a-race-track-1WZfzLWBSi4
const HERO_IMG =
  'https://images.unsplash.com/photo-1728116693268-125c5d6ad9e2?auto=format&fit=crop&w=1920&q=80'

export const HOME_HERO_HEIGHT_PX = 250

export function HomeHero() {
  return (
    <section
      className="relative w-full shrink-0 border-b border-slate-800"
      style={{ height: HOME_HERO_HEIGHT_PX, maxHeight: HOME_HERO_HEIGHT_PX }}
    >
      <div className="relative h-full w-full">
        <img
          src={HERO_IMG}
          alt="Formule 1-raceauto op het circuit — hero"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/15 to-slate-950/70" />
        <div className="absolute inset-x-0 top-24 bottom-0 z-10 flex flex-col justify-center lg:pl-[5rem]">
          <div className="mx-auto w-full max-w-6xl px-6 py-2 md:px-10">
            <div className="inline-block max-w-full">
              <h1 className="text-3xl font-extrabold tracking-tight text-white [text-shadow:0_5px_18px_rgba(0,0,0,0.95)] md:text-5xl lg:text-6xl">
                Welkom bij{' '}
                <span className="text-[#d50000] italic [text-shadow:0_4px_12px_rgba(0,0,0,0.88)]">Auto</span>
                <span className="text-white italic">Dash</span>
              </h1>
              <p className="mt-2 max-w-xl text-base font-medium leading-relaxed text-white [text-shadow:0_3px_10px_rgba(0,0,0,0.92)] md:text-xl">
                Jouw dashboard voor races, tijden en weer op het circuit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Statische nationaliteitsmap 2026 F1-rijders ────────────────────────────
// OpenF1 levert country_code=null voor alle rijders; bevestigd via session 11253 (Suzuka 2026).
// ISO 3166-1 alpha-2 (kleine letters) voor flagcdn.com.
const DRIVER_NATIONALITIES = {
  1:  'nl', // Max Verstappen / kampioenschapsnummer (huidige seizoen-data)
  3:  'nl', // Max Verstappen    (Red Bull)
  4:  'gb', // Lando Norris
  5:  'br', // Gabriel Bortoleto (Audi)
  6:  'fr', // Isack Hadjar      (Red Bull)
  10: 'fr', // Pierre Gasly      (Alpine)
  11: 'mx', // Sergio Perez      (Cadillac)
  12: 'it', // Kimi Antonelli    (Mercedes)
  14: 'es', // Fernando Alonso   (Aston Martin)
  16: 'mc', // Charles Leclerc   (Ferrari)
  18: 'ca', // Lance Stroll      (Aston Martin)
  23: 'th', // Alexander Albon   (Williams)
  27: 'de', // Nico Hülkenberg   (Audi)
  30: 'nz', // Liam Lawson       (Racing Bulls)
  31: 'fr', // Esteban Ocon      (Haas)
  41: 'gb', // Arvid Lindblad    (Racing Bulls)
  43: 'ar', // Franco Colapinto  (Alpine)
  44: 'gb', // Lewis Hamilton    (Ferrari)
  55: 'es', // Carlos Sainz      (Williams)
  63: 'gb', // George Russell    (Mercedes)
  77: 'fi', // Valtteri Bottas   (Cadillac)
  81: 'au', // Oscar Piastri     (McLaren)
  87: 'gb', // Oliver Bearman    (Haas)
}

function driverFlag(driverNumber) {
  const code = DRIVER_NATIONALITIES[driverNumber]
  return code ? `https://flagcdn.com/w40/${code}.png` : ''
}

// ── Hardcoded circuit-coördinaten (fallback voor geocoding) ───────────────
const CIRCUIT_COORDS = {
  Sakhir:               { latitude: 26.0325,  longitude: 50.5106   },
  Jeddah:               { latitude: 21.6319,  longitude: 39.1044   },
  Melbourne:            { latitude: -37.8497, longitude: 144.968   },
  Suzuka:               { latitude: 34.8431,  longitude: 136.541   },
  Shanghai:             { latitude: 31.3389,  longitude: 121.2197  },
  Miami:                { latitude: 25.9581,  longitude: -80.2389  },
  Imola:                { latitude: 44.3439,  longitude: 11.7167   },
  'Monte Carlo':        { latitude: 43.7347,  longitude: 7.4206    },
  Catalunya:            { latitude: 41.57,    longitude: 2.2611    },
  Montreal:             { latitude: 45.5006,  longitude: -73.5228  },
  Spielberg:            { latitude: 47.2197,  longitude: 14.7647   },
  Silverstone:          { latitude: 52.0786,  longitude: -1.0169   },
  Hungaroring:          { latitude: 47.5789,  longitude: 19.2486   },
  'Spa-Francorchamps':  { latitude: 50.4372,  longitude: 5.9714    },
  Zandvoort:            { latitude: 52.3888,  longitude: 4.5409    },
  Monza:                { latitude: 45.6156,  longitude: 9.2811    },
  Baku:                 { latitude: 40.3725,  longitude: 49.8533   },
  Singapore:            { latitude: 1.2914,   longitude: 103.8644  },
  Austin:               { latitude: 30.1328,  longitude: -97.6411  },
  'Mexico City':        { latitude: 19.4042,  longitude: -99.0907  },
  Interlagos:           { latitude: -23.7036, longitude: -46.6997  },
  'Las Vegas':          { latitude: 36.1147,  longitude: -115.1728 },
  Lusail:               { latitude: 25.49,    longitude: 51.4542   },
  'Yas Marina Circuit': { latitude: 24.4672,  longitude: 54.6031   },
  Madring:              { latitude: 40.4534,  longitude: -3.6883   },
}

// ── localStorage-cache helpers ────────────────────────────────────────────
const CACHE_KEY = 'autodash_cache_v2'
const CACHE_MAX_AGE_MS = 60 * 60 * 1000 // 60 minuten
const UNSPLASH_BG_CACHE_KEY = 'autodash_unsplash_bg_v1'
const UNSPLASH_BG_TTL_MS = 60 * 60 * 1000 // 60 minuten
const UNSPLASH_UTM = 'utm_source=autodash&utm_medium=referral'

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cache = JSON.parse(raw)
    if (!cache.savedAt || Date.now() - cache.savedAt > CACHE_MAX_AGE_MS) return null
    return cache
  } catch {
    return null
  }
}

function writeCache(partial) {
  try {
    const existing = readCache() || {}
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...existing, ...partial, savedAt: Date.now() })
    )
  } catch {
    // localStorage vol of niet beschikbaar
  }
}

function readUnsplashCache() {
  try {
    const raw = localStorage.getItem(UNSPLASH_BG_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed.savedAt || Date.now() - parsed.savedAt > UNSPLASH_BG_TTL_MS) return null
    if (!Array.isArray(parsed.photos) || parsed.photos.length !== 5) return null
    return parsed.photos
  } catch {
    return null
  }
}

function writeUnsplashCache(photos) {
  try {
    localStorage.setItem(
      UNSPLASH_BG_CACHE_KEY,
      JSON.stringify({ photos, savedAt: Date.now() })
    )
  } catch {
    // localStorage vol of niet beschikbaar
  }
}

// ── Component ─────────────────────────────────────────────────────────────
export default function Home() {
  const cached = readCache()
  const currentSeasonYear = new Date().getFullYear()
  const canUseLegacySeasonStatsCache =
    !cached?.seasonStatsYear &&
    Array.isArray(cached?.seasonStats) &&
    cached.seasonStats.length > 0 &&
    Number(cached?.nextRace?.year) === currentSeasonYear
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
  // State initialiseren vanuit cache zodat data direct zichtbaar is na page refresh
  const [nextRace, setNextRace] = useState(() => buildWidgetState(cached?.nextRace, null, cached?.nextRaceUpdatedAt))
  const [weather, setWeather] = useState(() => buildWidgetState(cached?.weather, null, cached?.weatherUpdatedAt))
  const [drivers, setDrivers] = useState(() => buildWidgetState(cached?.drivers, [], cached?.driversUpdatedAt))
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
  const [myLaps] = useState(() => {
    const raw = localStorage.getItem('lapTimes')
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [bgPhotos, setBgPhotos] = useState([])
  // Toon initial spinner alleen als er geen cache is
  const [initialLoading, setInitialLoading] = useState(() => !cached)
  const [refreshing, setRefreshing] = useState(false)

  const didLoadOnceRef = useRef(!!cached)
  const requestRunningRef = useRef(false)
  const refreshDelayRef = useRef(30000)
  const refreshFailureStreakRef = useRef(0)
  const latestRaceDataRef = useRef(cached?.nextRace ?? null)
  const latestCompletedRaceSessionKeyRef = useRef(null)
  const lastOpenF1FetchAtRef = useRef(
    Math.max(
      Number(cached?.nextRaceUpdatedAt || 0),
      Number(cached?.driversUpdatedAt || 0),
      Number(cached?.seasonStatsUpdatedAt || 0)
    )
  )

  const WEATHER_POLL_MS = 30000
  const OPENF1_POLL_MS = 180000

  const openF1Base   = import.meta.env.VITE_OPENF1_URL     || 'https://api.openf1.org/v1'
  const openMeteoUrl = import.meta.env.VITE_OPEN_METEO_URL || 'https://api.open-meteo.com/v1/forecast'
  const unsplashApiUrl    = import.meta.env.VITE_UNSPLASH_API_URL || 'https://api.unsplash.com'
  const unsplashAccessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY

  const fallbackPhotos = useMemo(
    () => [
      {
        url: '/placeholders/ph1.jpg',
        photographerName: 'F1 Unleashed',
        profileUrl: `https://unsplash.com/@f1unleashed?${UNSPLASH_UTM}`,
        unsplashUrl: `https://unsplash.com/photos/4oAq0VOYl9A?${UNSPLASH_UTM}`,
      },
      {
        url: '/placeholders/ph2.jpg',
        photographerName: 'Jack B',
        profileUrl: `https://unsplash.com/@nervum?${UNSPLASH_UTM}`,
        unsplashUrl: `https://unsplash.com/photos/EwUZ8hjWXSk?${UNSPLASH_UTM}`,
      },
      {
        url: '/placeholders/ph3.jpg',
        photographerName: 'Ank Kumar',
        profileUrl: `https://unsplash.com/@ankkumar?${UNSPLASH_UTM}`,
        unsplashUrl: `https://unsplash.com/photos/tGghQBM-RVo?${UNSPLASH_UTM}`,
      },
      {
        url: '/placeholders/ph4.jpg',
        photographerName: 'F1 Unleashed',
        profileUrl: `https://unsplash.com/@f1unleashed?${UNSPLASH_UTM}`,
        unsplashUrl: `https://unsplash.com/photos/J0PLcahCOVk?${UNSPLASH_UTM}`,
      },
      {
        url: '/placeholders/ph5.jpg',
        photographerName: 'Mr. AN',
        profileUrl: `https://unsplash.com/@mran123?${UNSPLASH_UTM}`,
        unsplashUrl: `https://unsplash.com/photos/IFFPJpbF4CM?${UNSPLASH_UTM}`,
      },
    ],
    []
  )

  const openF1Client = useMemo(
    () => axios.create({ baseURL: openF1Base, timeout: 15000 }),
    [openF1Base]
  )
  const openMeteoClient = useMemo(() => axios.create({ timeout: 12000 }), [])
  const geocodingClient = useMemo(() => axios.create({ timeout: 10000 }), [])

  async function requestJson(client, url, signal) {
    try {
      const res = await client.get(url, { signal })
      return res.data
    } catch (error) {
      const status = error?.response?.status ?? 'unknown'
      throw new Error(`API request failed (${status}) for ${url}`, { cause: error })
    }
  }

  useEffect(() => {
    let refreshTimer = null
    let currentController = null

    function scheduleNextPoll() {
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(loadDashboardData, WEATHER_POLL_MS)
    }

    async function loadDashboardData() {
      if (requestRunningRef.current) return
      requestRunningRef.current = true
      setRefreshing(true)
      currentController = new AbortController()
      const signal = currentController.signal
      const year = new Date().getFullYear()
      const now = new Date()
      const nowTs = Date.now()
      const shouldFetchOpenF1 =
        !lastOpenF1FetchAtRef.current ||
        nowTs - lastOpenF1FetchAtRef.current >= OPENF1_POLL_MS ||
        !latestRaceDataRef.current
      let raceData = latestRaceDataRef.current
      let latestCompletedRaceSessionKey = latestCompletedRaceSessionKeyRef.current
      const cacheUpdate = {}
      let hadApiFailure = false

      if (shouldFetchOpenF1) {
        setNextRace((prev) => ({ ...prev, loading: !prev.data, error: '' }))
      }
      setWeather((prev) => ({ ...prev, loading: !prev.data, error: '' }))
      if (shouldFetchOpenF1) {
        setDrivers((prev) => ({ ...prev, loading: prev.data.length === 0 && !prev.error, error: '' }))
        setSeasonStats((prev) => ({ ...prev, loading: prev.data.length === 0 && !prev.error, error: '' }))
      }

      if (shouldFetchOpenF1) {
        // ── OpenF1 fetch (minder vaak dan weer) ───────────────────────────
        const [
          currentYearMeetingsRes,
          nextYearMeetingsRes,
          currentYearRaceSessionsRes,
        ] = await Promise.allSettled([
          requestJson(openF1Client, `/meetings?year=${year}`, signal),
          requestJson(openF1Client, `/meetings?year=${year + 1}`, signal),
          requestJson(openF1Client, `/sessions?session_name=Race&year=${year}`, signal),
        ])

        const allMeetings = [
          ...(currentYearMeetingsRes.status === 'fulfilled' ? currentYearMeetingsRes.value : []),
          ...(nextYearMeetingsRes.status === 'fulfilled' ? nextYearMeetingsRes.value : []),
        ]
        const currentYearRaceSessions =
          currentYearRaceSessionsRes.status === 'fulfilled' ? currentYearRaceSessionsRes.value : []
        if (currentYearMeetingsRes.status !== 'fulfilled' && nextYearMeetingsRes.status !== 'fulfilled') {
          hadApiFailure = true
        }
        if (currentYearRaceSessionsRes.status !== 'fulfilled') {
          hadApiFailure = true
        }

        const latestCurrentYearRaceSession = currentYearRaceSessions
          .filter((s) => s.date_end && new Date(s.date_end) <= now && !s.is_cancelled)
          .sort((a, b) => new Date(b.date_end) - new Date(a.date_end))[0]

        // Alleen actuele seizoensdata gebruiken: geen fallback naar vorig jaar.
        latestCompletedRaceSessionKey = latestCurrentYearRaceSession?.session_key || null
        latestCompletedRaceSessionKeyRef.current = latestCompletedRaceSessionKey

        // ── Volgende race ──────────────────────────────────────────────────
        try {
          const upcomingRace =
            allMeetings
              .filter(
                (m) =>
                  !m.is_cancelled &&
                  m.meeting_name.toLowerCase().includes('grand prix') &&
                  new Date(m.date_start) > now
              )
              .sort((a, b) => new Date(a.date_start) - new Date(b.date_start))[0] || null

          if (!upcomingRace) throw new Error('Geen komende Grand Prix gevonden.')

          raceData = {
            ...upcomingRace,
            countryName: upcomingRace.country_name || 'Land onbekend',
            countryFlag: upcomingRace.country_flag || '',
            circuitName: upcomingRace.circuit_short_name || upcomingRace.location || 'Circuit onbekend',
            circuitImage: upcomingRace.circuit_image || null,
          }

          const raceNowTs = Date.now()
          setNextRace({ loading: false, error: '', data: raceData, stale: false, lastUpdated: raceNowTs })
          cacheUpdate.nextRace = raceData
          cacheUpdate.nextRaceUpdatedAt = raceNowTs
          latestRaceDataRef.current = raceData
        } catch (error) {
          console.error('[NextRace]', error)
          hadApiFailure = true
          setNextRace((prev) =>
            prev.data
              ? { ...prev, loading: false, error: '', stale: true }
              : { ...prev, loading: true, error: '', stale: false }
          )
        }
      }

      // ── Weer op circuit ────────────────────────────────────────────────
      try {
        if (!raceData) throw new Error('Geen race-data beschikbaar voor weerlocatie.')

        let coords = null

        try {
          const geoRes = await geocodingClient.get(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(raceData.location)}&count=1&language=en&format=json`,
            { signal }
          )
          const hit = geoRes.data?.results?.[0]
          if (Number.isFinite(hit?.latitude) && Number.isFinite(hit?.longitude)) {
            coords = { latitude: hit.latitude, longitude: hit.longitude }
          }
        } catch {
          // Geocoding mislukt → fallback map
        }

        if (!coords) coords = CIRCUIT_COORDS[raceData.circuit_short_name] || null
        if (!coords) throw new Error('Geen coördinaten beschikbaar voor dit circuit.')

        const weatherData = await requestJson(
          openMeteoClient,
          `${openMeteoUrl}?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,wind_speed_10m,precipitation&timezone=auto`,
          signal
        )

        const weatherResult = { ...weatherData.current, raceCircuit: raceData.circuitName }
        const nowTs = Date.now()
        setWeather({ loading: false, error: '', data: weatherResult, stale: false, lastUpdated: nowTs })
        cacheUpdate.weather = weatherResult
        cacheUpdate.weatherUpdatedAt = nowTs
      } catch (error) {
        console.error('[Weather]', error)
        hadApiFailure = true
        setWeather((prev) =>
          prev.data
            ? { ...prev, loading: false, error: '', stale: true }
            : { ...prev, loading: true, error: '', stale: false }
        )
      }

      // ── Coureurs lijst & Seizoen ranglijst (OpenF1, throttled) ─────────
      if (shouldFetchOpenF1) {
        try {
          const sessionKey = latestCompletedRaceSessionKey || 'latest'

          const [driversRes, standingsRes] = await Promise.allSettled([
            requestJson(openF1Client, `/drivers?session_key=${sessionKey}`, signal),
            latestCompletedRaceSessionKey
              ? requestJson(openF1Client, `/championship_drivers?session_key=${latestCompletedRaceSessionKey}`, signal)
              : Promise.reject(new Error('Geen afgeronde race-sessie voor standings.')),
          ])

          if (driversRes.status === 'fulfilled') {
            const mappedDrivers = driversRes.value
              .map((d) => ({
                name: `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || d.broadcast_name || 'Onbekend',
                number: d.driver_number ?? '-',
                flag: driverFlag(d.driver_number),
              }))
              .sort((a, b) => Number(a.number) - Number(b.number))
            const driversNowTs = Date.now()
            setDrivers({ loading: false, error: '', data: mappedDrivers, stale: false, lastUpdated: driversNowTs })
            cacheUpdate.drivers = mappedDrivers
            cacheUpdate.driversUpdatedAt = driversNowTs
          } else {
            console.error('[Drivers]', driversRes.reason)
            hadApiFailure = true
            setDrivers((prev) =>
              prev.data.length > 0
                ? { ...prev, loading: false, error: '', stale: true }
                : { ...prev, loading: false, error: 'Coureurs tijdelijk niet beschikbaar.', stale: false }
            )
          }

          if (standingsRes.status === 'fulfilled' && driversRes.status === 'fulfilled') {
            const driverByNumber = new Map(
              driversRes.value.map((d) => [d.driver_number, d])
            )
            const mappedStandings = standingsRes.value
              .map((row) => {
                const driver = driverByNumber.get(row.driver_number)
                return {
                  position: row.position_current ?? row.position_start ?? null,
                  name: driver
                    ? `${driver.first_name ?? ''} ${driver.last_name ?? ''}`.trim() || driver.broadcast_name
                    : `#${row.driver_number}`,
                  points: row.points_current ?? row.points_start ?? 0,
                  flag: driverFlag(row.driver_number),
                }
              })
              .filter((r) => r.position !== null)
              .sort((a, b) => Number(a.position) - Number(b.position))

            const standingsNowTs = Date.now()
            setSeasonStats({
              loading: false,
              error: '',
              data: mappedStandings,
              stale: false,
              lastUpdated: standingsNowTs,
            })
            cacheUpdate.seasonStats = mappedStandings
            cacheUpdate.seasonStatsUpdatedAt = standingsNowTs
            cacheUpdate.seasonStatsYear = year
          } else {
            console.error('[Standings]', standingsRes.reason)
            hadApiFailure = true
            setSeasonStats((prev) =>
              prev.data.length > 0
                ? { ...prev, loading: false, error: '', stale: true }
                : { ...prev, loading: false, error: 'Geen actuele seizoensstand beschikbaar.', stale: false }
            )
          }
        } catch (error) {
          console.error('[Drivers/Standings]', error)
          hadApiFailure = true
          setSeasonStats((prev) =>
            prev.data.length > 0
              ? { ...prev, loading: false, error: '', stale: true }
              : { ...prev, loading: false, error: 'Geen actuele seizoensstand beschikbaar.', stale: false }
          )
        } finally {
          lastOpenF1FetchAtRef.current = Date.now()
        }
      }

      // Cache bijwerken voor elk onderdeel dat succesvol was geladen
      if (Object.keys(cacheUpdate).length > 0) {
        writeCache(cacheUpdate)
      }
      if (!didLoadOnceRef.current) {
        didLoadOnceRef.current = true
        setInitialLoading(false)
      }
      if (hadApiFailure) refreshFailureStreakRef.current += 1
      else refreshFailureStreakRef.current = 0
      refreshDelayRef.current = WEATHER_POLL_MS
      setRefreshing(false)
      requestRunningRef.current = false
      scheduleNextPoll()
    }

    loadDashboardData()
    return () => {
      if (refreshTimer) clearTimeout(refreshTimer)
      if (currentController) currentController.abort()
      // Reset lock bij cleanup zodat React StrictMode remount correct werkt
      requestRunningRef.current = false
    }
  }, [geocodingClient, openF1Client, openMeteoClient, openMeteoUrl])

  // ── Unsplash achtergrondafbeeldingen ──────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController()

    async function loadUnsplashImages() {
      const cachedPhotos = readUnsplashCache()
      if (cachedPhotos) {
        setBgPhotos(cachedPhotos)
        return
      }

      if (!unsplashAccessKey) {
        setBgPhotos(fallbackPhotos)
        return
      }

      try {
        const res = await fetch(
          `${unsplashApiUrl}/photos/random?count=5&query=formula%201%20motorsport&orientation=landscape&content_filter=high`,
          {
            headers: { Authorization: `Client-ID ${unsplashAccessKey}` },
            signal: controller.signal,
          }
        )
        if (!res.ok) throw new Error('Unsplash niet beschikbaar.')
        const data = await res.json()
        const photos = Array.isArray(data) ? data : [data]
        const mappedPhotos = photos
          .map((p) => ({
            url: p?.urls?.regular || '',
            photographerName: p?.user?.name || 'Onbekend',
            profileUrl: `${p?.user?.links?.html || 'https://unsplash.com'}?${UNSPLASH_UTM}`,
            unsplashUrl: `${p?.links?.html || 'https://unsplash.com'}?${UNSPLASH_UTM}`,
          }))
          .filter((p) => p.url)
          .slice(0, 5)
        if (mappedPhotos.length === 5) {
          setBgPhotos(mappedPhotos)
          writeUnsplashCache(mappedPhotos)
          return
        }
        setBgPhotos(fallbackPhotos)
      } catch {
        setBgPhotos(fallbackPhotos)
      }
    }

    loadUnsplashImages()
    return () => controller.abort()
  }, [fallbackPhotos, unsplashAccessKey, unsplashApiUrl])

  // ── Lap summary ───────────────────────────────────────────────────────────
  const lapSummary = useMemo(() => {
    if (!myLaps.length) return null
    const normalized = myLaps
      .map((lap) => {
        if (typeof lap === 'number') return { circuit: 'Onbekend circuit', lapTime: lap }
        if (lap && typeof lap === 'object') {
          const lapTime = Number(lap.lapTime ?? lap.time ?? lap.timeMs ?? lap.duration)
          return {
            circuit: lap.circuit || lap.track || 'Onbekend circuit',
            lapTime: Number.isFinite(lapTime) ? lapTime : null,
          }
        }
        return { circuit: 'Onbekend circuit', lapTime: null }
      })
      .filter((lap) => lap.lapTime !== null)
    if (!normalized.length) return null
    const bestLap   = normalized.reduce((best, lap) => lap.lapTime < best.lapTime ? lap : best)
    const latestLap = normalized[normalized.length - 1]
    return { total: normalized.length, best: bestLap, latest: latestLap }
  }, [myLaps])

  // ── Render helpers ────────────────────────────────────────────────────────
  const cardClass =
    'group relative overflow-hidden rounded-lg border border-slate-700/80 bg-slate-900/55 p-5 text-left shadow-lg shadow-black/25 transition-[transform,box-shadow,background-color,border-color] duration-300 ease-out hover:scale-[1.015] hover:border-slate-500/80 hover:bg-slate-900/70 hover:shadow-xl hover:shadow-black/45'

  function renderCardBackground(idx, overrideImage) {
    const imageUrl = overrideImage || bgPhotos[idx]?.url || fallbackPhotos[idx]?.url
    return (
      <>
        <img
          src={imageUrl}
          alt="Formula 1 achtergrond"
          className="absolute inset-0 h-full w-full object-cover "
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/60 to-slate-950/80" />
      </>
    )
  }

  function formatMeetingCalendarDate(isoString) {
    if (!isoString || typeof isoString !== 'string') return null
    const datePart = isoString.split('T')[0]
    if (!datePart) return null
    const utcMidnight = new Date(`${datePart}T00:00:00Z`)
    return utcMidnight.toLocaleDateString('nl-NL', { timeZone: 'UTC' })
  }

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-950 text-slate-100">
      <section className="relative flex min-h-0 flex-1 flex-col justify-center px-6 py-10 md:px-10">
        {initialLoading && (
          <div className="mx-auto w-full max-w-6xl">
            <LoadingSpinner message="Dashboard data laden..." />
          </div>
        )}
        {!initialLoading && (
          <div className="mx-auto w-full max-w-6xl">
            <div className="grid items-stretch gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="grid gap-6 sm:grid-cols-2">

                {/* Volgende race */}
                <Link
                  to="/races"
                  className={`${cardClass} min-h-44 cursor-pointer`}
                >
                  {renderCardBackground(0, nextRace.data?.circuitImage)}
                  <div className="relative z-10">
                    <span className="mb-3 block h-0.5 w-14 rounded-full bg-red-500/70" />
                    <h2 className="border-l-2 border-red-500/70 pl-2 text-sm font-semibold">Volgende race</h2>
                    {nextRace.loading && !nextRace.data && (
                      <div className="mt-6 flex min-h-[7rem] items-center justify-center">
                        <LoadingSpinner compact message="" />
                      </div>
                    )}
                    {nextRace.data && (
                      <div className="mt-2 space-y-1 text-sm text-slate-100">
                        <p className="font-medium">{nextRace.data.meeting_name || 'Race onbekend'}</p>
                        <p className="text-slate-300">{nextRace.data.circuitName}</p>
                        <div className="flex items-center gap-2 text-slate-300">
                          {nextRace.data.countryFlag ? (
                            <img
                              src={nextRace.data.countryFlag}
                              alt={nextRace.data.countryName}
                              className="h-3 w-5 rounded-sm object-cover"
                            />
                          ) : (
                            <span className="h-3 w-5 rounded-sm bg-slate-500/60" />
                          )}
                          <span>{nextRace.data.countryName}</span>
                        </div>
                        <p className="text-slate-300">
                          {nextRace.data.date_start
                            ? `${formatMeetingCalendarDate(nextRace.data.date_start)} t/m ${
                                nextRace.data.date_end
                                  ? formatMeetingCalendarDate(nextRace.data.date_end)
                                  : formatMeetingCalendarDate(nextRace.data.date_start)
                              }`
                            : 'Datum onbekend'}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Weer op circuit */}
                <Link
                  to="/weather"
                  className={`${cardClass} min-h-44 cursor-pointer`}
                >
                  {renderCardBackground(1)}
                  <div className="relative z-10">
                    <h2 className="text-sm font-semibold">Weer op circuit</h2>
                    {weather.loading && !weather.data && (
                      <div className="mt-6 flex min-h-[7rem] items-center justify-center">
                        <LoadingSpinner compact message="" />
                      </div>
                    )}
                    {weather.data && (
                      <div className="mt-2 space-y-1 text-sm text-slate-100">
                        <p className="font-medium text-slate-200">{weather.data.raceCircuit}</p>
                        <p>Temperatuur: {Math.round(weather.data.temperature_2m ?? 0)}°C</p>
                        <p className="text-slate-300">
                          Wind: {Math.round(weather.data.wind_speed_10m ?? 0)} km/u
                        </p>
                        <p className="text-slate-300">
                          Regen: {(weather.data.precipitation ?? 0).toFixed(1)} mm
                        </p>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Coureurs lijst */}
                <Link
                  to="/standings"
                  className={`${cardClass} min-h-44 cursor-pointer`}
                >
                  {renderCardBackground(2)}
                  <div className="relative z-10">
                    <h2 className="text-sm font-semibold">Coureurs lijst</h2>
                    {drivers.loading && drivers.data.length === 0 && (
                      <div className="mt-6 flex min-h-[7rem] items-center justify-center">
                        <LoadingSpinner compact message="" />
                      </div>
                    )}
                    {drivers.data.length > 0 && (
                      <ul className="scrollbar-red mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
                        {drivers.data.map((driver) => (
                          <li
                            key={`${driver.number}-${driver.name}`}
                            className="flex items-center gap-2"
                          >
                            {driver.flag ? (
                              <img
                                src={driver.flag}
                                alt=""
                                className="h-3 w-5 rounded-sm object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="h-3 w-5 rounded-sm bg-slate-500/50" />
                            )}
                            <span className="truncate">#{driver.number} {driver.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {!drivers.loading && drivers.data.length === 0 && (
                      <p className="mt-3 text-sm text-slate-300">
                        {drivers.error || 'Coureurs tijdelijk niet beschikbaar.'}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Seizoen ranglijst */}
                <Link
                  to="/standings"
                  className={`${cardClass} min-h-44 cursor-pointer`}
                >
                  {renderCardBackground(3)}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-semibold">Seizoen ranglijst</h2>
                      {!seasonStats.loading && !seasonStats.error && seasonStats.data.length > 0 && (
                        <p className="text-xs text-slate-400">
                          Seizoen {nextRace.data?.year ?? new Date().getFullYear()}
                        </p>
                      )}
                    </div>
                    {seasonStats.loading && seasonStats.data.length === 0 && (
                      <div className="mt-6 flex min-h-[7rem] items-center justify-center">
                        <LoadingSpinner compact message="" />
                      </div>
                    )}
                    {!seasonStats.loading && seasonStats.data.length === 0 && (
                      <p className="mt-3 text-sm text-slate-300">
                        {seasonStats.error || 'Geen actuele seizoensstand beschikbaar.'}
                      </p>
                    )}
                    {seasonStats.data.length > 0 && (
                      <ul className="scrollbar-red mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-slate-100">
                        {seasonStats.data.map((entry) => (
                          <li
                            key={`${entry.position}-${entry.name}`}
                            className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-2"
                          >
                            <span className="text-slate-200">{entry.position}</span>
                            <div className="flex min-w-0 items-center gap-2">
                              {entry.flag ? (
                                <img
                                  src={entry.flag}
                                  alt=""
                                  className="h-3 w-5 rounded-sm object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <span className="h-3 w-5 rounded-sm bg-slate-500/50" />
                              )}
                              <span className="truncate">{entry.name}</span>
                            </div>
                            <span className="text-slate-300">{entry.points} pt</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Link>

              </div>

              {/* Mijn rondetijden */}
              <Link
                to="/lap-tracker"
                className={`${cardClass} min-h-[356px] cursor-pointer border-red-500/45 bg-slate-900/75 shadow-[0_0_0_1px_rgba(239,68,68,0.22),0_12px_30px_rgba(2,6,23,0.55)] hover:border-red-400/65 hover:shadow-[0_0_0_1px_rgba(239,68,68,0.35),0_18px_38px_rgba(2,6,23,0.68)] lg:h-full`}
              >
                {renderCardBackground(4)}
                <div className="relative z-10 flex h-full min-h-[356px] flex-col">
                  <span className="mb-3 block h-0.5 w-20 rounded-full bg-red-500/75" />
                  <h2 className="border-l-2 border-red-500/75 pl-2 text-base font-semibold text-white">Mijn rondetijden</h2>
                  {!lapSummary && (
                    <div className="flex flex-1 items-center justify-center">
                      <div className="rounded-lg border border-red-600/95 bg-red-950/50 p-5 text-center ring-1 ring-red-500/45 shadow-[0_0_18px_rgba(220,38,38,0.35)]">
                        <p className="text-base font-semibold text-red-100">
                          Nog geen tijden opgeslagen.
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-red-100/90">
                          Voeg je eerste rondes toe in de LapTracker om hier je prestaties te zien.
                        </p>
                      </div>
                    </div>
                  )}
                  {lapSummary && (
                    <div className="scrollbar-red mt-4 max-h-[250px] space-y-2 overflow-y-auto pl-2 text-sm text-slate-100">
                      <p>Totaal opgeslagen rondes: {lapSummary.total}</p>
                      <p className="text-slate-300">
                        Beste tijd: {lapSummary.best.lapTime?.toFixed(3)}s ({lapSummary.best.circuit})
                      </p>
                      <p className="text-slate-300">
                        Laatste tijd: {lapSummary.latest.lapTime?.toFixed(3)}s (
                        {lapSummary.latest.circuit})
                      </p>
                    </div>
                  )}
                </div>
              </Link>

            </div>
          </div>
        )}
        {!initialLoading && refreshing && (
          <div className="pointer-events-none absolute right-2 top-2 z-20 md:right-10 md:top-10">
            <div className="origin-top-right scale-[0.45]">
              <LoadingSpinner compact message="" />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
