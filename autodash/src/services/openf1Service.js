// OpenF1 mappers/fetchers voor volgende race, drivers en season standings.
import { requestJsonWithRetry } from './httpClient'

// OpenF1 levert country_code=null voor alle rijders; bevestigd via session 11253 (Suzuka 2026).
const DRIVER_NATIONALITIES = {
  1: 'nl',
  3: 'nl',
  4: 'gb',
  5: 'br',
  6: 'fr',
  10: 'fr',
  11: 'mx',
  12: 'it',
  14: 'es',
  16: 'mc',
  18: 'ca',
  23: 'th',
  27: 'de',
  30: 'nz',
  31: 'fr',
  41: 'gb',
  43: 'ar',
  44: 'gb',
  55: 'es',
  63: 'gb',
  77: 'fi',
  81: 'au',
  87: 'gb',
}

export function driverFlag(driverNumber) {
  const code = DRIVER_NATIONALITIES[driverNumber]
  return code ? `https://flagcdn.com/w40/${code}.png` : ''
}

// Haalt context op (meetings/sessions) en bepaalt volgende race + laatste racesessie.
export async function fetchOpenF1RaceContext({ openF1Client, year, now, signal }) {
  let hadApiFailure = false
  let currentYearMeetings = []
  let currentYearRaceSessions = []

  try {
    currentYearMeetings = await requestJsonWithRetry(openF1Client, `/meetings?year=${year}`, signal)
  } catch {
    hadApiFailure = true
  }

  try {
    currentYearRaceSessions = await requestJsonWithRetry(
      openF1Client,
      `/sessions?session_name=Race&year=${year}`,
      signal
    )
  } catch {
    hadApiFailure = true
  }

  const allMeetings = [...currentYearMeetings]
  let nextYearMeetings = []
  if (currentYearMeetings.length > 0) {
    const hasUpcomingCurrentYearRace = currentYearMeetings.some(
      (m) =>
        !m.is_cancelled &&
        m.meeting_name.toLowerCase().includes('grand prix') &&
        new Date(m.date_start) > now
    )
    if (!hasUpcomingCurrentYearRace) {
      try {
        nextYearMeetings = await requestJsonWithRetry(
          openF1Client,
          `/meetings?year=${year + 1}`,
          signal
        )
      } catch {
        hadApiFailure = true
      }
    }
  }

  allMeetings.push(...nextYearMeetings)

  if (currentYearMeetings.length === 0 && nextYearMeetings.length === 0) {
    hadApiFailure = true
  }
  if (currentYearRaceSessions.length === 0) {
    hadApiFailure = true
  }

  const latestCurrentYearRaceSession = currentYearRaceSessions
    .filter((s) => s.date_end && new Date(s.date_end) <= now && !s.is_cancelled)
    .sort((a, b) => new Date(b.date_end) - new Date(a.date_end))[0]

  const latestCompletedRaceSessionKey = latestCurrentYearRaceSession?.session_key || null
  const upcomingRace =
    allMeetings
      .filter(
        (m) =>
          !m.is_cancelled &&
          m.meeting_name.toLowerCase().includes('grand prix') &&
          new Date(m.date_start) > now
      )
      .sort((a, b) => new Date(a.date_start) - new Date(b.date_start))[0] || null

  return { upcomingRace, latestCompletedRaceSessionKey, hadApiFailure }
}

// Normaliseert OpenF1 raceobject naar frontend-vriendelijke velden.
export function mapUpcomingRace(upcomingRace) {
  if (!upcomingRace) return null
  return {
    ...upcomingRace,
    countryName: upcomingRace.country_name || 'Land onbekend',
    countryFlag: upcomingRace.country_flag || '',
    circuitName: upcomingRace.circuit_short_name || upcomingRace.location || 'Circuit onbekend',
    circuitImage: upcomingRace.circuit_image || null,
  }
}

// Haalt drivers + standings op van laatste afgeronde racesessie.
export async function fetchDriversAndStandings({
  openF1Client,
  latestCompletedRaceSessionKey,
  signal,
}) {
  if (!latestCompletedRaceSessionKey) {
    return {
      drivers: null,
      standings: null,
      hadApiFailure: false,
      noCompletedRace: true,
    }
  }

  let hadApiFailure = false
  let driversData = null
  let standingsData = null

  try {
    driversData = await requestJsonWithRetry(
      openF1Client,
      `/drivers?session_key=${latestCompletedRaceSessionKey}`,
      signal
    )
  } catch {
    hadApiFailure = true
  }

  try {
    standingsData = await requestJsonWithRetry(
      openF1Client,
      `/championship_drivers?session_key=${latestCompletedRaceSessionKey}`,
      signal
    )
  } catch {
    hadApiFailure = true
  }

  return {
    drivers: driversData,
    standings: standingsData,
    hadApiFailure,
    noCompletedRace: false,
  }
}

// Zet ruwe OpenF1 drivers om naar lijstweergave.
export function mapDrivers(driversData) {
  if (!Array.isArray(driversData)) return []
  return driversData
    .map((d) => ({
      name: `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || d.broadcast_name || 'Onbekend',
      number: d.driver_number ?? '-',
      flag: driverFlag(d.driver_number),
    }))
    .sort((a, b) => Number(a.number) - Number(b.number))
}

// Combineert standings en driverdata tot complete ranglijstitems.
export function mapStandings(standingsData, driversData) {
  if (!Array.isArray(standingsData) || !Array.isArray(driversData)) return []
  const driverByNumber = new Map(driversData.map((d) => [d.driver_number, d]))
  const standingsRows = standingsData.filter((row) => row?.driver_number != null)
  const seenNumbers = new Set(standingsRows.map((r) => r.driver_number))
  const rows = standingsRows.map((row) => {
    const driver = driverByNumber.get(row.driver_number)
    return {
      position: row.position_current ?? row.position_start ?? null,
      driver_number: row.driver_number,
      name: driver
        ? `${driver.first_name ?? ''} ${driver.last_name ?? ''}`.trim() || driver.broadcast_name
        : `#${row.driver_number}`,
      points: row.points_current ?? row.points_start ?? 0,
      flag: driverFlag(row.driver_number),
    }
  })
  for (const d of driversData) {
    if (d?.driver_number == null || seenNumbers.has(d.driver_number)) continue
    seenNumbers.add(d.driver_number)
    rows.push({
      position: null,
      driver_number: d.driver_number,
      name:
        `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || d.broadcast_name || 'Onbekend',
      points: 0,
      flag: driverFlag(d.driver_number),
    })
  }
  rows.sort((a, b) => {
    if (a.position != null && b.position != null) return Number(a.position) - Number(b.position)
    if (a.position != null) return -1
    if (b.position != null) return 1
    return Number(a.driver_number) - Number(b.driver_number)
  })
  return rows
}
