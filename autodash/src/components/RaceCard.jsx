// Mobiele racekaart met vaste veldvolgorde: Datum, Circuit, Land, Status (+ optioneel accordion).
import CountryInfoCard from './CountryInfoCard'
import LoadingSpinner from './LoadingSpinner'
import {
  borderSubtle,
  textFaint,
  cardText,
  cardTextMuted,
  cardTextSoft,
  fillRowOpen,
  raceNextRow,
  raceNextRowBadge,
  tableRow,
  statusUpcomingBadge,
} from '../utils/themeClasses'

function getStatusStyle(status, isNextRace = false) {
  if (isNextRace) {
    return {
      card: raceNextRow,
      badge: `min-w-[8rem] rounded-md px-4 py-2 text-center text-sm font-extrabold ${raceNextRowBadge}`,
    }
  }
  if (status === 'Voorbij') {
    return {
      card: `${tableRow} theme-fill-row-open`,
      badge: `min-w-[6.5rem] rounded-md border theme-border theme-fill-row-open px-3 py-1.5 text-center text-xs font-semibold ${cardTextMuted}`,
    }
  }
  if (status === 'Dit weekend') {
    return {
      card: `${tableRow} border-red-400/80 theme-fill-muted ring-1 ring-red-400/25 dark:border-red-600/80 dark:ring-red-500/25`,
      badge:
        'min-w-[6.5rem] rounded-md border border-red-600 bg-red-600 px-3 py-1.5 text-center text-xs font-semibold text-white dark:border-red-500/90 dark:bg-red-900/70',
    }
  }
  return {
    card: tableRow,
    badge: `min-w-[6.5rem] rounded-md border px-3 py-1.5 text-center text-xs font-semibold ${statusUpcomingBadge}`,
  }
}

// Parse helper zonder timezone-drift bij datum-only strings.
function parseDateOnly(isoDateString) {
  if (!isoDateString || typeof isoDateString !== 'string') return null
  const datePart = isoDateString.split('T')[0]
  if (!datePart) return null
  return new Date(`${datePart}T00:00:00Z`)
}

// Format helper voor weekendrange in kaarten.
function formatDateRange(dateStart, dateEnd) {
  const start = parseDateOnly(dateStart)
  const end = parseDateOnly(dateEnd || dateStart)
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Datum onbekend'
  }
  const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' }
  const startLabel = start.toLocaleDateString('nl-NL', dateOptions)
  const endLabel = end.toLocaleDateString('nl-NL', dateOptions)
  return `${startLabel} t/m ${endLabel}`
}

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

function RaceCountryPanel({ loading, error, country }) {
  if (loading) {
    return <LoadingSpinner message="Landinfo laden..." compact />
  }
  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
  }
  if (country) {
    return <CountryInfoCard country={country} />
  }
  return <p className={`text-sm ${textFaint}`}>Geen landinfo beschikbaar.</p>
}

export default function RaceCard({
  session,
  isNextRace = false,
  expanded = false,
  onToggle,
  countryInfo = null,
  countryLoading = false,
  countryError = '',
}) {
  const status = session?.status || 'Aankomend'
  const statusStyle = getStatusStyle(status, isNextRace)
  const isPastRace = status === 'Voorbij'
  const interactive = typeof onToggle === 'function'

  function handleKeyDown(e) {
    if (!interactive) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }

  const cardClass = expanded && !isNextRace ? `${statusStyle.card} ${fillRowOpen}` : statusStyle.card

  return (
    <article className={`overflow-hidden shadow-md transition-colors duration-200 ${cardClass}`}>
      <div
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-expanded={interactive ? expanded : undefined}
        onClick={interactive ? onToggle : undefined}
        onKeyDown={handleKeyDown}
        className={`p-7 ${interactive ? 'cursor-pointer' : ''}`}
      >
        {isNextRace && (
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-red-500">
            Volgende race
          </p>
        )}
        <dl className={`space-y-5 text-base ${isNextRace ? cardTextSoft : cardTextSoft}`}>
          <div className="grid grid-cols-[6.5rem_1fr] gap-3">
            <dt className={textFaint}>Datum</dt>
            <dd className="font-medium">{formatDateRange(session?.dateStart, session?.dateEnd)}</dd>
          </div>
          <div className="grid grid-cols-[6.5rem_1fr] gap-3">
            <dt className={textFaint}>Circuit</dt>
            <dd>
              <span
                className={`block text-xl font-extrabold ${
                  isPastRace && !isNextRace ? textFaint : cardText
                }`}
              >
                {session?.meetingName || 'Race onbekend'}
              </span>
              <span
                className={`mt-1.5 block text-base ${
                  isPastRace && !isNextRace ? textFaint : cardTextMuted
                }`}
              >
                {session?.circuitName || 'Onbekend circuit'}
              </span>
            </dd>
          </div>
          <div className="grid grid-cols-[6.5rem_1fr] gap-3">
            <dt className={textFaint}>Land</dt>
            <dd className="flex items-center gap-3">
              {session?.countryFlag ? (
                <img
                  src={session.countryFlag}
                  alt={session?.countryName || 'Landvlag'}
                  className="h-6 w-8 rounded-sm object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="h-6 w-8 rounded-sm bg-slate-300 dark:bg-slate-600/70" />
              )}
              <span>{session?.countryName || 'Land onbekend'}</span>
            </dd>
          </div>
          <div className="grid grid-cols-[6.5rem_1fr] gap-3">
            <dt className={textFaint}>Status</dt>
            <dd className="flex items-center justify-between gap-2">
              <span className={statusStyle.badge}>{status}</span>
              {interactive ? (
                <span className="shrink-0 text-red-500">
                  <ChevronIcon open={expanded} />
                </span>
              ) : null}
            </dd>
          </div>
        </dl>
      </div>

      {expanded && interactive ? (
        <div className={`border-t px-7 py-4 ${borderSubtle}`}>
          <p className={`mb-3 text-xs font-semibold uppercase tracking-wide ${textFaint}`}>
            Landinfo
          </p>
          <RaceCountryPanel loading={countryLoading} error={countryError} country={countryInfo} />
        </div>
      ) : null}
    </article>
  )
}
