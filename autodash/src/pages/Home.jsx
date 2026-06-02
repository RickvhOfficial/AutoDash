// Route: / — dashboard-overzicht met widgets voor volgende race, weer, standen en laptracker.
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import PageMainContent from '../components/PageMainContent'
import { useDashboardData } from '../hooks/useDashboardData'
import { useLapTimes } from '../hooks/useLapTimes'
import { getHomeLapSummary } from '../utils/lapStorage'
import {
  borderSubtle,
  homeCardOverlay,
  cardPhoto,
  cardPhotoWrap,
  cardText,
  cardTextMuted,
  cardTextSoft,
  heroOverlayHome,
  homeCardClass,
  homeCardFill,
  homeCardPhotoContent,
  pageShell,
  textFaint,
  textOnPhoto,
} from '../utils/themeClasses'

const HERO_IMG =
  'https://images.unsplash.com/photo-1728116693268-125c5d6ad9e2?auto=format&fit=crop&w=1920&q=80'

export const HOME_HERO_HEIGHT_PX = 250

// Bovenste hero-sectie van Home; wordt ook gebruikt voor layout-berekeningen in App.
export function HomeHero() {
  return (
    <section
      className={`relative w-full shrink-0 border-b ${borderSubtle}`}
      style={{ height: HOME_HERO_HEIGHT_PX, maxHeight: HOME_HERO_HEIGHT_PX }}
    >
      <div className="relative h-full w-full">
        <img
          src={HERO_IMG}
          alt="Formule 1-raceauto op het circuit — hero"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className={`absolute inset-0 ${heroOverlayHome}`} />
        <div className="absolute inset-x-0 top-24 bottom-0 z-10 flex flex-col justify-center lg:pl-[5rem]">
          <div className="mx-auto w-full max-w-6xl px-6 py-2 md:px-10">
            <div className="inline-block max-w-full">
              <h1 className={`text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl ${textOnPhoto}`}>
                Welkom bij{' '}
                <span className="text-[#d50000] italic [text-shadow:0_4px_12px_rgba(0,0,0,0.88)]">
                  Auto
                </span>
                <span className="italic">Dash</span>
              </h1>
              <p className={`mt-2 max-w-xl text-base font-medium leading-relaxed md:text-xl ${textOnPhoto}`}>
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
  const cardClass = `${homeCardClass}`

  // Rendert navy basis + achtergrondfoto + donkere overlay (zelfde look als dark theme).
  function renderCardBackground(idx) {
    const imageUrl = bgPhotos[idx]?.url || fallbackPhotos[idx]?.url
    return (
      <>
        <div className={`absolute inset-0 ${homeCardFill}`} />
        <img
          src={imageUrl}
          alt="Formula 1 achtergrond"
          className={`${cardPhotoWrap} ${cardPhoto}`}
        />
        <div className={`absolute inset-0 ${homeCardOverlay}`} />
      </>
    )
  }

  // Volgende race: baanschets rechts. carbon.png is donker op donker → invert maakt wegdek zichtbaar wit.
  function renderNextRaceBackground(circuitImage) {
    if (!circuitImage) {
      return <div className={`absolute inset-0 ${homeCardFill}`} />
    }
    const isCarbon = /carbon/i.test(circuitImage)
    const trackClass = isCarbon
      ? 'pointer-events-none absolute inset-y-0 right-0 z-[1] w-[58%] object-contain object-right p-3 opacity-85 invert brightness-125'
      : 'pointer-events-none absolute inset-y-0 right-0 z-[1] w-[58%] object-contain object-right p-3 opacity-50 brightness-200 contrast-125 dark:opacity-95'
    return (
      <>
        <div className={`absolute inset-0 ${homeCardFill}`} />
        <img src={circuitImage} alt="" aria-hidden="true" className={trackClass} />
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
    <div className={`flex min-h-0 flex-1 flex-col ${pageShell}`}>
      <PageMainContent>
        {initialLoading && <LoadingSpinner message="Dashboard data laden..." />}
        {!initialLoading && (
          <>
            <div className="grid items-stretch gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="grid gap-6 sm:grid-cols-2">
                <Link to="/races" className={`${cardClass} min-h-44 cursor-pointer`}>
                  {renderNextRaceBackground(nextRace.data?.circuitImage)}
                  <div className={`${homeCardPhotoContent} relative z-10 max-w-[58%]`}>
                    <span className="mb-3 block h-0.5 w-14 rounded-full bg-red-500/70" />
                    <h2 className={`border-l-2 border-red-500/70 pl-2 text-sm font-semibold ${cardText}`}>
                      Volgende race
                    </h2>
                    {nextRace.loading && !nextRace.data && (
                      <div className="mt-3.5 flex min-h-[7rem] items-center justify-center">
                        <LoadingSpinner compact message="" />
                      </div>
                    )}
                    {nextRace.data && (
                      <div className={`mt-2 space-y-1 text-sm ${cardText}`}>
                        <p className="font-medium">{nextRace.data.meeting_name || 'Race onbekend'}</p>
                        <p className={cardTextMuted}>{nextRace.data.circuitName}</p>
                        <div className={`flex items-center gap-2 ${cardTextMuted}`}>
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
                        <p className={cardTextMuted}>
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
                      <p className={`mt-3 text-sm ${cardTextMuted}`}>
                        {nextRace.error}
                      </p>
                    )}
                    {!nextRace.loading && !nextRace.data && !nextRace.error && (
                      <p className={`mt-3 text-sm ${cardTextMuted}`}>
                        Race data tijdelijk niet beschikbaar.
                      </p>
                    )}
                  </div>
                </Link>

                <Link to="/weather" className={`${cardClass} min-h-44 cursor-pointer`}>
                  {renderCardBackground(1)}
                  <div className={homeCardPhotoContent}>
                    <h2 className={`text-sm font-semibold ${cardText}`}>Weer op circuit</h2>
                    {weather.loading && !weather.data && (
                      <div className="mt-3.5 flex min-h-[7rem] items-center justify-center">
                        <LoadingSpinner compact message="" />
                      </div>
                    )}
                    {weather.data && (
                      <div className={`mt-2 space-y-1 text-sm ${cardText}`}>
                        <p className={`font-medium ${cardTextSoft}`}>{weather.data.raceCircuit}</p>
                        <p>Temperatuur: {Math.round(weather.data.temperature_2m ?? 0)}°C</p>
                        <p className={cardTextMuted}>
                          Wind: {Math.round(weather.data.wind_speed_10m ?? 0)} km/u
                        </p>
                        <p className={cardTextMuted}>
                          Regen: {(weather.data.precipitation ?? 0).toFixed(1)} mm
                        </p>
                      </div>
                    )}
                    {!weather.loading && !weather.data && weather.error && (
                      <p className={`mt-3 text-sm ${cardTextMuted}`}>
                        {weather.error}
                      </p>
                    )}
                    {!weather.loading && !weather.data && !weather.error && (
                      <p className={`mt-3 text-sm ${cardTextMuted}`}>
                        Weer data tijdelijk niet beschikbaar.
                      </p>
                    )}
                  </div>
                </Link>

                <Link to="/standings" className={`${cardClass} min-h-44 cursor-pointer`}>
                  {renderCardBackground(2)}
                  <div className={homeCardPhotoContent}>
                    <h2 className={`text-sm font-semibold ${cardText}`}>Coureurs lijst</h2>
                    {drivers.loading && drivers.data.length === 0 && (
                      <div className="mt-3.5 flex min-h-[7rem] items-center justify-center">
                        <LoadingSpinner compact message="" />
                      </div>
                    )}
                    {drivers.data.length > 0 && (
                      <ul className={`scrollbar-red mt-2 max-h-40 space-y-1 overflow-y-auto text-sm ${cardText}`}>
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
                      <p className={`mt-3 text-sm ${cardTextMuted}`}>
                        {drivers.error || 'Coureurs tijdelijk niet beschikbaar.'}
                      </p>
                    )}
                  </div>
                </Link>

                <Link to="/standings" className={`${cardClass} min-h-44 cursor-pointer`}>
                  {renderCardBackground(3)}
                  <div className={homeCardPhotoContent}>
                    <div className="flex items-center justify-between gap-2">
                      <h2 className={`text-sm font-semibold ${cardText}`}>Seizoen ranglijst</h2>
                      {!seasonStats.loading && !seasonStats.error && seasonStats.data.length > 0 && (
                        <p className={`text-xs ${textFaint}`}>
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
                      <p className={`mt-3 text-sm ${cardTextMuted}`}>
                        {seasonStats.error || 'Geen actuele seizoensstand beschikbaar.'}
                      </p>
                    )}
                    {seasonStats.data.length > 0 && (
                      <ul className={`scrollbar-red mt-2 max-h-40 space-y-1 overflow-y-auto text-xs ${cardText}`}>
                        {seasonStats.data.map((entry, idx) => (
                          <li
                            key={entry.driver_number ?? `${entry.name}-${idx}`}
                            className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-2"
                          >
                            <span className={cardTextSoft}>
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
                            <span className={cardTextMuted}>{entry.points} pt</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Link>
              </div>

              <Link
                to="/lap-tracker"
                className={`${cardClass} min-h-[356px] cursor-pointer lg:h-full`}
              >
                {renderCardBackground(4)}
                <div className={`${homeCardPhotoContent} flex h-full min-h-[356px] flex-col`}>
                  <span className="mb-3 block h-0.5 w-20 rounded-full bg-red-500/75" />
                  <h2 className={`border-l-2 border-red-500/75 pl-2 text-base font-semibold ${cardText}`}>
                    Mijn rondetijden
                  </h2>
                  {!lapSummary && (
                    <p className={`mt-4 text-sm leading-relaxed ${cardTextSoft}`}>
                      Nog geen tijden opgeslagen. Voeg je eerste rondes toe in de karttijden-tracker
                      om hier je prestaties te zien.
                    </p>
                  )}
                  {lapSummary && (
                    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-5">
                      <div className="min-h-0 flex-1">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${cardTextMuted}`}>
                          Top 5 snelste rondes
                        </p>
                        <ol className="scrollbar-red mt-2 max-h-[11.5rem] space-y-2 overflow-y-auto text-sm">
                          {lapSummary.topFive.map((lap, idx) => (
                            <li
                              key={`${lap.trackName}-${lap.time}-${idx}`}
                              className="flex items-baseline justify-between gap-3 border-b border-white/15 pb-2 last:border-0 last:pb-0"
                            >
                              <span
                                className={`min-w-0 flex-1 truncate ${cardText}`}
                                title={lap.trackName}
                              >
                                <span className={`mr-2 tabular-nums ${textFaint}`}>{idx + 1}.</span>
                                {lap.trackName}
                              </span>
                              <span className="shrink-0 font-mono font-bold text-white">
                                {lap.time}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="border-t border-white/15 pt-4">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${cardTextMuted}`}>
                          Laatst gereden
                        </p>
                        <p className={`mt-2 font-mono text-xl font-bold ${cardText}`}>
                          {lapSummary.latest.time}
                        </p>
                        <p
                          className={`mt-1 truncate text-sm ${cardTextSoft}`}
                          title={lapSummary.latest.trackName}
                        >
                          {lapSummary.latest.trackName}
                        </p>
                      </div>

                      <p className={`text-xs ${textFaint}`}>
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
