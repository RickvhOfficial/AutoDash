// Coureur-kaart met positienummer, foto, naam, team, landcode + team_colour accent.
export default function DriverCard({ driver, position }) {
  const teamAccent = driver?.team_colour ? `#${driver.team_colour}` : '#ff1e00'
  const headshot = driver?.headshot_url || '/placeholder-driver.png'

  return (
    <article
      className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-md transition-transform duration-200 ease-out hover:scale-[1.015] hover:bg-slate-800/90"
      style={{ borderLeft: `4px solid ${teamAccent}` }}
    >
      <span className="w-10 shrink-0 text-3xl font-extrabold text-red-500">
        {position}
      </span>
      <img
        src={headshot}
        alt={driver?.full_name || 'F1 coureur'}
        className="h-16 w-16 rounded-full border border-slate-700 object-cover"
        loading="lazy"
        onError={(e) => {
          if (!e.currentTarget.src.endsWith('/placeholder-driver.png')) {
            e.currentTarget.src = '/placeholder-driver.png'
          }
        }}
      />
      <div className="min-w-0">
        <h3 className="truncate text-base font-bold text-white">
          {driver?.full_name || 'Onbekende coureur'}
          {driver?.name_acronym && (
            <span className="ml-1 text-slate-400">({driver.name_acronym})</span>
          )}
        </h3>
        <p className="truncate text-sm text-slate-300">
          {driver?.team_name || 'Team onbekend'}
        </p>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {driver?.country_code || '—'}
        </p>
      </div>
    </article>
  )
}
