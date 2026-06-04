// Mobiele racekaart met vaste veldvolgorde: Datum, Circuit, Land, Status (+ optioneel accordion).
import RaceCardCountryPanel from './RaceCardCountryPanel'
import RaceCardFields from './RaceCardFields'
import { getStatusStyle } from './raceCardHelpers'
import { borderSubtle, textFaint, fillRowOpen } from '../utils/themeClasses'

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
        <RaceCardFields
          session={session}
          status={status}
          statusStyle={statusStyle}
          isNextRace={isNextRace}
          isPastRace={isPastRace}
          interactive={interactive}
          expanded={expanded}
        />
      </div>

      {expanded && interactive ? (
        <div className={`border-t px-7 py-4 ${borderSubtle}`}>
          <p className={`mb-3 text-xs font-semibold uppercase tracking-wide ${textFaint}`}>
            Landinfo
          </p>
          <RaceCardCountryPanel
            loading={countryLoading}
            error={countryError}
            country={countryInfo}
          />
        </div>
      ) : null}
    </article>
  )
}
