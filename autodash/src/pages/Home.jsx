// Route: / — dashboard-overzicht met widgets voor volgende race, weer, standen en laptracker.
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import PageMainContent from '../components/PageMainContent'
import { useDashboardData } from '../hooks/useDashboardData'
import { useLapTimes } from '../hooks/useLapTimes'
import { getHomeLapSummary } from '../utils/lapStorage'

const HERO_IMG =
  'https://images.unsplash.com/photo-1728116693268-125c5d6ad9e2?auto=format&fit=crop&w=1920&q=80'

export const HOME_HERO_HEIGHT_PX = 250

// Bovenste hero-sectie van Home; wordt ook gebruikt voor layout-berekeningen in App.
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
                <span className="text-[#d50000] italic [text-shadow:0_4px_12px_rgba(0,0,0,0.88)]">
                  Auto
                </span>
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

export default function Home() {
  const {
    nextRace,
    weather,
    drivers,
    seasonStats,
    bgPhotos,
    fallbackPhotos,
    initialLoading,
    refreshing,
  } = useDashboardData()

  const { data: lapData } = useLapTimes()

  const lapSummary = useMemo(() => getHomeLapSummary(lapData), [lapData])

  // Gedeelde card-styling voor alle dashboardtegels.
  const cardClass =
    'group relative overflow-hidden rounded-lg border border-slate-700/80 bg-slate-900/55 p-5 text-left shadow-lg shadow-black/25 transition-[transform,box-shadow,background-color,border-color] duration-300 ease-out hover:scale-[1.015] hover:border-slate-500/80 hover:bg-slate-900/70 hover:shadow-xl hover:shadow-black/45'

  // Rendert achtergrondfoto + overlay per kaarttegel.
  function renderCardBackground(idx) {
    const imageUrl = bgPhotos[idx]?.url || fallbackPhotos[idx]?.url
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

  // Volgende race: baanschets rechts. carbon.png is donker op donker → invert maakt wegdek zichtbaar wit.
  function renderNextRaceBackground(circuitImage) {
    if (!circuitImage) {
      return <div className="absolute inset-0 bg-slate-950" />
    }
    const isCarbon = /carbon/i.test(circuitImage)
    const trackClass = isCarbon
      ? 'pointer-events-none absolute inset-y-0 right-0 w-[58%] object-contain object-right p-3 invert brightness-125 opacity-95'
      : 'pointer-events-none absolute inset-y-0 right-0 w-[58%] object-contain object-right p-3 brightness-200 contrast-125 opacity-95'
    return (
      <>
        <div className="absolute inset-0 bg-slate-950" />
        <img src={circuitImage} alt="" aria-hidden="true" className={trackClass} />
        <div className="absolute inset-y-0 left-0 w-[46%] bg-gradient-to-r from-slate-950 to-transparent" />
      </>
    )
  }

  // Converteert OpenF1-datums veilig naar lokale NL weergave.
  function formatMeetingCalendarDate(isoString) {
    if (!isoString || typeof isoString !== 'string') return null
    const datePart = isoString.split('T')[0]
    if (!datePart) return null
    const utcMidnight = new Date(`${datePart}T00:00:00Z`)
    return utcMidnight.toLocaleDateString('nl-NL', { timeZone: 'UTC' })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-950 text-slate-100">
      <PageMainContent>
        {initialLoading && <LoadingSpinner message="Dashboard data laden..." />}
        {!initialLoading && (
          <>
            <div className="grid items-stretch gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="grid gap-6 sm:grid-cols-2">
                <Link to="/races" className={`${cardClass} min-h-44 cursor-pointer`}>
                  {renderNextRaceBackground(nextRace.data?.circuitImage)}
                  <div className="relative z-10 max-w-[55%] [text-shadow:0_1px_10px_rgba(2,6,23,0.95)]">
                    <span className="mb-3 block h-0.5 w-14 rounded-full bg-red-500/70" />
                    <h2 className="border-l-2 border-red-500/70 pl-2 text-sm font-semibold">
                      Volgende race
                    </h2>
                    {nextRace.loading && !nextRace.data && (
                      <div className="mt-3.5 flex min-h-[7rem] items-center justify-center">
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
                    {!nextRace.loading && !nextRace.data && nextRace.error && (
                      <p className="mt-3 text-sm text-slate-300">
                        {nextRace.error}
                      </p>
                    )}
                    {!nextRace.loading && !nextRace.data && !nextRace.error && (
                      <p className="mt-3 text-sm text-slate-300">
                        Race data tijdelijk niet beschikbaar.
                      </p>
                    )}
                  </div>
                </Link>

                <Link to="/weather" className={`${cardClass} min-h-44 cursor-pointer`}>
                  {renderCardBackground(1)}
                  <div className="relative z-10">
                    <h2 className="text-sm font-semibold">Weer op circuit</h2>
                    {weather.loading && !weather.data && (
                      <div className="mt-3.5 flex min-h-[7rem] items-center justify-center">
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
                    {!weather.loading && !weather.data && weather.error && (
                      <p className="mt-3 text-sm text-slate-300">
                        {weather.error}
                      </p>
                    )}
                    {!weather.loading && !weather.data && !weather.error && (
                      <p className="mt-3 text-sm text-slate-300">
                        Weer data tijdelijk niet beschikbaar.
                      </p>
                    )}
                  </div>
                </Link>

                <Link to="/standings" className={`${cardClass} min-h-44 cursor-pointer`}>
                  {renderCardBackground(2)}
                  <div className="relative z-10">
                    <h2 className="text-sm font-semibold">Coureurs lijst</h2>
                    {drivers.loading && drivers.data.length === 0 && (
                      <div className="mt-3.5 flex min-h-[7rem] items-center justify-center">
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
                            <span className="truncate">
                              #{driver.number} {driver.name}
                            </span>
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

                <Link to="/standings" className={`${cardClass} min-h-44 cursor-pointer`}>
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
                      <div className="mt-3.5 flex min-h-[7rem] items-center justify-center">
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
                        {seasonStats.data.map((entry, idx) => (
                          <li
                            key={entry.driver_number ?? `${entry.name}-${idx}`}
                            className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-2"
                          >
                            <span className="text-slate-200">
                              {entry.position ?? idx + 1}
                            </span>
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

              <Link
                to="/lap-tracker"
                className={`${cardClass} min-h-[356px] cursor-pointer border-red-500/40 lg:h-full`}
              >
                {renderCardBackground(4)}
                <div className="relative z-10 flex h-full min-h-[356px] flex-col">
                  <span className="mb-3 block h-0.5 w-20 rounded-full bg-red-500/75" />
                  <h2 className="border-l-2 border-red-500/75 pl-2 text-base font-semibold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.95)]">
                    Mijn rondetijden
                  </h2>
                  {!lapSummary && (
                    <p className="mt-4 text-sm leading-relaxed text-slate-200 [text-shadow:0_2px_8px_rgba(0,0,0,0.92)]">
                      Nog geen tijden opgeslagen. Voeg je eerste rondes toe in de karttijden-tracker
                      om hier je prestaties te zien.
                    </p>
                  )}
                  {lapSummary && (
                    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-5">
                      <div className="min-h-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300 [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
                          Top 5 snelste rondes
                        </p>
                        <ol className="scrollbar-red mt-2 max-h-[11.5rem] space-y-2 overflow-y-auto text-sm">
                          {lapSummary.topFive.map((lap, idx) => (
                            <li
                              key={`${lap.trackName}-${lap.time}-${idx}`}
                              className="flex items-baseline justify-between gap-3 border-b border-slate-600/35 pb-2 last:border-0 last:pb-0"
                            >
                              <span
                                className="min-w-0 flex-1 truncate text-slate-100 [text-shadow:0_2px_8px_rgba(0,0,0,0.9)]"
                                title={lap.trackName}
                              >
                                <span className="mr-2 tabular-nums text-slate-400">{idx + 1}.</span>
                                {lap.trackName}
                              </span>
                              <span className="shrink-0 font-mono font-bold text-red-300 [text-shadow:0_2px_8px_rgba(0,0,0,0.9)]">
                                {lap.time}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="border-t border-slate-500/50 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300 [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
                          Laatst gereden
                        </p>
                        <p className="mt-2 font-mono text-xl font-bold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.95)]">
                          {lapSummary.latest.time}
                        </p>
                        <p
                          className="mt-1 truncate text-sm text-slate-200 [text-shadow:0_2px_8px_rgba(0,0,0,0.9)]"
                          title={lapSummary.latest.trackName}
                        >
                          {lapSummary.latest.trackName}
                        </p>
                      </div>

                      <p className="text-xs text-slate-400 [text-shadow:0_1px_6px_rgba(0,0,0,0.88)]">
                        {lapSummary.total} rondes · {lapSummary.trackCount} banen
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </>
        )}
        {!initialLoading && refreshing && (
          <div className="pointer-events-none absolute right-2 top-2 z-20 md:right-10 md:top-10">
            <div className="origin-top-right scale-[0.45]">
              <LoadingSpinner compact message="" />
            </div>
          </div>
        )}
      </PageMainContent>
    </div>
  )
}
