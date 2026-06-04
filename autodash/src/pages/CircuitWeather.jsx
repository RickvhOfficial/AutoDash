// Route: /weather — weer op F1-circuits (Open-Meteo 7-daagse + actueel).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip, 
  XAxis,
  YAxis,
} from 'recharts'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import PageMainContent from '../components/PageMainContent'
import WeatherCard from '../components/WeatherCard'
import { useTheme } from '../hooks/useTheme'
import { circuits, normalizeCircuitKey, resolveCircuitCoords } from '../data/circuits'
import { HOME_HERO_HEIGHT_PX } from '../constants/layout'
import {
  borderDefault,
  borderSubtle,
  cardOverlay,
  cardPhoto,
  cardText,
  cardTextMuted,
  heroOverlay,
  pageShell,
  textFaint,
  textMuted,
  textOnPhoto,
  weatherChartBg,
  weatherCurrentCard,
  weatherDropdownMenu,
  weatherDropdownTrigger,
  weatherHeroPanel,
  weatherMetricCard,
  filterChipActive,
} from '../utils/themeClasses'
import {
  formatWindDirectionDegrees,
  getCircuitWeather,
  weatherCodeToIcon,
  weatherCodeToLabelNl,
} from '../services/weatherService'
import { getRaceCalendar } from '../services/f1Service'
import {
  CACHE_KEY_CIRCUIT_WEATHER,
  CACHE_KEY_RACE_CALENDAR,
  readCache,
  writeCache,
} from '../services/cacheService'

const WEATHER_HERO_HEIGHT_PX = HOME_HERO_HEIGHT_PX
/** Zelfde orde van grootte als server `CIRCUIT_WEATHER_TTL_MS`: geen nutteloze refetch bij terugkeren naar de pagina. */
const CIRCUIT_WEATHER_CLIENT_FRESH_MS = 15 * 60 * 1000
const WEATHER_HERO_IMG =
  'https://images.unsplash.com/photo-1504608524841-42fe6f132db4?auto=format&fit=crop&w=1920&q=80'
const WEATHER_HERO_FALLBACK = '/weer.jpg'

function formatDayLabel(isoDate, index) {
  if (index === 0) return 'Vandaag'
  const d = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('nl-NL', { weekday: 'short' })
}

function parseDateOnly(isoDateString) {
  if (!isoDateString || typeof isoDateString !== 'string') return null
  const datePart = isoDateString.split('T')[0]
  if (!datePart) return null
  return new Date(`${datePart}T00:00:00Z`)
}

function getRaceStartTime(session) {
  const start = parseDateOnly(session?.dateStart)
  if (!start || Number.isNaN(start.getTime())) return Number.POSITIVE_INFINITY
  return start.getTime()
}

/** Zelfde logica als RaceCalendar: eerstvolgende race uit kalender. */
function pickNextRaceCircuitId(races) {
  if (!Array.isArray(races) || races.length === 0) return ''

  const now = new Date()
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).getTime()

  const upcoming = races
    .filter((race) => getRaceStartTime(race) >= todayStart)
    .sort((a, b) => getRaceStartTime(a) - getRaceStartTime(b))

  for (const race of upcoming) {
    const name = race?.circuitName || race?.meetingName || ''
    if (!resolveCircuitCoords(name, race?.meetingName)) continue
    return normalizeCircuitKey(name)
  }
  return ''
}

function formatClockFromIso(iso, utcOffsetSeconds = 0) {
  if (!iso) return ''
  const hasZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(iso)
  let d = null
  if (hasZone) {
    d = new Date(iso)
  } else {
    const parts = String(iso).match(
      /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/
    )
    if (parts) {
      const [, y, m, day, h, min, sec = '0'] = parts
      const utcMs =
        Date.UTC(Number(y), Number(m) - 1, Number(day), Number(h), Number(min), Number(sec)) -
        Number(utcOffsetSeconds || 0) * 1000
      d = new Date(utcMs)
    } else {
      d = new Date(iso)
    }
  }
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).format(d)
}

