// Route: /races — toont F1-kalender, next-race highlight en desktop/mobile weergave.
import { useCallback, useEffect, useRef, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import RaceCard from '../components/RaceCard'
import { HOME_HERO_HEIGHT_PX } from './Home'
import { LOADER_MIN_VISIBLE_MS } from '../constants/uiTiming'
import { CACHE_KEY_RACE_CALENDAR, readCache, writeCache } from '../services/cacheService'
import { getCountryFlag } from '../services/countriesService'
import { getRaceCalendar } from '../services/f1Service'

// Zelfde hero-hoogte als Home voor consistente top-layout tussen routes.
const RACE_HERO_HEIGHT_PX = HOME_HERO_HEIGHT_PX
const raceHeroImage = '/RaceKalender.jpg'
/** Zelfde interval als dashboard (`useDashboardData`): periodiek serverdata verversen. */
const PAGE_DATA_POLL_MS = 30000

// Parse alleen de datumcomponent (zonder lokale tijdverschuivingen).
function parseDateOnly(isoDateString) {
  if (!isoDateString || typeof isoDateString !== 'string') return null
  const datePart = isoDateString.split('T')[0]
  if (!datePart) return null
  return new Date(`${datePart}T00:00:00Z`)
}

// Bouw nette "van/tot" datumweergave voor raceweekenden.
function formatDateRange(dateStart, dateEnd) {
  const start = parseDateOnly(dateStart)
  const end = parseDateOnly(dateEnd || dateStart)
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Datum onbekend'
  }
  const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' }
  return `${start.toLocaleDateString('nl-NL', dateOptions)} t/m ${end.toLocaleDateString('nl-NL', dateOptions)}`
}

// Geeft status-badge styling terug; next race krijgt extra nadruk.
function getStatusClass(status, isNextRace = false) {
  if (isNextRace) {
    return 'inline-flex min-w-[8rem] items-center justify-center rounded-md border border-[#ff1e00] bg-[#2b1010] px-4 py-2 text-sm font-extrabold text-white ring-1 ring-[#ff1e00]/70 shadow-[0_0_18px_rgba(255,30,0,0.35)]'
  }
  if (status === 'Voorbij') {
    return 'inline-flex min-w-[6.5rem] items-center justify-center rounded-md border border-slate-600 bg-slate-800/70 px-3 py-1.5 text-sm font-semibold text-slate-200'
  }
  if (status === 'Dit weekend') {
    return 'inline-flex min-w-[6.5rem] items-center justify-center rounded-md border border-red-500/85 bg-red-950/50 px-3 py-1.5 text-sm font-semibold text-red-100 ring-1 ring-red-500/30'
  }
  return 'inline-flex min-w-[6.5rem] items-center justify-center rounded-md border border-emerald-500/70 bg-emerald-900/25 px-3 py-1.5 text-sm font-semibold text-emerald-200'
}

// Hulpfunctie om races chronologisch te vergelijken.
function getRaceStartTime(session) {
  const start = parseDateOnly(session?.dateStart)
  if (!start || Number.isNaN(start.getTime())) return Number.POSITIVE_INFINITY
  return start.getTime()
}

