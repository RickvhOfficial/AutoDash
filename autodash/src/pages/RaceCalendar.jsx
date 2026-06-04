// Route: /races — toont F1-kalender, next-race highlight en desktop/mobile weergave.
import { useCallback, useEffect, useRef, useState } from 'react'
import CountryInfoCard from '../components/CountryInfoCard'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import PageMainContent from '../components/PageMainContent'
import RaceCard from '../components/RaceCard'
import SafeImg from '../components/SafeImg'
import { HOME_HERO_HEIGHT_CLASS } from '../constants/layout'
import {
  LOADER_MIN_VISIBLE_MS,
  SNAPSHOT_STARTUP_MAX_ATTEMPTS,
  SNAPSHOT_STARTUP_RETRY_BASE_MS,
} from '../constants/uiTiming'
import { CACHE_KEY_RACE_CALENDAR, readCache, writeCache } from '../services/cacheService'
import { getCountryFlag, getCountryInfo } from '../services/countriesService'
import { getRaceCalendar } from '../services/f1Service'
import { heroOverlay, pageShell, borderSubtle, tableWrap, tableHeaderLg, tableBody, tableRow, raceNextRow, raceNextRowBadge, panel, secondaryButton, textOnPhoto, textFaint, cardText, cardTextMuted, cardTextSoft, fillRowOpen, statusUpcomingBadge } from '../utils/themeClasses'

// Zelfde hero-hoogte als Home voor consistente top-layout tussen routes.
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
    return raceNextRowBadge
  }
  if (status === 'Voorbij') {
    return `inline-flex min-w-[6.5rem] items-center justify-center rounded-md border theme-border theme-fill-row-open px-3 py-1.5 text-sm font-semibold ${cardTextMuted}`
  }
  if (status === 'Dit weekend') {
    return 'inline-flex min-w-[6.5rem] items-center justify-center rounded-md border border-red-600 bg-red-600 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-red-500/30 dark:border-red-500/85 dark:bg-red-950/50 dark:text-red-100 dark:ring-red-500/30'
  }
  return `inline-flex min-w-[6.5rem] items-center justify-center rounded-md border px-3 py-1.5 text-sm font-semibold ${statusUpcomingBadge}`
}

// Hulpfunctie om races chronologisch te vergelijken.
function getRaceStartTime(session) {
  const start = parseDateOnly(session?.dateStart)
  if (!start || Number.isNaN(start.getTime())) return Number.POSITIVE_INFINITY
  return start.getTime()
}

function getRaceKey(session) {
  return `${session?.sessionKey ?? session?.meetingName}-${session?.dateStart ?? ''}`
}

function getDisplayStatus(session, nextRaceKey) {
  if (!session) return 'Aankomend'
  if (session.status === 'Dit weekend') return 'Dit weekend'
  if (session.status === 'Aankomend' && getRaceKey(session) === nextRaceKey) return 'Eerst Volgende'
  return session.status || 'Aankomend'
}

const DESKTOP_ROW_GRID = 'grid-cols-[1.35fr_2.4fr_1.35fr_1fr_2rem]'

function ChevronIcon({ open }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-5 w-5 text-red-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function handleRaceToggleKeyDown(e, onToggle) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    onToggle()
  }
}

function RaceCountryPanel({ loading, error, country }) {
  if (loading) {
    return <LoadingSpinner message="Landinfo laden..." compact />
  }
  if (error) {
    return <p className="text-sm text-red-300">{error}</p>
  }
  if (country) {
    return <CountryInfoCard country={country} />
  }
  return <p className="text-sm text-slate-500">Geen landinfo beschikbaar.</p>
}

