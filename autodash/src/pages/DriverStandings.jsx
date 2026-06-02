// Route: /standings — toont F1 coureurs-standen via server-snapshot (cached).
import { useMemo, useState } from 'react'
import DriverCard from '../components/DriverCard'
import DriverHeadshot from '../components/DriverHeadshot'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import PageMainContent from '../components/PageMainContent'
import { driverFlagUrl, resolveDriverCountryLabel } from '../data/driverNationalities'
import { useF1Drivers } from '../hooks/useF1Drivers'
import { HOME_HERO_HEIGHT_PX } from './Home'
import { heroOverlay, pageShell, borderSubtle, borderDefault, inputField, tableWrap, tableHeader, tableBody, tableRow, panel, panelMuted, textFaint, cardText, cardTextMuted, textOnPhoto } from '../utils/themeClasses'

const STANDEN_HERO_HEIGHT_PX = HOME_HERO_HEIGHT_PX
const HERO_IMG = '/standen.jpg'
const HERO_FALLBACK = '/RaceKalender.jpg'

export default function DriverStandings() {
  const { drivers, seasonYear, loading, error } = useF1Drivers()
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
    <section className={`flex min-h-0 flex-1 flex-col ${pageShell}`}>
      <div
        className={`relative w-full shrink-0 border-b ${borderSubtle}`}
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
        <div className={`absolute inset-0 ${heroOverlay}`} />
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="w-full px-6 py-7 md:px-10">
            <h1 className={`pl-12 text-3xl font-extrabold tracking-tight md:text-4xl ${textOnPhoto}`}>
              F1 Coureurs Standen {displayYear}
            </h1>
          </div>
        </div>
      </div>

      <PageMainContent>
        {loading && <LoadingSpinner message="Coureurs laden..." />}
        {!loading && (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative flex w-full max-w-md items-center">
                <span className="sr-only">Zoek op naam of team</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Zoek op naam of team..."
                  className={`w-full rounded-lg px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/60 ${inputField}`}
                />
              </label>
              {!error && drivers.length > 0 && (
                <p className={`text-sm ${textFaint}`}>
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
              <div className={`${panel} text-center`}>
                <p className="text-base leading-relaxed">
                  Er is nog geen actuele kampioenschapsstand beschikbaar.
                </p>
              </div>
            )}

            {!error && drivers.length > 0 && visible.length === 0 && (
              <p className={panelMuted}>
                Geen coureurs gevonden voor je zoekopdracht.
              </p>
            )}

            {!error && visible.length > 0 && (
          <div className="space-y-4">
            {/* Desktop tabel volgens wireframe: Positie | Naam | Team | Punten | Land | Vlag */}
            <div className={`hidden ${tableWrap} lg:block`}>
              <div className={`grid grid-cols-[0.6fr_2.2fr_1.6fr_0.9fr_1fr_0.7fr] gap-5 px-6 py-4 ${tableHeader}`}>
                <span>Positie</span>
                <span>Naam</span>
                <span>Team</span>
                <span>Punten</span>
                <span>Land</span>
                <span className="text-center">Vlag</span>
              </div>
              <div className={tableBody}>
                {visible.map((driver, idx) => {
                  const teamAccent = driver?.team_colour ? `#${driver.team_colour}` : '#ff1e00'
                  const rowKey = driver.driver_number ?? `${driver.full_name ?? driver.name}-${idx}`
                  const position = driver.position ?? idx + 1
                  const flagSrc = driverFlagUrl(driver)
                  return (
                    <div
                      key={rowKey}
                      className={`grid min-h-[5.5rem] grid-cols-[0.6fr_2.2fr_1.6fr_0.9fr_1fr_0.7fr] items-center gap-5 px-6 py-3 ${tableRow}`}
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
                          <p className={`truncate font-bold ${cardText}`}>
                            {driver.full_name || driver.name || 'Onbekende coureur'}
                          </p>
                          <p className={`text-xs uppercase tracking-wide ${textFaint}`}>
                            {driver.name_acronym || '---'}
                          </p>
                        </div>
                      </div>
                      <span className={`truncate ${cardTextMuted}`}>
                        {driver.team_name || 'Team onbekend'}
                      </span>
                      <span className="font-bold text-red-400">
                        {Number(driver.points ?? 0)} pt
                      </span>
                      <span className={`truncate ${cardTextMuted}`}>
                        {resolveDriverCountryLabel(driver)}
                      </span>
                      <span className="flex justify-center">
                        {flagSrc ? (
                          <img
                            src={flagSrc}
                            alt={resolveDriverCountryLabel(driver)}
                            className={`h-5 w-7 rounded-sm border object-cover ${borderDefault}`}
                            loading="lazy"
                          />
                        ) : (
                          <span className={`h-5 w-7 rounded-sm border bg-slate-200 dark:bg-slate-800 ${borderDefault}`} />
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
          </>
        )}
      </PageMainContent>
    </section>
  )
}
