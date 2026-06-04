import SafeImg from './SafeImg'
import RaceCardChevronIcon from './RaceCardChevronIcon'
import { formatDateRange } from './raceCardHelpers'
import { textFaint, cardText, cardTextMuted, cardTextSoft } from '../utils/themeClasses'

export default function RaceCardFields({
  session,
  status,
  statusStyle,
  isNextRace,
  isPastRace,
  interactive,
  expanded,
}) {
  return (
    <>
      {isNextRace && (
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-red-500">
          Volgende race
        </p>
      )}
      <dl className={`space-y-5 text-base ${cardTextSoft}`}>
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
              <SafeImg
                src={session.countryFlag}
                alt={session?.countryName || 'Landvlag'}
                className="h-6 w-8 rounded-sm object-cover"
                loading="lazy"
                fallback={
                  <span className="h-6 w-8 rounded-sm bg-slate-300 dark:bg-slate-600/70" aria-hidden />
                }
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
                <RaceCardChevronIcon open={expanded} />
              </span>
            ) : null}
          </dd>
        </div>
      </dl>
    </>
  )
}