export default function RaceCalendar() {
  const cachedRef = useRef(readCache(CACHE_KEY_RACE_CALENDAR))
  const cached = cachedRef.current
  const initialRaces = Array.isArray(cached?.races) ? cached.races : []

  const [races, setRaces] = useState(initialRaces)
  const [seasonYear, setSeasonYear] = useState(cached?.seasonYear ?? new Date().getFullYear())
  const [loading, setLoading] = useState(initialRaces.length === 0)
  const [error, setError] = useState('')
  const [stale, setStale] = useState(false)
  const [expandedRaceKey, setExpandedRaceKey] = useState(null)
  const [countryInfo, setCountryInfo] = useState(null)
  const [countryLoading, setCountryLoading] = useState(false)
  const [countryError, setCountryError] = useState('')
  const countryCacheRef = useRef({})
  const countryFetchRef = useRef(null)

  const toggleRace = useCallback((session) => {
    const key = getRaceKey(session)
    setExpandedRaceKey((prev) => (prev === key ? null : key))
  }, [])

  useEffect(() => {
    if (!expandedRaceKey) {
      setCountryInfo(null)
      setCountryLoading(false)
      setCountryError('')
      return undefined
    }

    const session = races.find((race) => getRaceKey(race) === expandedRaceKey)
    const countryName = session?.countryName?.trim()
    if (!countryName) {
      setCountryInfo(null)
      setCountryLoading(false)
      setCountryError('Geen landnaam voor deze race.')
      return undefined
    }

    const cacheKey = (session.countryCode?.trim() || countryName).toLowerCase()
    if (countryCacheRef.current[cacheKey]) {
      setCountryInfo(countryCacheRef.current[cacheKey])
      setCountryLoading(false)
      setCountryError('')
      return undefined
    }

    const controller = new AbortController()
    countryFetchRef.current?.abort()
    countryFetchRef.current = controller

    async function fetchCountry() {
      setCountryLoading(true)
      setCountryError('')
      setCountryInfo(null)
      try {
        const data = await getCountryInfo(countryName, controller.signal, session.countryCode)
        if (controller.signal.aborted) return
        if (!data) {
          setCountryError('Landinfo niet beschikbaar.')
          return
        }
        countryCacheRef.current[cacheKey] = data
        setCountryInfo(data)
      } catch (err) {
        if (err?.name === 'AbortError') return
        setCountryError('Landinfo kon niet worden geladen.')
      } finally {
        if (!controller.signal.aborted) {
          setCountryLoading(false)
        }
      }
    }

    fetchCountry()
    return () => controller.abort()
  }, [expandedRaceKey, races])

  // Laadt kalenderdata en vult missende vlaggen waar nodig aan.
  const loadRaceCalendar = useCallback(async (signal) => {
    const refreshStartedAt = Date.now()
    const hadCachedData = (cachedRef.current?.races?.length ?? 0) > 0
    const coldStart = !hadCachedData
    const maxAttempts = coldStart ? SNAPSHOT_STARTUP_MAX_ATTEMPTS : 1

    if (!hadCachedData) setLoading(true)
    setError('')

    let enrichedRaces = []
    let yearOut = new Date().getFullYear()
    let staleOut = false
    let lastErr = null

    try {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (signal?.aborted) break
        if (attempt > 0) {
          await new Promise((r) =>
            setTimeout(r, Math.min(800, SNAPSHOT_STARTUP_RETRY_BASE_MS * attempt))
          )
        }
        try {
          const data = await getRaceCalendar(signal)
          const racesIn = Array.isArray(data?.races) ? data.races : []
          yearOut = data?.seasonYear ?? yearOut
          staleOut = Boolean(data.stale)
          if (racesIn.length === 0 && coldStart) {
            lastErr = null
            continue
          }
          const enriched = await Promise.all(
            racesIn.map(async (race) => {
              const flag = await getCountryFlag(race.countryName, signal, race.countryCode)
              return {
                ...race,
                countryCode: race.countryCode ?? null,
                countryFlag: flag || '',
              }
            })
          )
          enrichedRaces = enriched
          lastErr = null
          break
        } catch (err) {
          if (err?.name === 'AbortError') break
          lastErr = err
          if (!coldStart || attempt === maxAttempts - 1) break
        }
      }

      if (signal?.aborted) return

      if (enrichedRaces.length > 0) {
        setRaces(enrichedRaces)
        setSeasonYear(yearOut)
        setStale(staleOut)
        writeCache(CACHE_KEY_RACE_CALENDAR, {
          races: enrichedRaces,
          seasonYear: yearOut,
        })
        cachedRef.current = { races: enrichedRaces, seasonYear: yearOut }
      } else if (coldStart && lastErr) {
        setRaces([])
        setError(lastErr?.message || 'Racekalender kon niet worden geladen.')
      } else if (coldStart) {
        setRaces([])
        setSeasonYear(yearOut)
        setStale(staleOut)
        setError('')
      } else if (lastErr) {
        setError('')
      }
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
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    let pollTimer = null
    let activeController = null
    let cancelled = false

    async function runPoll() {
      if (cancelled) return
      activeController = new AbortController()
      await loadRaceCalendar(activeController.signal)
      if (!cancelled) {
        pollTimer = window.setTimeout(runPoll, PAGE_DATA_POLL_MS)
      }
    }

    ;(async function initialFetch() {
      activeController = new AbortController()
      await loadRaceCalendar(activeController.signal)
      if (!cancelled) {
        pollTimer = window.setTimeout(runPoll, PAGE_DATA_POLL_MS)
      }
    })()

    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
      activeController?.abort()
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
  const nextRaceKey = nextRace ? getRaceKey(nextRace) : null

  return (
    <section className={`flex min-h-0 flex-1 flex-col ${pageShell}`}>
      <div
        className={`relative w-full shrink-0 border-b ${HOME_HERO_HEIGHT_CLASS} ${borderSubtle}`}
      >
        <SafeImg
          src={raceHeroImage}
          alt="F1 racekalender hero"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className={`absolute inset-0 ${heroOverlay}`} />
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="w-full px-6 py-7 md:px-10">
            <h1 className={`pl-12 text-3xl font-extrabold tracking-tight md:text-4xl ${textOnPhoto}`}>
              F1 Racekalender {seasonYear}
            </h1>
          </div>
        </div>
      </div>

      <PageMainContent>
        {loading && <LoadingSpinner message="Racekalender laden..." />}
        {!loading && (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              {stale && (
                <p className="rounded-md border border-red-500/60 bg-red-600/10 px-3 py-1 text-xs text-red-200">
                  Tijdelijk cache-data getoond.
                </p>
              )}
            </div>

            {error && <ErrorMessage message={error} onRetry={handleRetry} />}

            {!error && races.length === 0 && (
              <div className={`${panel} text-center`}>
                <p className="mb-4 text-base leading-relaxed">
                  Er zijn geen races gevonden voor dit seizoen.
                </p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className={secondaryButton}
                >
                  Opnieuw proberen
                </button>
              </div>
            )}

            {!error && races.length > 0 && (
          <div className="space-y-5">
            {nextRace && (
              <div className={`hidden items-center justify-between rounded-2xl px-7 py-5 lg:flex ${raceNextRow}`}>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-500">
                    Volgende race
                  </p>
                  <p className={`mt-1 text-xl font-extrabold ${cardText}`}>
                    {nextRace.meetingName}
                  </p>
                  <p className={cardTextMuted}>{nextRace.circuitName}</p>
                </div>
                <p className={raceNextRowBadge}>
                  {formatDateRange(nextRace.dateStart, nextRace.dateEnd)}
                </p>
              </div>
            )}
            {/* Desktoptabel met los zwevende rijen voor hover/scale effecten. */}
            <div className={`hidden ${tableWrap} lg:block`}>
              <div
                className={`grid ${DESKTOP_ROW_GRID} gap-7 px-7 py-5 ${tableHeaderLg}`}
              >
                <span>Datum</span>
                <span>Circuit</span>
                <span>Land</span>
                <span className="text-center">Status</span>
                <span className="sr-only">Landinfo</span>
              </div>
              <div className={tableBody}>
                {races.map((session) => {
                  const raceKey = getRaceKey(session)
                  const open = expandedRaceKey === raceKey
                  const isNext = raceKey === nextRaceKey
                  const displayStatus = getDisplayStatus(session, nextRaceKey)
                  const rowClass = isNext
                    ? raceNextRow
                    : open
                      ? `${tableRow} ${fillRowOpen}`
                      : session.status === 'Voorbij'
                        ? `${tableRow} theme-fill-row-open`
                        : tableRow

                  return (
                    <div
                      key={raceKey}
                      className={`relative z-0 overflow-hidden text-base ${rowClass}`}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={open}
                        onClick={() => toggleRace(session)}
                        onKeyDown={(e) => handleRaceToggleKeyDown(e, () => toggleRace(session))}
                        className={`grid min-h-[6.5rem] cursor-pointer ${DESKTOP_ROW_GRID} items-center gap-7 px-7 py-6`}
                      >
                        <span className={`text-[0.95rem] font-medium ${cardTextSoft}`}>
                          {formatDateRange(session.dateStart, session.dateEnd)}
                        </span>
                        <span className="min-w-0">
                          <span
                            className={`block truncate text-xl font-extrabold ${
                              session.status === 'Voorbij' ? textFaint : cardText
                            }`}
                          >
                            {session.meetingName}
                          </span>
                          <span
                            className={`mt-1.5 block truncate text-base ${
                              session.status === 'Voorbij' ? textFaint : cardTextMuted
                            }`}
                          >
                            {session.circuitName}
                          </span>
                        </span>
                        <span className="flex items-center gap-3">
                          {session.countryFlag ? (
                            <SafeImg
                              src={session.countryFlag}
                              alt={session.countryName}
                              className="h-6 w-8 rounded-sm object-cover"
                              loading="lazy"
                              fallback={
                                <span className="h-6 w-8 rounded-sm bg-slate-600/70" aria-hidden />
                              }
                            />
                          ) : (
                            <span className="h-6 w-8 rounded-sm bg-slate-600/70" />
                          )}
                          <span className="truncate text-[0.95rem]">{session.countryName}</span>
                        </span>
                        <span className="text-center">
                          <span className={getStatusClass(displayStatus, isNext)}>
                            {displayStatus}
                          </span>
                        </span>
                        <span className="flex justify-end text-red-500">
                          <ChevronIcon open={open} />
                        </span>
                      </div>

                      {open ? (
                        <div className={`border-t px-7 py-5 ${borderSubtle}`}>
                          <p className={`mb-4 text-xs font-semibold uppercase tracking-wide ${textFaint}`}>
                            Landinfo
                          </p>
                          <RaceCountryPanel
                            loading={countryLoading}
                            error={countryError}
                            country={countryInfo}
                          />
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mobiele weergave met dezelfde racevolgorde in cards. */}
            <div className="grid gap-4 lg:hidden sm:grid-cols-2">
              {races.map((session) => {
                const raceKey = getRaceKey(session)
                const open = expandedRaceKey === raceKey
                return (
                  <RaceCard
                    key={raceKey}
                    session={{ ...session, status: getDisplayStatus(session, nextRaceKey) }}
                    isNextRace={raceKey === nextRaceKey}
                    expanded={open}
                    onToggle={() => toggleRace(session)}
                    countryInfo={open ? countryInfo : null}
                    countryLoading={open && countryLoading}
                    countryError={open ? countryError : ''}
                  />
                )
              })}
            </div>
          </div>
            )}
          </>
        )}
      </PageMainContent>
    </section>
  )
}
