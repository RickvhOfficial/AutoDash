// Route: /weather — weer op F1-circuits (Open-Meteo 7-daagse + actueel).
import { useCallback, useEffect, useMemo, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import WeatherCard from '../components/WeatherCard'
import { circuits } from '../data/circuits'
import { HOME_HERO_HEIGHT_PX } from './Home'
import {
  formatWindDirectionDegrees,
  getCircuitWeather,
  weatherCodeToIcon,
  weatherCodeToLabelNl,
} from '../services/weatherService'

const WEATHER_HERO_HEIGHT_PX = HOME_HERO_HEIGHT_PX
const WEATHER_HERO_IMG =
  'https://images.unsplash.com/photo-1504608524841-42fe6f132db4?auto=format&fit=crop&w=1920&q=80'
const WEATHER_HERO_FALLBACK = '/RaceKalender.jpg'

function formatDayLabel(isoDate, index) {
  if (index === 0) return 'Vandaag'
  const d = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('nl-NL', { weekday: 'short' })
}

function formatClockFromIso(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

export default function CircuitWeather() {
  const [selectedCircuit, setSelectedCircuit] = useState(circuits[0]?.name ?? '')
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  const activeCircuit = useMemo(() => {
    const found = circuits.find((c) => c.name === selectedCircuit)
    return found ?? circuits[0]
  }, [selectedCircuit])

  const loadWeather = useCallback(async (signal) => {
    if (!activeCircuit) return
    setLoading(true)
    setError('')
    try {
      const data = await getCircuitWeather(activeCircuit.lat, activeCircuit.lon, signal)
      setWeather(data)
    } catch (err) {
      if (err?.name === 'AbortError') return
      setWeather(null)
      setError(err?.message || 'Weerdata kon niet worden geladen.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [activeCircuit])

  useEffect(() => {
    const ac = new AbortController()
    loadWeather(ac.signal)
    return () => ac.abort()
  }, [loadWeather, retryKey])

  const handleRetry = () => setRetryKey((k) => k + 1)

  const daily = weather?.daily
  const current = weather?.current
  const times = Array.isArray(daily?.time) ? daily.time : []

  const forecastRows = times.map((t, i) => ({
    time: t,
    dayLabel: formatDayLabel(t, i),
    max: daily?.temperature_2m_max?.[i],
    min: daily?.temperature_2m_min?.[i],
    precip: daily?.precipitation_sum?.[i],
    wind: daily?.windspeed_10m_max?.[i],
    weathercode: daily?.weathercode?.[i],
  }))

  const currentCode = current?.weather_code
  const currentIcon = weatherCodeToIcon(currentCode)
  const currentLabel = weatherCodeToLabelNl(currentCode)
  const windDir = formatWindDirectionDegrees(current?.wind_direction_10m)

  const todayMax = daily?.temperature_2m_max?.[0]
  const todayMin = daily?.temperature_2m_min?.[0]
  const avgToday =
    todayMax != null && todayMin != null ? (todayMax + todayMin) / 2 : null

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-slate-950 text-slate-100">
      <div
        className="relative w-full shrink-0 border-b border-slate-800"
        style={{ height: WEATHER_HERO_HEIGHT_PX, maxHeight: WEATHER_HERO_HEIGHT_PX }}
      >
        <img
          src={WEATHER_HERO_IMG}
          alt="Circuit en wolken — hero"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(WEATHER_HERO_FALLBACK)) {
              e.currentTarget.src = WEATHER_HERO_FALLBACK
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/30 to-slate-950/80" />
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="w-full px-6 py-7 md:px-10">
            <h1 className="pl-12 text-3xl font-extrabold tracking-tight text-white [text-shadow:0_5px_18px_rgba(0,0,0,0.95)] md:text-4xl">
              Circuit Weer
            </h1>
            <p className="mt-1 pl-12 text-sm text-slate-200/90 md:text-base">
              Weer op F1-circuits wereldwijd — handig om te zien of het droog blijft voor de race.
            </p>
          </div>
        </div>
      </div>

      <section className="relative flex min-h-0 flex-1 flex-col px-6 py-10 md:pl-[5rem] md:pr-[3.5rem] md:py-12 lg:py-14">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Weer voor circuits</h2>
              <p className="mt-1 text-sm text-slate-400">Selecteer een circuit om de voorspelling te laden.</p>
            </div>
            <label className="flex max-w-xl flex-col gap-2">
              <span className="text-sm font-medium text-slate-300">Selecteer circuit</span>
              <select
                value={selectedCircuit}
                onChange={(e) => setSelectedCircuit(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white shadow-sm outline-none ring-offset-2 ring-offset-slate-950 focus:ring-2 focus:ring-red-500/60"
              >
                {circuits.map((circuit) => (
                  <option key={circuit.name} value={circuit.name}>
                    {circuit.name} ({circuit.country})
                  </option>
                ))}
              </select>
            </label>

            {activeCircuit && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
                <p className="flex items-center gap-2">
                  <span aria-hidden>📍</span>
                  <span className="text-slate-200">
                    {activeCircuit.name} — {activeCircuit.country}
                  </span>
                </p>
                {current?.time && (
                  <p>
                    Bijgewerkt:{' '}
                    <span className="font-medium text-slate-200">{formatClockFromIso(current.time)}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {loading && (
            <div className="py-8">
              <LoadingSpinner message="Weer laden..." />
            </div>
          )}

          {!loading && error && (
            <ErrorMessage message={error} onRetry={handleRetry} />
          )}

          {!loading && !error && weather && current && (
            <div className="flex flex-col gap-10">
              <article className="relative overflow-hidden rounded-2xl border border-slate-700/90 bg-slate-900/60 shadow-lg">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-25"
                  style={{ backgroundImage: `url(${WEATHER_HERO_IMG})` }}
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/75 to-slate-950/90" />
                <div className="relative z-10 flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
                  <div className="flex items-center gap-5">
                    <span className="text-6xl md:text-7xl" aria-hidden>
                      {currentIcon}
                    </span>
                    <div>
                      <p className="text-5xl font-extrabold tracking-tight text-white md:text-6xl">
                        {current.temperature_2m != null
                          ? `${Math.round(current.temperature_2m)} °C`
                          : '—'}
                      </p>
                      <p className="mt-1 text-lg text-slate-300">{currentLabel}</p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-3 gap-4 border-t border-slate-700/80 pt-4 text-center md:border-l md:border-t-0 md:pl-8 md:pt-0">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Wind</dt>
                      <dd className="mt-1 text-sm font-semibold text-white">
                        {current.wind_speed_10m != null
                          ? `${Math.round(current.wind_speed_10m)} km/u`
                          : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Neerslag</dt>
                      <dd className="mt-1 text-sm font-semibold text-white">
                        {current.precipitation != null
                          ? `${Number(current.precipitation).toFixed(1)} mm`
                          : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Luchtvochtigheid</dt>
                      <dd className="mt-1 text-sm font-semibold text-white">
                        {current.relative_humidity_2m != null
                          ? `${Math.round(current.relative_humidity_2m)}%`
                          : '—'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </article>

              <div>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
                  7-daagse voorspelling
                </h2>
                <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 pt-1 md:flex-wrap md:overflow-visible">
                  {forecastRows.map((row) => (
                    <WeatherCard
                      key={row.time}
                      dayLabel={row.dayLabel}
                      weathercode={row.weathercode}
                      tempMax={row.max}
                      tempMin={row.min}
                      precipitationMm={row.precip}
                      windKmh={row.wind}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <article className="rounded-xl border border-slate-700/90 bg-slate-900/80 p-5">
                  <p className="text-2xl" aria-hidden>
                    🌡️
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {avgToday != null ? `${avgToday.toFixed(1)} °C` : '—'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Gemiddeld (vandaag)</p>
                </article>
                <article className="rounded-xl border border-slate-700/90 bg-slate-900/80 p-5">
                  <p className="text-2xl" aria-hidden>
                    💧
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {daily?.precipitation_sum?.[0] != null
                      ? `${Number(daily.precipitation_sum[0]).toFixed(1)} mm`
                      : '—'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Totaal vandaag</p>
                </article>
                <article className="rounded-xl border border-slate-700/90 bg-slate-900/80 p-5">
                  <p className="text-2xl" aria-hidden>
                    💨
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {current.wind_speed_10m != null
                      ? `${Math.round(current.wind_speed_10m)} km/u`
                      : '—'}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-300">{windDir}</p>
                  <p className="mt-1 text-sm text-slate-500">Wind nu</p>
                </article>
              </div>
            </div>
          )}
        </div>
      </section>
    </section>
  )
}