function MinimalLineTooltip({ active, payload, unit }) {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null
  return (
    <div className="pointer-events-none rounded-none bg-transparent p-0">
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          style={{ color: entry.color }}
          className={`mb-1 inline-block rounded-md border px-2 py-0.5 text-base font-semibold shadow-lg ${borderDefault} theme-fill-card`}
        >
          {Number(entry.value).toFixed(1)} {unit}
        </p>
      ))}
    </div>
  )
}

function MetricBlock({
  title,
  value,
  subtitle,
  icon,
  chartType,
  chartData,
  dataKey,
  dataKeySecondary,
  unit,
}) {
  const { isDark } = useTheme()
  const gridStroke = isDark ? '#334155' : '#cfc4b2'
  const tickFill = isDark ? '#94a3b8' : '#736b61'
  const cursorStroke = isDark ? '#64748b' : '#a89885'

  return (
    <article className={`grid h-full min-h-[10.5rem] gap-3 p-4 sm:grid-cols-[0.95fr_1.35fr] sm:items-center ${weatherMetricCard}`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {icon}
        </span>
        <div>
          <p className={`text-sm ${textFaint}`}>{title}</p>
          <p className={`mt-1 text-2xl font-bold ${cardText}`}>{value}</p>
          <p className={`mt-1 text-sm ${textFaint}`}>{subtitle}</p>
        </div>
      </div>

      <div className={`h-28 min-w-0 overflow-hidden rounded-lg border p-1 md:h-32 ${weatherChartBg}`}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: tickFill, fontSize: 10 }} />
                <YAxis tick={{ fill: tickFill, fontSize: 10 }} width={26} />
                <Tooltip
                  trigger="hover"
                  wrapperStyle={{ outline: 'none' }}
                  cursor={{ stroke: cursorStroke, strokeDasharray: '4 4' }}
                  content={<MinimalLineTooltip unit={unit} />}
                />
                <Area type="monotone" dataKey={dataKey} stroke="#38bdf8" fill="#0ea5e9" fillOpacity={0.25} />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: tickFill, fontSize: 10 }} />
                <YAxis tick={{ fill: tickFill, fontSize: 10 }} width={26} />
                <Tooltip
                  trigger="hover"
                  wrapperStyle={{ outline: 'none' }}
                  cursor={{ stroke: cursorStroke, strokeDasharray: '4 4' }}
                  content={<MinimalLineTooltip unit={unit} />}
                />
                <Line type="monotone" dataKey={dataKey} stroke="#f97316" strokeWidth={2} dot={false} />
                {dataKeySecondary && (
                  <Line
                    type="monotone"
                    dataKey={dataKeySecondary}
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
      </div>
    </article>
  )
}

