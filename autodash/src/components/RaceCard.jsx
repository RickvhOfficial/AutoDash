// Mobiele racekaart met vaste veldvolgorde: Datum, Circuit, Land, Status (+ optioneel accordion).
import CountryInfoCard from './CountryInfoCard'
import LoadingSpinner from './LoadingSpinner'
function getStatusStyle(status, isNextRace = false) {
  if (isNextRace) {
    return {
      card: 'border-[#ff1e00]/90 bg-[#181922] ring-1 ring-[#ff1e00]/60 shadow-[0_0_22px_rgba(255,30,0,0.26)]',
      badge:
        'min-w-[8rem] rounded-md border border-[#ff1e00] bg-[#2b1010] px-4 py-2 text-center text-sm font-extrabold text-white ring-1 ring-[#ff1e00]/60 shadow-[0_0_22px_rgba(255,30,0,0.26)]',
    }
  }
  if (status === 'Voorbij') {
    return {
      card: 'border-slate-700 bg-slate-900/35 opacity-75',
      badge:
        'min-w-[6.5rem] rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-center text-xs font-semibold text-slate-100',
    }
  }
  if (status === 'Dit weekend') {
    return {
      card: 'border-red-600/80 bg-red-950/20 ring-1 ring-red-500/25',
      badge:
        'min-w-[6.5rem] rounded-md border border-red-500/90 bg-red-900/70 px-3 py-1.5 text-center text-xs font-semibold text-white',
    }
  }
  return {
    card: 'border-emerald-500/70 bg-emerald-900/10',
    badge:
      'min-w-[6.5rem] rounded-md border border-emerald-500/80 bg-emerald-700/90 px-3 py-1.5 text-center text-xs font-semibold text-white',
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
    return <p className="text-sm text-red-300">{error}</p>
  }
  if (country) {
    return <CountryInfoCard country={country} />
  }
  return <p className="text-sm text-slate-500">Geen landinfo beschikbaar.</p>
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

  return (
    <article
      className={`rounded-2xl border shadow-md transition-colors duration-200 ${
        expanded ? 'border-slate-600' : ''
      } ${
        isPastRace ? 'opacity-85 shadow-[inset_0_0_0_9999px_rgba(148,163,184,0.08)]' : ''
      } ${statusStyle.card}`}
    >
      <div
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-expanded={interactive ? expanded : undefined}
        onClick={interactive ? onToggle : undefined}
        onKeyDown={handleKeyDown}
        className={`p-7 ${interactive ? 'cursor-pointer' : ''} ${
          expanded ? 'bg-slate-800/40' : interactive ? 'hover:bg-slate-800/30' : ''
        }`}
      >
      {isNextRace && (
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-red-300">
          Volgende race
        </p>
      )}
      <dl className="space-y-5 text-base text-slate-200">
        <div className="grid grid-cols-[6.5rem_1fr] gap-3">
          <dt className="text-slate-400">Datum</dt>
          <dd className="font-medium">{formatDateRange(session?.dateStart, session?.dateEnd)}</dd>
        </div>
        <div className="grid grid-cols-[6.5rem_1fr] gap-3">
          <dt className="text-slate-400">Circuit</dt> 
          <dd>
            <span className="block text-xl font-extrabold text-white">
              {session?.meetingName || 'Race onbekend'}
            </span>
            <span className="mt-1.5 block text-base text-slate-300">
              {session?.circuitName || 'Onbekend circuit'}
            </span>
          </dd>
        </div>
        <div className="grid grid-cols-[6.5rem_1fr] gap-3">
          <dt className="text-slate-400">Land</dt>
          <dd className="flex items-center gap-3">
            {session?.countryFlag ? (
              <img
                src={session.countryFlag}
                alt={session?.countryName || 'Landvlag'}
                className="h-6 w-8 rounded-sm object-cover"
                loading="lazy"
              />
            ) : (
              <span className="h-6 w-8 rounded-sm bg-slate-600/70" />
            )}
            <span>{session?.countryName || 'Land onbekend'}</span>
          </dd>
        </div>
        <div className="grid grid-cols-[6.5rem_1fr] gap-3">
          <dt className="text-slate-400">Status</dt>
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
        <div className="border-t border-slate-800/90 px-7 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Landinfo
          </p>
          <RaceCountryPanel loading={countryLoading} error={countryError} country={countryInfo} />
        </div>
      ) : null}
    </article>
  )
}
