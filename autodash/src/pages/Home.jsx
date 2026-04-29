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
              <h1 className="text-3xl font-extrabold tracking-tight text-white [text-shadow:0_3px_10px_rgba(0,0,0,0.9)] md:text-5xl">
                Welkom bij{' '}
                <span className="text-[#d50000] italic [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">Auto</span>
                <span className="text-white italic">Dash</span>
              </h1>
              <p className="mt-2 max-w-xl text-base font-medium leading-relaxed text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.9)] md:text-lg">
                Jouw dashboard voor races, tijden en weer op het circuit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Statische nationaliteitsmap 2025 F1-rijders ────────────────────────────
// OpenF1 levert country_code=null voor alle 2025-rijders.
// ISO 3166-1 alpha-2 (kleine letters) voor flagcdn.com.
const DRIVER_NATIONALITIES = {
  1:  'nl', // Max Verstappen
  4:  'gb', // Lando Norris
  5:  'br', // Gabriel Bortoleto
  6:  'fr', // Isack Hadjar
  7:  'au', // Jack Doohan
  10: 'fr', // Pierre Gasly
  12: 'it', // Kimi Antonelli
  14: 'es', // Fernando Alonso
  16: 'mc', // Charles Leclerc
  18: 'ca', // Lance Stroll
  22: 'jp', // Yuki Tsunoda
  23: 'th', // Alexander Albon
  27: 'de', // Nico Hülkenberg
  30: 'nz', // Liam Lawson
  31: 'fr', // Esteban Ocon
  43: 'ar', // Franco Colapinto
  44: 'gb', // Lewis Hamilton
  55: 'es', // Carlos Sainz
  63: 'gb', // George Russell
  81: 'au', // Oscar Piastri
  87: 'gb', // Oliver Bearman
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
const CACHE_KEY = 'autodash_cache_v1'
const CACHE_MAX_AGE_MS = 60 * 60 * 1000 // 60 minuten

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

// ── Component ─────────────────────────────────────────────────────────────
export default function Home() {
  // State initialiseren vanuit cache zodat data direct zichtbaar is na page refresh
  const [nextRace, setNextRace] = useState(() => {
    const c = readCache()
    return c?.nextRace ? { loading: false, error: '', data: c.nextRace } : { loading: true, error: '', data: null }
  })
  const [weather, setWeather] = useState(() => {
    const c = readCache()
    return c?.weather ? { loading: false, error: '', data: c.weather } : { loading: true, error: '', data: null }
  })
  const [drivers, setDrivers] = useState(() => {
    const c = readCache()
    return c?.drivers ? { loading: false, error: '', data: c.drivers } : { loading: true, error: '', data: [] }
  })
  const [seasonStats, setSeasonStats] = useState(() => {
    const c = readCache()
    return c?.seasonStats ? { loading: false, error: '', data: c.seasonStats } : { loading: true, error: '', data: [] }
  })
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
  const [bgImages, setBgImages] = useState([])
  // Toon initial spinner alleen als er geen cache is
  const [initialLoading, setInitialLoading] = useState(() => !readCache())
  const [refreshing, setRefreshing] = useState(false)

  const didLoadOnceRef = useRef(!!readCache())
  const requestRunningRef = useRef(false)

  const openF1Base   = import.meta.env.VITE_OPENF1_URL     || 'https://api.openf1.org/v1'
  const openMeteoUrl = import.meta.env.VITE_OPEN_METEO_URL || 'https://api.open-meteo.com/v1/forecast'
  const unsplashApiUrl    = import.meta.env.VITE_UNSPLASH_API_URL || 'https://api.unsplash.com'
  const unsplashAccessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY

  const fallbackImages = useMemo(
    () => [
      'https://images.unsplash.com/photo-1504707748692-419802cf939d?auto=format&fit=crop&w=1280&q=80',
      'https://images.unsplash.com/photo-1541773367336-d14ddf89ed10?auto=format&fit=crop&w=1280&q=80',
      'https://images.unsplash.com/photo-1552673597-e3cd6747a996?auto=format&fit=crop&w=1280&q=80',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1280&q=80',
      'https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?auto=format&fit=crop&w=1280&q=80',
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

    async function loadDashboardData() {
      if (requestRunningRef.current) return
      requestRunningRef.current = true
      setRefreshing(true)
      currentController = new AbortController()
      const signal = currentController.signal
      const year = new Date().getFullYear()
      const now = new Date()
      let raceData = null
      let latestCompletedRaceSessionKey = null
      const cacheUpdate = {}

      setNextRace((prev) => ({ ...prev, loading: true, error: '' }))
      setWeather((prev) => ({ ...prev, loading: true, error: '' }))
      setDrivers((prev) => ({ ...prev, loading: true, error: '' }))
      setSeasonStats((prev) => ({ ...prev, loading: true, error: '' }))

      // ── Parallelle initiële fetches ────────────────────────────────────
      const [
        currentYearMeetingsRes,
        nextYearMeetingsRes,
        currentYearRaceSessionsRes,
        previousYearRaceSessionsRes,
      ] = await Promise.allSettled([
        requestJson(openF1Client, `/meetings?year=${year}`, signal),
        requestJson(openF1Client, `/meetings?year=${year + 1}`, signal),
        requestJson(openF1Client, `/sessions?session_name=Race&year=${year}`, signal),
        requestJson(openF1Client, `/sessions?session_name=Race&year=${year - 1}`, signal),
      ])

      const allMeetings = [
        ...(currentYearMeetingsRes.status === 'fulfilled' ? currentYearMeetingsRes.value : []),
        ...(nextYearMeetingsRes.status === 'fulfilled'    ? nextYearMeetingsRes.value    : []),
      ]
      const allRaceSessions = [
        ...(currentYearRaceSessionsRes.status === 'fulfilled'  ? currentYearRaceSessionsRes.value  : []),
        ...(previousYearRaceSessionsRes.status === 'fulfilled' ? previousYearRaceSessionsRes.value : []),
      ]

      const latestRaceSession = allRaceSessions
        .filter((s) => s.date_end && new Date(s.date_end) <= now && !s.is_cancelled)
        .sort((a, b) => new Date(b.date_end) - new Date(a.date_end))[0]
      latestCompletedRaceSessionKey = latestRaceSession?.session_key || null

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
          countryName:  upcomingRace.country_name         || 'Land onbekend',
          countryFlag:  upcomingRace.country_flag          || '',
          circuitName:  upcomingRace.circuit_short_name    || upcomingRace.location || 'Circuit onbekend',
          circuitImage: upcomingRace.circuit_image         || null,
        }

        setNextRace({ loading: false, error: '', data: raceData })
        cacheUpdate.nextRace = raceData
      } catch (error) {
        console.error('[NextRace]', error)
        setNextRace((prev) => ({ ...prev, loading: false, error: 'Volgende race niet beschikbaar.' }))
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
        setWeather({ loading: false, error: '', data: weatherResult })
        cacheUpdate.weather = weatherResult
      } catch (error) {
        console.error('[Weather]', error)
        setWeather((prev) => ({ ...prev, loading: false, error: 'Circuitweer niet beschikbaar.' }))
      }

      // ── Coureurs lijst & Seizoen ranglijst ────────────────────────────
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
              name:   `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || d.broadcast_name || 'Onbekend',
              number: d.driver_number ?? '-',
              flag:   driverFlag(d.driver_number),
            }))
            .sort((a, b) => Number(a.number) - Number(b.number))
          setDrivers({ loading: false, error: '', data: mappedDrivers })
          cacheUpdate.drivers = mappedDrivers
        } else {
          console.error('[Drivers]', driversRes.reason)
          setDrivers((prev) => ({ ...prev, loading: false, error: 'Coureurslijst niet beschikbaar.' }))
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
                name:     driver
                  ? `${driver.first_name ?? ''} ${driver.last_name ?? ''}`.trim() || driver.broadcast_name
                  : `#${row.driver_number}`,
                points:   row.points_current ?? row.points_start ?? 0,
                flag:     driverFlag(row.driver_number),
              }
            })
            .filter((r) => r.position !== null)
            .sort((a, b) => Number(a.position) - Number(b.position))

          setSeasonStats({ loading: false, error: '', data: mappedStandings })
          cacheUpdate.seasonStats = mappedStandings
        } else {
          console.error('[Standings]', standingsRes.reason)
          setSeasonStats((prev) => ({ ...prev, loading: false, error: 'Seizoen ranglijst niet beschikbaar.' }))
        }
      } catch (error) {
        console.error('[Drivers/Standings]', error)
        setSeasonStats((prev) => ({ ...prev, loading: false, error: 'Seizoen ranglijst niet beschikbaar.' }))
      } finally {
        // Cache bijwerken voor elk onderdeel dat succesvol was geladen
        if (Object.keys(cacheUpdate).length > 0) {
          writeCache(cacheUpdate)
        }
        if (!didLoadOnceRef.current) {
          didLoadOnceRef.current = true
          setInitialLoading(false)
        }
        setRefreshing(false)
        requestRunningRef.current = false
      }
    }

    loadDashboardData()
    // 30 seconden interval voor zichtbare updates tijdens testen
    refreshTimer = setInterval(loadDashboardData, 30000)
    return () => {
      if (refreshTimer) clearInterval(refreshTimer)
      if (currentController) currentController.abort()
      // Reset lock bij cleanup zodat React StrictMode remount correct werkt
      requestRunningRef.current = false
    }
  }, [geocodingClient, openF1Client, openMeteoClient, openMeteoUrl])

  // ── Unsplash achtergrondafbeeldingen ──────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController()
    async function loadUnsplashImages() {
      if (!unsplashAccessKey) {
        setBgImages(fallbackImages)
        return
      }
      try {
        const res = await fetch(
          `${unsplashApiUrl}/photos/random?count=5&query=formula%201&orientation=landscape`,
          { headers: { Authorization: `Client-ID ${unsplashAccessKey}` }, signal: controller.signal }
        )
        if (!res.ok) throw new Error('Unsplash niet beschikbaar.')
        const data = await res.json()
        const urls = data.map((p) => p?.urls?.regular).filter(Boolean).slice(0, 5)
        setBgImages(urls.length === 5 ? urls : fallbackImages)
      } catch {
        setBgImages(fallbackImages)
      }
    }
    loadUnsplashImages()
    return () => controller.abort()
  }, [fallbackImages, unsplashAccessKey, unsplashApiUrl])

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
    'relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-left'

  function renderCardBackground(idx, overrideImage) {
    const imageUrl = overrideImage || bgImages[idx] || fallbackImages[idx]
    return (
      <>
        <img
          src={imageUrl}
          alt="Formula 1 achtergrond"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/60 to-slate-950/80" />
      </>
    )
  }

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-950 text-slate-100">
      <section className="flex min-h-0 flex-1 flex-col justify-center px-6 py-10 md:px-10">
        {initialLoading && (
          <div className="mx-auto w-full max-w-6xl">
            <LoadingSpinner message="Dashboard data laden..." />
          </div>
        )}
        {!initialLoading && (
          <div className="mx-auto w-full max-w-6xl">
            {/* Refresh-indicator */}
            <div className="mb-2 flex items-center justify-end gap-2 text-xs text-slate-500">
              {refreshing ? (
                <>
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <span>Verversen...</span>
                </>
              ) : (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-slate-600" />
                  <span>Live</span>
                </>
              )}
            </div>

            <div className="grid items-center gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="grid gap-4 sm:grid-cols-2">

                {/* Volgende race */}
                <Link
                  to="/races"
                  className={`${cardClass} min-h-40 cursor-pointer transition hover:scale-[1.01]`}
                >
                  {renderCardBackground(0, nextRace.data?.circuitImage)}
                  <div className="relative z-10">
                    <h2 className="text-sm font-semibold">Volgende race</h2>
                    {nextRace.loading && <p className="mt-2 text-sm text-slate-300">Laden...</p>}
                    {!nextRace.loading && nextRace.error && (
                      <p className="mt-2 text-sm text-rose-300">{nextRace.error}</p>
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
                            ? new Date(nextRace.data.date_start).toLocaleDateString('nl-NL')
                            : 'Datum onbekend'}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Weer op circuit */}
                <Link
                  to="/weather"
                  className={`${cardClass} min-h-40 cursor-pointer transition hover:scale-[1.01]`}
                >
                  {renderCardBackground(1)}
                  <div className="relative z-10">
                    <h2 className="text-sm font-semibold">Weer op circuit</h2>
                    {weather.loading && <p className="mt-2 text-sm text-slate-300">Laden...</p>}
                    {!weather.loading && weather.error && (
                      <p className="mt-2 text-sm text-rose-300">{weather.error}</p>
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
                  className={`${cardClass} min-h-40 cursor-pointer transition hover:scale-[1.01]`}
                >
                  {renderCardBackground(2)}
                  <div className="relative z-10">
                    <h2 className="text-sm font-semibold">Coureurs lijst</h2>
                    {drivers.loading && <p className="mt-2 text-sm text-slate-300">Laden...</p>}
                    {!drivers.loading && drivers.error && (
                      <p className="mt-2 text-sm text-rose-300">{drivers.error}</p>
                    )}
                    {!drivers.loading && !drivers.error && (
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
                  </div>
                </Link>

                {/* Seizoen ranglijst */}
                <Link
                  to="/standings"
                  className={`${cardClass} min-h-40 cursor-pointer transition hover:scale-[1.01]`}
                >
                  {renderCardBackground(3)}
                  <div className="relative z-10">
                    <h2 className="text-sm font-semibold">Seizoen ranglijst</h2>
                    {seasonStats.loading && <p className="mt-2 text-sm text-slate-300">Laden...</p>}
                    {!seasonStats.loading && seasonStats.error && (
                      <p className="mt-2 text-sm text-rose-300">{seasonStats.error}</p>
                    )}
                    {!seasonStats.loading && !seasonStats.error && (
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
                className={`${cardClass} min-h-[336px] cursor-pointer transition hover:scale-[1.01]`}
              >
                {renderCardBackground(4)}
                <div className="relative z-10 flex h-full flex-col">
                  <h2 className="text-base font-semibold text-white">Mijn rondetijden</h2>
                  {!lapSummary && (
                    <div className="flex flex-1 items-center justify-center">
                      <div className="rounded-lg border border-red-400/30 bg-red-900/20 p-4 text-center">
                        <p className="text-sm font-medium text-red-200">
                          Nog geen tijden opgeslagen.
                        </p>
                        <p className="mt-1 text-xs text-red-100/90">
                          Voeg je eerste rondes toe in de LapTracker om hier je prestaties te zien.
                        </p>
                      </div>
                    </div>
                  )}
                  {lapSummary && (
                    <div className="mt-4 space-y-2 text-sm text-slate-100">
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
      </section>
    </div>
  )
}