export default function CircuitWeather() {
  const cachedCalendar = readCache(CACHE_KEY_RACE_CALENDAR)
  const initialNextCircuitId = pickNextRaceCircuitId(
    Array.isArray(cachedCalendar?.races) ? cachedCalendar.races : []
  )

  const [circuitOptions, setCircuitOptions] = useState([])
  const [selectedCircuit, setSelectedCircuit] = useState(initialNextCircuitId)
  const [isCircuitMenuOpen, setIsCircuitMenuOpen] = useState(false)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const skipClientCacheNextRef = useRef(false)
  const circuitMenuRef = useRef(null)

  const activeCircuit = useMemo(() => {
    const found = circuitOptions.find((c) => c.id === selectedCircuit)
    return found ?? circuitOptions[0] ?? null
  }, [circuitOptions, selectedCircuit])

  useEffect(() => {
    const ac = new AbortController()

    async function loadCircuitOptions() {
      try {
        const data = await getRaceCalendar(ac.signal)
        const races = Array.isArray(data?.races) ? data.races : []
        const unique = new Map()

        for (const race of races) {
          const name = race?.circuitName || race?.meetingName || 'Circuit onbekend'
          const id = normalizeCircuitKey(name)
          if (!id || unique.has(id)) continue

          const coords = resolveCircuitCoords(name, race?.meetingName)
          if (!coords) continue

          unique.set(id, {
            id,
            name,
            place: name,
            country: race?.countryName || 'Land onbekend',
            lat: coords.lat,
            lon: coords.lon,
            dateStart: race?.dateStart || null,
          })
        }

        const options = [...unique.values()]
        if (!options.length) throw new Error('Geen circuits gevonden via racekalender.')

        const nextRaceId = pickNextRaceCircuitId(races)
        const defaultId =
          nextRaceId && options.some((c) => c.id === nextRaceId)
            ? nextRaceId
            : options[0].id

        setCircuitOptions(options)
        setSelectedCircuit(defaultId)
      } catch {
        const fallback = circuits.map((c) => ({
          id: normalizeCircuitKey(c.place || c.name),
          name: c.name,
          place: c.place,
          country: c.country,
          lat: c.lat,
          lon: c.lon,
          dateStart: null,
        }))
        setCircuitOptions(fallback)
        setSelectedCircuit(fallback[0]?.id || '')
      }
    }

    loadCircuitOptions()
    return () => ac.abort()
  }, [])

  const loadWeather = useCallback(
    async (signal, skipClientCache = false) => {
      if (!activeCircuit) return
      setError('')

      if (!skipClientCache) {
        const pack = readCache(CACHE_KEY_CIRCUIT_WEATHER)
        const entry = pack?.circuits?.[activeCircuit.id]
        if (entry?.weather) setWeather(entry.weather)
        else setWeather(null)

        if (
          entry?.weather &&
          Date.now() - entry.updatedAt < CIRCUIT_WEATHER_CLIENT_FRESH_MS
        ) {
          setLoading(false)
          return
        }
      }

      setLoading(true)
      try {
        const data = await getCircuitWeather(
          activeCircuit.lat,
          activeCircuit.lon,
          signal,
          skipClientCache
        )
        if (signal?.aborted) return
        setWeather(data)
        const pack = readCache(CACHE_KEY_CIRCUIT_WEATHER) || {}
        writeCache(CACHE_KEY_CIRCUIT_WEATHER, {
          circuits: {
            ...(pack.circuits || {}),
            [activeCircuit.id]: { weather: data, updatedAt: Date.now() },
          },
        })
      } catch (err) {
        if (err?.name === 'AbortError') return
        const fallbackPack = readCache(CACHE_KEY_CIRCUIT_WEATHER)
        const fallbackEntry = fallbackPack?.circuits?.[activeCircuit.id]
        if (fallbackEntry?.weather) {
          setWeather(fallbackEntry.weather)
          setError('')
        } else {
          setWeather(null)
          setError(err?.message || 'Weerdata kon niet worden geladen.')
        }
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [activeCircuit]
  )

  useEffect(() => {
    if (!activeCircuit?.lat || !activeCircuit?.lon) return undefined
    const ac = new AbortController()
    const skip = skipClientCacheNextRef.current
    skipClientCacheNextRef.current = false
    loadWeather(ac.signal, skip)
    return () => ac.abort()
  }, [loadWeather, retryKey])

  useEffect(() => {
    if (!isCircuitMenuOpen) return undefined

    const handlePointerDown = (event) => {
      if (!circuitMenuRef.current?.contains(event.target)) {
        setIsCircuitMenuOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsCircuitMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCircuitMenuOpen])

  const handleRetry = () => {
    skipClientCacheNextRef.current = true
    setRetryKey((k) => k + 1)
  }

  const daily = weather?.daily
  const current = weather?.current
  const times = Array.isArray(daily?.time) ? daily.time : []

  const forecastRows = times.map((t, i) => ({
    time: t,
    dayLabel: formatDayLabel(t, i),
    day: i === 0 ? 'Vnd' : formatDayLabel(t, i),
    max: Number(daily?.temperature_2m_max?.[i] ?? 0),
    min: Number(daily?.temperature_2m_min?.[i] ?? 0),
    precip: Number(daily?.precipitation_sum?.[i] ?? 0),
    wind: Number(daily?.windspeed_10m_max?.[i] ?? 0),
    weathercode: daily?.weathercode?.[i],
  }))

  const currentCode = current?.weather_code ?? daily?.weathercode?.[0]
  const currentIcon = weatherCodeToIcon(currentCode)
  const currentLabel = weatherCodeToLabelNl(currentCode)
  const windDir = formatWindDirectionDegrees(current?.wind_direction_10m)

  const todayMax = daily?.temperature_2m_max?.[0]
  const todayMin = daily?.temperature_2m_min?.[0]
  const avgToday = todayMax != null && todayMin != null ? (todayMax + todayMin) / 2 : null

  return (
    <section className={`flex min-h-0 flex-1 flex-col ${pageShell}`}>
      <div className={`relative z-10 w-full shrink-0 border-b ${borderSubtle}`} style={{ height: WEATHER_HERO_HEIGHT_PX, maxHeight: WEATHER_HERO_HEIGHT_PX }}>
        <img
          src={WEATHER_HERO_IMG}
          alt="Circuit en wolken — hero"
          className="absolute inset-0 h-full w-full object-cover object-[center_68%]"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(WEATHER_HERO_FALLBACK)) {
              e.currentTarget.src = WEATHER_HERO_FALLBACK
            }
          }}
        />
        <div className={`absolute inset-0 ${heroOverlay}`} />

        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 sm:px-6 md:px-8 lg:px-10">
          <div className={`relative ml-0 inline-flex w-full max-w-[30rem] flex-col rounded-xl px-3 py-3 backdrop-blur-sm sm:ml-2 md:ml-0 md:px-4 md:py-3 lg:ml-[16rem] ${weatherHeroPanel}`}>
            <div>
                <h1 className={`text-2xl font-extrabold tracking-tight md:text-3xl ${textOnPhoto}`}>
                  Circuit Weer
                </h1>
                <p className={`mt-1 text-sm ${textOnPhoto}`}>
                  Weer op F1-circuits wereldwijd — handig om te zien of het droog blijft voor de race.
                </p>
                <p className={`mt-2 text-sm ${textOnPhoto}`}>
                  📍 {activeCircuit?.place || '—'}, {activeCircuit?.country || '—'} —{' '}
                  {activeCircuit?.name || '—'}
                </p>
                <div className="relative z-[120] mt-2 block max-w-md" ref={circuitMenuRef}>
                  <span className="sr-only">Selecteer circuit</span>
                  <button
                    type="button"
                    onClick={() => setIsCircuitMenuOpen((open) => !open)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm outline-none ring-0 transition hover:border-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:hover:border-slate-500 ${weatherDropdownTrigger}`}
                    aria-haspopup="listbox"
                    aria-expanded={isCircuitMenuOpen}
                    disabled={!activeCircuit}
                  >
                    <span className="truncate">
                      {activeCircuit?.name || 'Circuit kiezen'} ({activeCircuit?.country || '—'})
                    </span>
                    <span aria-hidden className={`ml-2 text-xs ${cardTextMuted}`}>
                      {isCircuitMenuOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {isCircuitMenuOpen && (
                    <div className={`absolute left-0 right-0 z-[999] mt-1 overflow-hidden rounded-lg ${weatherDropdownMenu}`}>
                      <ul className="scrollbar-red max-h-64 overflow-y-auto py-1 sm:max-h-72 lg:max-h-80" role="listbox">
                        {circuitOptions.map((circuit) => {
                          const isSelected = circuit.id === selectedCircuit
                          return (
                            <li key={circuit.id} role="option" aria-selected={isSelected}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCircuit(circuit.id)
                                  setIsCircuitMenuOpen(false)
                                }}
                                className={`block w-full truncate px-3 py-2 text-left text-sm transition ${
                                  isSelected
                                    ? filterChipActive
                                    : `${cardText} theme-dropdown-item`
                                }`}
                              >
                                {circuit.name} ({circuit.country})
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>
        <p className={`pointer-events-none absolute bottom-2 right-4 z-20 text-right text-xs sm:right-6 sm:text-sm md:right-10 ${textOnPhoto}`}>
          Bijgewerkt:{' '}
          <span className="font-semibold">
            {current?.time ? formatClockFromIso(current.time, weather?.utc_offset_seconds) : '—'}
          </span>
        </p>
      </div>

      <PageMainContent maxWidth="max-w-[92rem]">
          {loading && (
            <div className="py-8">
              <LoadingSpinner message="Weer laden..." />
            </div>
          )}

          {!loading && error && <ErrorMessage message={error} onRetry={handleRetry} />}

          {!loading && !error && weather && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col items-stretch gap-4 xl:flex-row xl:items-stretch">
                <article className={`relative w-full overflow-hidden rounded-2xl shadow-lg xl:w-[27%] xl:min-w-[16rem] xl:max-w-[19rem] ${weatherCurrentCard}`}>
                  <div
                    className={`absolute inset-0 bg-cover bg-center ${cardPhoto}`}
                    style={{ backgroundImage: `url(${WEATHER_HERO_IMG})` }}
                    aria-hidden
                  />
                  <div className={`absolute inset-0 ${cardOverlay}`} />
                  <div className="relative z-10 flex h-full flex-col justify-center p-4 sm:min-h-[10rem]">
                    <div className="flex items-center gap-4">
                      <span className="text-5xl" aria-hidden>
                        {currentIcon}
                      </span>
                      <div>
                        <p className={`text-3xl font-extrabold tracking-tight ${cardText}`}>
                          {current?.temperature_2m != null
                            ? `${Math.round(current.temperature_2m)} °C`
                            : '—'}
                        </p>
                        <p className={`mt-0.5 text-xs ${cardTextMuted}`}>{currentLabel}</p>
                      </div>
                    </div>
                    <dl className="relative left-0 mt-3 grid grid-cols-3 gap-2 text-center text-xs sm:-left-2.5">
                      <div className="flex flex-col items-center gap-0.5">
                        <dt className={`leading-none text-xs ${textFaint}`}>Wind</dt>
                        <dd className={`leading-none font-semibold ${cardText}`}>
                          {current?.wind_speed_10m != null
                            ? `${Math.round(current.wind_speed_10m)} km/u`
                            : '—'}
                        </dd>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <dt className={`leading-none text-xs ${textFaint}`}>Neerslag</dt>
                        <dd className={`leading-none font-semibold ${cardText}`}>
                          {current?.precipitation != null
                            ? `${Number(current.precipitation).toFixed(1)} mm`
                            : '—'}
                        </dd>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <dt className={`leading-none text-xs ${textFaint}`}>Luchtvochtigheid</dt>
                        <dd className={`leading-none font-semibold ${cardText}`}>
                          {current?.relative_humidity_2m != null
                            ? `${Math.round(current.relative_humidity_2m)}%`
                            : '—'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </article>

                <div className="min-w-0 w-full xl:flex-1">
                  <h2 className={`mb-3 text-sm font-bold uppercase tracking-wider ${textMuted}`}>
                    7-daagse voorspelling
                  </h2>
                  <div className="scrollbar-red flex flex-col gap-3 pt-1 sm:flex-row sm:gap-3 sm:overflow-x-auto sm:pb-2 xl:grid xl:grid-cols-7 xl:overflow-visible xl:pb-1">
                    {forecastRows.map((row) => (
                      <div key={row.time} className="w-full sm:w-auto sm:min-w-[10rem] sm:flex-none xl:min-w-0 xl:w-auto xl:flex-auto">
                        <WeatherCard
                          dayLabel={row.dayLabel}
                          weathercode={row.weathercode}
                          tempMax={row.max}
                          tempMin={row.min}
                          precipitationMm={row.precip}
                          windKmh={row.wind}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <MetricBlock
                    title="Temperatuur"
                    value={avgToday != null ? `${avgToday.toFixed(1)} °C` : '—'}
                    subtitle="Gemiddeld vandaag"
                    icon="🌡️"
                    chartType="line"
                    chartData={forecastRows}
                    dataKey="max"
                    dataKeySecondary="min"
                    unit="°C"
                  />
                </div>
                <div>
                  <MetricBlock
                    title="Neerslag"
                    value={daily?.precipitation_sum?.[0] != null ? `${Number(daily.precipitation_sum[0]).toFixed(1)} mm` : '—'}
                    subtitle="Totale neerslag vandaag"
                    icon="💧"
                    chartType="area"
                    chartData={forecastRows}
                    dataKey="precip"
                    unit="mm"
                  />
                </div>
                <div className="md:col-span-2 xl:col-span-1">
                  <MetricBlock
                    title="Wind"
                    value={current?.wind_speed_10m != null ? `${Math.round(current.wind_speed_10m)} km/u` : '—'}
                    subtitle={`Huidige richting: ${windDir}`}
                    icon="💨"
                    chartType="line"
                    chartData={forecastRows}
                    dataKey="wind"
                    unit="km/u"
                  />
                </div>
              </div>
            </div>
          )}
      </PageMainContent>
    </section>
  )
}
