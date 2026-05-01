// Mobiele coureur-kaart: positie, foto, team, land, punten + team_colour accent.
import DriverHeadshot from './DriverHeadshot'

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

export default function DriverCard({ driver, position }) {
  const teamAccent = driver?.team_colour ? `#${driver.team_colour}` : '#ff1e00'
  const displayPosition = position ?? driver?.position ?? '-'
  const displayName = driver?.full_name || driver?.name || 'Onbekende coureur'
  const points = Number(driver?.points ?? 0)

  return (
    <article
      className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-md transition-transform duration-200 ease-out hover:scale-[1.015] hover:bg-slate-800/90"
      style={{ borderLeft: `4px solid ${teamAccent}` }}
    >
      <span className="w-10 shrink-0 text-3xl font-extrabold text-red-500">
        {displayPosition}
      </span>
      <DriverHeadshot src={driver?.headshot_url} alt={displayName} size="md" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-bold text-white">
          {displayName}
          {driver?.name_acronym && (
            <span className="ml-1 text-slate-400">({driver.name_acronym})</span>
          )}
        </h3>
        <p className="truncate text-sm text-slate-300">
          {driver?.team_name || 'Team onbekend'}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-500">
            {getLandLabel(driver)}
          </span>
          <span className="text-sm font-bold text-red-400">{points} pt</span>
        </div>
      </div>
    </article>
  )
}
