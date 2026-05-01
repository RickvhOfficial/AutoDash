// Route: /standings — toont F1 coureurs-standen via server-snapshot (cached).
import { useMemo, useState } from 'react'
import DriverCard from '../components/DriverCard'
import DriverHeadshot from '../components/DriverHeadshot'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import { useF1Drivers } from '../hooks/useF1Drivers'
import { HOME_HERO_HEIGHT_PX } from './Home'

const STANDEN_HERO_HEIGHT_PX = HOME_HERO_HEIGHT_PX
const HERO_IMG = '/standen.jpg'
const HERO_FALLBACK = '/RaceKalender.jpg'

const COUNTRY_BY_FLAG_CODE = {
  nl: 'Nederland',
  gb: 'Verenigd Koninkrijk',
  mc: 'Monaco',
  fr: 'Frankrijk',
  it: 'Italië',
  es: 'Spanje',
  mx: 'Mexico',
  ca: 'Canada',
  th: 'Thailand',
  de: 'Duitsland',
  nz: 'Nieuw-Zeeland',
  ar: 'Argentinië',
  fi: 'Finland',
  au: 'Australië',
  br: 'Brazilië',
}

function getLandLabel(driver) {
  if (driver?.country_code) return driver.country_code
  const flagUrl = String(driver?.flag || '').toLowerCase()
  const match = flagUrl.match(/\/w\d+\/([a-z]{2})\.png$/)
  if (match?.[1] && COUNTRY_BY_FLAG_CODE[match[1]]) {
    return COUNTRY_BY_FLAG_CODE[match[1]]
  }
  return 'Onbekend'
}

export default function DriverStandings() {
  const { drivers, seasonYear, loading, refreshing, error } = useF1Drivers()
  const [search, setSearch] = useState('')
  const displayYear = seasonYear ?? new Date().getFullYear()

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return drivers
    return drivers.filter((d) => {
      const name = d?.full_name?.toLowerCase() ?? d?.name?.toLowerCase() ?? ''
      const team = d?.team_name?.toLowerCase() ?? ''
      return name.includes(term) || team.includes(term)
    })
  }, [drivers, search])

  // Toon altijd alle coureurs; search beperkt de lijst op naam/team.
  const visible = filtered

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-slate-950 text-slate-100">
      <div
        className="relative w-full shrink-0 border-b border-slate-800"
        style={{ height: STANDEN_HERO_HEIGHT_PX, maxHeight: STANDEN_HERO_HEIGHT_PX }}
      >
        <img
          src={HERO_IMG}
          alt="F1 coureurs standen hero"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(HERO_FALLBACK)) {
              e.currentTarget.src = HERO_FALLBACK
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/30 to-slate-950/80" />
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="w-full px-6 py-7 md:px-10">
            <h1 className="pl-12 text-3xl font-extrabold tracking-tight text-white [text-shadow:0_5px_18px_rgba(0,0,0,0.95)] md:text-4xl">
              F1 Coureurs Standen {displayYear}
            </h1>
          </div>
        </div>
      </div>

      <section className="relative flex min-h-0 flex-1 flex-col justify-center px-6 py-10 md:pl-[5rem] md:pr-[3.5rem] md:py-12 lg:py-14">
        {loading && (
          <div className="mx-auto w-full max-w-6xl">
            <LoadingSpinner message="Coureurs laden..." />
          </div>
        )}
        {!loading && (
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative flex w-full max-w-md items-center">
                <span className="sr-only">Zoek op naam of team</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Zoek op naam of team..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/60"
                />
              </label>
              {!error && drivers.length > 0 && (
                <p className="text-sm text-slate-400">
                  {visible.length} van {drivers.length} coureurs
                </p>
              )}
            </div>

            {error && (
              <ErrorMessage
                message={error}
                onRetry={() => {
                  if (typeof window !== 'undefined') window.location.reload()
                }}
              />
            )}

            {!error && drivers.length === 0 && (
              <ErrorMessage message="Er is nog geen actuele kampioenschapsstand beschikbaar." />
            )}

            {!error && drivers.length > 0 && visible.length === 0 && (
              <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-center text-slate-300">
                Geen coureurs gevonden voor je zoekopdracht.
              </p>
            )}

            {!error && visible.length > 0 && (
          <div className="space-y-4">
            {/* Desktop tabel volgens wireframe: Positie | Naam | Team | Punten | Land | Vlag */}
            <div className="hidden overflow-visible rounded-xl border border-slate-700 lg:block">
              <div className="grid grid-cols-[0.6fr_2.2fr_1.6fr_0.9fr_1fr_0.7fr] gap-5 border-b border-slate-700 bg-slate-900/90 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-200">
                <span>Positie</span>
                <span>Naam</span>
                <span>Team</span>
                <span>Punten</span>
                <span>Land</span>
                <span className="text-center">Vlag</span>
              </div>
              <div className="space-y-3 bg-slate-950/60 px-2 py-3">
                {visible.map((driver, idx) => {
                  const teamAccent = driver?.team_colour ? `#${driver.team_colour}` : '#ff1e00'
                  const rowKey = driver.driver_number ?? `${driver.full_name ?? driver.name}-${idx}`
                  const position = driver.position ?? idx + 1
                  return (
                    <div
                      key={rowKey}
                      className="grid min-h-[5.5rem] grid-cols-[0.6fr_2.2fr_1.6fr_0.9fr_1fr_0.7fr] items-center gap-5 rounded-xl border border-slate-800 bg-slate-900/65 px-6 py-3 text-sm text-slate-100 transition-colors duration-200 ease-out hover:bg-slate-800/95"
                      style={{ borderLeft: `4px solid ${teamAccent}` }}
                    >
                      <span className="text-2xl font-extrabold text-red-500">{position}</span>
                      <div className="flex min-w-0 items-center gap-3">
                        <DriverHeadshot
                          src={driver.headshot_url}
                          alt={driver.full_name || driver.name || 'F1 coureur'}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white">
                            {driver.full_name || driver.name || 'Onbekende coureur'}
                          </p>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            {driver.name_acronym || '---'}
                          </p>
                        </div>
                      </div>
                      <span className="truncate text-slate-300">
                        {driver.team_name || 'Team onbekend'}
                      </span>
                      <span className="font-bold text-red-400">
                        {Number(driver.points ?? 0)} pt
                      </span>
                      <span className="truncate text-slate-300">
                        {getLandLabel(driver)}
                      </span>
                      <span className="flex justify-center">
                        {driver.flag ? (
                          <img
                            src={driver.flag}
                            alt={driver.country_code || ''}
                            className="h-5 w-7 rounded-sm border border-slate-700 object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="h-5 w-7 rounded-sm border border-slate-700 bg-slate-800" />
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mobiele weergave hergebruikt DriverCard. */}
            <div className="grid gap-4 lg:hidden sm:grid-cols-2">
              {visible.map((driver, idx) => (
                <DriverCard
                  key={driver.driver_number ?? `${driver.full_name ?? driver.name}-${idx}`}
                  driver={driver}
                  position={driver.position ?? idx + 1}
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
