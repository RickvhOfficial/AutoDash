// Mobiele coureur-kaart: positie, foto, team, land, punten + team_colour accent.

import { resolveDriverCountryLabel } from '../data/driverNationalities'

import DriverHeadshot from './DriverHeadshot'

import { driverCardClass, cardText, cardTextMuted, cardTextSoft, textFaint } from '../utils/themeClasses'



export default function DriverCard({ driver, position }) {

  const teamAccent = driver?.team_colour ? `#${driver.team_colour}` : '#ff1e00'

  const displayPosition = position ?? driver?.position ?? '-'

  const displayName = driver?.full_name || driver?.name || 'Onbekende coureur'

  const points = Number(driver?.points ?? 0)



  return (

    <article

      className={driverCardClass}

      style={{ borderLeft: `4px solid ${teamAccent}` }}

    >

      <span className="w-10 shrink-0 text-3xl font-extrabold text-red-500">

        {displayPosition}

      </span>

      <DriverHeadshot src={driver?.headshot_url} alt={displayName} size="md" />

      <div className="min-w-0 flex-1">

        <h3 className={`truncate text-base font-bold ${cardText}`}>

          {displayName}

          {driver?.name_acronym && (

            <span className={`ml-1 ${textFaint}`}>({driver.name_acronym})</span>

          )}

        </h3>

        <p className={`truncate text-sm ${cardTextMuted}`}>

          {driver?.team_name || 'Team onbekend'}

        </p>

        <div className="mt-1 flex items-center justify-between gap-2">

          <span className={`text-xs uppercase tracking-wide ${textFaint}`}>

            {resolveDriverCountryLabel(driver)}

          </span>

          <span className="text-sm font-bold text-red-400">{points} pt</span>

        </div>

      </div>

    </article>

  )

}