export default function RaceCalendar() {
  const cachedRef = useRef(readCache(CACHE_KEY_RACE_CALENDAR))
  const cached = cachedRef.current
  const initialRaces = Array.isArray(cached?.races) ? cached.races : []

  const [races, setRaces] = useState(initialRaces)
  const [seasonYear, setSeasonYear] = useState(cached?.seasonYear ?? new Date().getFullYear())
  const [loading, setLoading] = useState(initialRaces.length === 0)
  const [refreshing, setRefreshing] = useState(initialRaces.length > 0)
  const [error, setError] = useState('')
  const [stale, setStale] = useState(false)

  // Laadt kalenderdata en vult missende vlaggen waar nodig aan.
  const loadRaceCalendar = useCallback(async (signal) => {
    const refreshStartedAt = Date.now()
    const hadCachedData = (cachedRef.current?.races?.length ?? 0) > 0
    if (!hadCachedData) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const data = await getRaceCalendar(signal)
      const enrichedRaces = await Promise.all(
        data.races.map(async (race) => {
          if (race.countryFlag) return race
          const flag = await getCountryFlag(race.countryName, signal)
          return {
            ...race,
            countryFlag: flag || '',
          }
        })
      )
      setRaces(enrichedRaces)
      setSeasonYear(data.seasonYear)
      setStale(data.stale)
      writeCache(CACHE_KEY_RACE_CALENDAR, {
        races: enrichedRaces,
        seasonYear: data.seasonYear,
      })
      cachedRef.current = { races: enrichedRaces, seasonYear: data.seasonYear }
    } catch (err) {
      if (err?.name !== 'AbortError' && !hadCachedData) {
        setError(err?.message || 'Racekalender kon niet worden geladen.')
      }
    } finally {
      if (!signal?.aborted) {
        const elapsed = Date.now() - refreshStartedAt
        if (elapsed < LOADER_MIN_VISIBLE_MS) {
          await new Promise((r) => setTimeout(r, LOADER_MIN_VISIBLE_MS - elapsed))
        }
      }
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let pollTimer = null
    let currentController = null
    let cancelled = false

    async function tick() {
      if (cancelled) return
      currentController = new AbortController()
      await loadRaceCalendar(currentController.signal)
      if (cancelled) return
      pollTimer = window.setTimeout(tick, PAGE_DATA_POLL_MS)
    }

    tick()
    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
      currentController?.abort()
    }
  }, [loadRaceCalendar])

  function handleRetry() {
    const controller = new AbortController()
    loadRaceCalendar(controller.signal)
  }

  const now = new Date()
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).getTime()
  const nextRace = races
    .filter((session) => getRaceStartTime(session) >= todayStart)
    .sort((a, b) => getRaceStartTime(a) - getRaceStartTime(b))[0]
  const nextRaceKey = nextRace
    ? `${nextRace.sessionKey ?? nextRace.meetingName}-${nextRace.dateStart ?? ''}`
    : null

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-slate-950 text-slate-100">
      <div
        className="relative w-full shrink-0 border-b border-slate-800"
        style={{ height: RACE_HERO_HEIGHT_PX, maxHeight: RACE_HERO_HEIGHT_PX }}
      >
        <img
          src={raceHeroImage}
          alt="F1 racekalender hero"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/30 to-slate-950/80" />
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="w-full px-6 py-7 md:px-10">
            <h1 className="pl-12 text-3xl font-extrabold tracking-tight text-white [text-shadow:0_5px_18px_rgba(0,0,0,0.95)] md:text-4xl">
              F1 Racekalender {seasonYear}
            </h1>
          </div>
        </div>
      </div>

      <section className="relative flex min-h-0 flex-1 flex-col justify-center px-6 py-10 md:pl-[5rem] md:pr-[3.5rem] md:py-12 lg:py-14">
        {loading && (
          <div className="mx-auto w-full max-w-6xl">
            <LoadingSpinner message="Racekalender laden..." />
          </div>
        )}
        {!loading && (
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              {stale && (
                <p className="rounded-md border border-red-500/60 bg-red-600/10 px-3 py-1 text-xs text-red-200">
                  Tijdelijk cache-data getoond.
                </p>
              )}
            </div>

            {error && <ErrorMessage message={error} onRetry={handleRetry} />}

            {!error && races.length === 0 && (
              <ErrorMessage message="Er zijn geen races gevonden voor dit seizoen." onRetry={handleRetry} />
            )}

            {!error && races.length > 0 && (
          <div className="space-y-5">
            {nextRace && (
              <div className="hidden items-center justify-between rounded-2xl border border-[#ff1e00]/80 bg-[#181922] px-7 py-5 shadow-[0_0_24px_rgba(255,30,0,0.2)] lg:flex">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-500">
                    Volgende race
                  </p>
                  <p className="mt-1 text-xl font-extrabold text-white">
                    {nextRace.meetingName}
                  </p>
                  <p className="text-base text-slate-300">{nextRace.circuitName}</p>
                </div>
                <p className="inline-flex items-center justify-center rounded-md border border-[#ff1e00] bg-[#2b1010] px-5 py-3 font-bold text-white ring-1 ring-[#ff1e00]/70 shadow-[0_0_18px_rgba(255,30,0,0.35)]">
                  {formatDateRange(nextRace.dateStart, nextRace.dateEnd)}
                </p>
              </div>
            )}
            {/* Desktoptabel met los zwevende rijen voor hover/scale effecten. */}
            <div className="hidden overflow-visible rounded-xl border border-slate-700 lg:block">
              <div className="grid grid-cols-[1.35fr_2.4fr_1.35fr_1fr] gap-7 border-b border-slate-700 bg-slate-900/90 px-7 py-5 text-sm font-semibold uppercase tracking-wide text-slate-200">
                <span>Datum</span>
                <span>Circuit</span>
                <span>Land</span>
                <span className="text-center">Status</span>
              </div>
              <div className="space-y-3 bg-slate-950/60 px-2 py-3">
                {races.map((session, idx) => (
                  <div
                    key={`${session.sessionKey ?? session.meetingName}-${session.dateStart ?? ''}`}
                    className={`relative z-0 grid min-h-[6.5rem] grid-cols-[1.35fr_2.4fr_1.35fr_1fr] items-center gap-7 rounded-xl border px-7 py-6 text-base text-slate-100 transition-transform duration-200 ease-out ${
                      `${session.sessionKey ?? session.meetingName}-${session.dateStart ?? ''}` ===
                      nextRaceKey
                        ? 'border-[#ff1e00] bg-[#23151a] shadow-[0_0_20px_rgba(255,30,0,0.2)]'
                        : session.status === 'Voorbij'
                          ? 'border-slate-800 bg-gray-900/20 text-slate-500 shadow-[inset_0_0_0_9999px_rgba(148,163,184,0.08)]'
                        : idx % 2 === 0
                          ? 'border-slate-800 bg-slate-900/70 hover:bg-slate-800/100'
                          : 'border-slate-800 bg-slate-900/45 hover:bg-slate-800/100'
                    }`}
                  >
                    <span className="text-[0.95rem] font-medium text-slate-200">
                      {formatDateRange(session.dateStart, session.dateEnd)}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block truncate text-xl font-extrabold ${
                          session.status === 'Voorbij' ? 'text-slate-400' : 'text-white'
                        }`}
                      >
                        {session.meetingName}
                      </span>
                      <span
                        className={`mt-1.5 block truncate text-base ${
                          session.status === 'Voorbij' ? 'text-slate-600' : 'text-slate-300'
                        }`}
                      >
                        {session.circuitName}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      {session.countryFlag ? (
                        <img
                          src={session.countryFlag}
                          alt={session.countryName}
                          className="h-6 w-8 rounded-sm object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="h-6 w-8 rounded-sm bg-slate-600/70" />
                      )}
                      <span className="truncate text-[0.95rem]">{session.countryName}</span>
                    </span>
                    <span className="text-center">
                      <span
                        className={getStatusClass(
                          session.status,
                          `${session.sessionKey ?? session.meetingName}-${session.dateStart ?? ''}` ===
                            nextRaceKey
                        )}
                      >
                        {session.status}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobiele weergave met dezelfde racevolgorde in cards. */}
            <div className="grid gap-4 lg:hidden sm:grid-cols-2">
              {races.map((session) => (
                <RaceCard
                  key={`${session.sessionKey ?? session.meetingName}-${session.dateStart ?? ''}`}
                  session={session}
                  isNextRace={
                    `${session.sessionKey ?? session.meetingName}-${session.dateStart ?? ''}` ===
                    nextRaceKey
                  }
                />
              ))}
            </div>
          </div>
            )}
          </div>
        )}
        {!loading && refreshing && (
          <div className="pointer-events-none absolute right-2 top-2 z-20 md:right-10 md:top-10">
            <div className="origin-top-right scale-[0.45]">
              <LoadingSpinner compact message="" />
            </div>
          </div>
        )}
      </section>
    </section>
  )
}
