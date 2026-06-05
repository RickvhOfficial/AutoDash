// Fallback F1-data via Jolpica/Ergast wanneer OpenF1 geblokkeerd is (401 tijdens live sessies).
const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1'

const CIRCUIT_ID_TO_SHORT = {
  albert_park: 'Melbourne',
  shanghai: 'Shanghai',
  suzuka: 'Suzuka',
  miami: 'Miami',
  villeneuve: 'Montreal',
  monaco: 'Monte Carlo',
  catalunya: 'Catalunya',
  madring: 'Madring',
  red_bull_ring: 'Spielberg',
  silverstone: 'Silverstone',
  spa: 'Spa-Francorchamps',
  hungaroring: 'Hungaroring',
  zandvoort: 'Zandvoort',
  monza: 'Monza',
  baku: 'Baku',
  marina_bay: 'Singapore',
  americas: 'Austin',
  rodriguez: 'Mexico City',
  interlagos: 'Interlagos',
  vegas: 'Las Vegas',
  losail: 'Lusail',
  yas_marina: 'Yas Marina Circuit',
  jeddah: 'Jeddah',
  bahrain: 'Sakhir',
  imola: 'Imola',
}

async function fetchErgastJson(path, timeoutMs = 8000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${JOLPICA_BASE}/${path}`, { signal: controller.signal })
    if (!res.ok) throw new Error(`Ergast request failed (${res.status}) for ${path}`)
    return await res.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

function ergastRaceStartIso(race) {
  if (!race?.date) return null
  const time = race.time || '12:00:00Z'
  return `${race.date}T${time}`
}

function ergastRaceEndIso(race) {
  const startIso = ergastRaceStartIso(race)
  if (!startIso) return null
  const end = new Date(startIso)
  if (Number.isNaN(end.getTime())) return startIso
  end.setUTCDate(end.getUTCDate() + 2)
  return end.toISOString()
}

function toRaceStatus(dateStart, dateEnd, now) {
  const start = new Date(dateStart)
  const end = new Date(dateEnd || dateStart)
  if (Number.isNaN(start.getTime())) return 'Aankomend'
  if (now > end) return 'Voorbij'
  const weekendWindowStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000)
  if (now >= weekendWindowStart && now <= end) return 'Dit weekend'
  return 'Aankomend'
}

function mapErgastRaceToSession(race, now) {
  const dateStart = ergastRaceStartIso(race)
  const dateEnd = ergastRaceEndIso(race)
  const circuitId = race?.Circuit?.circuitId || ''
  const circuitShort = CIRCUIT_ID_TO_SHORT[circuitId] || race?.Circuit?.circuitName || 'Circuit onbekend'
  return {
    sessionKey: Number(race.round) || null,
    meetingName: race.raceName || 'Grand Prix',
    circuitName: race?.Circuit?.circuitName || circuitShort,
    circuit_short_name: circuitShort,
    countryName: race?.Circuit?.Location?.country || 'Land onbekend',
    countryCode: null,
    countryFlag: '',
    dateStart,
    dateEnd,
    date_start: dateStart,
    date_end: dateEnd,
    location: race?.Circuit?.Location?.locality || '',
    latitude: Number(race?.Circuit?.Location?.lat),
    longitude: Number(race?.Circuit?.Location?.long),
    status: toRaceStatus(dateStart, dateEnd, now),
  }
}

async function fetchRacesForYear(year) {
  const payload = await fetchErgastJson(`${year}/races.json?limit=30`)
  return payload?.MRData?.RaceTable?.Races || []
}

async function fetchStandingsForYear(year) {
  const payload = await fetchErgastJson(`${year}/driverStandings.json`)
  const list = payload?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings
  return Array.isArray(list) ? list : []
}

async function pickSeasonYear(now) {
  const currentYear = now.getFullYear()
  const currentRaces = await fetchRacesForYear(currentYear)
  const hasUpcoming = currentRaces.some((race) => {
    const end = new Date(ergastRaceEndIso(race) || ergastRaceStartIso(race) || 0)
    return !Number.isNaN(end.getTime()) && end >= now
  })
  if (hasUpcoming || currentRaces.length === 0) return currentYear
  const nextRaces = await fetchRacesForYear(currentYear + 1)
  return nextRaces.length > 0 ? currentYear + 1 : currentYear
}

export async function buildRaceCalendarFromErgast(now = new Date()) {
  const seasonYear = await pickSeasonYear(now)
  const races = await fetchRacesForYear(seasonYear)
  const mappedRaces = races.map((race) => mapErgastRaceToSession(race, now))
  return {
    races: mappedRaces,
    seasonYear,
    cached: false,
    source: 'ergast-fallback',
    updatedAt: Date.now(),
  }
}

export async function buildOpenF1SnapshotFromErgast(enrichDriverNationality, now = new Date()) {
  const nowTs = Date.now()
  const seasonYear = await pickSeasonYear(now)
  const races = await fetchRacesForYear(seasonYear)
  const standings = await fetchStandingsForYear(seasonYear)

  const upcomingRaceRaw =
    races
      .filter((race) => {
        const end = new Date(ergastRaceEndIso(race) || ergastRaceStartIso(race) || 0)
        return !Number.isNaN(end.getTime()) && end >= now
      })
      .sort((a, b) => new Date(ergastRaceStartIso(a)) - new Date(ergastRaceStartIso(b)))[0] || null

  const mappedSession = upcomingRaceRaw ? mapErgastRaceToSession(upcomingRaceRaw, now) : null
  const nextRace = mappedSession
    ? {
        meeting_name: mappedSession.meetingName,
        meeting_key: mappedSession.sessionKey,
        date_start: mappedSession.dateStart,
        date_end: mappedSession.dateEnd,
        country_name: mappedSession.countryName,
        countryName: mappedSession.countryName,
        country_code: null,
        country_flag: '',
        countryFlag: '',
        circuit_short_name: mappedSession.circuit_short_name,
        circuitName: mappedSession.circuitName,
        location: mappedSession.location,
        latitude: mappedSession.latitude,
        longitude: mappedSession.longitude,
        year: seasonYear,
      }
    : null

  const seasonStats = standings.map((row) => {
    const driver = row.Driver || {}
    const fullName = `${driver.givenName || ''} ${driver.familyName || ''}`.trim() || 'Onbekend'
    return enrichDriverNationality({
      position: Number(row.position) || null,
      driver_number: driver.permanentNumber || null,
      name: fullName,
      full_name: fullName,
      name_acronym: driver.code || null,
      team_name: row.Constructors?.[0]?.name || null,
      points: Number(row.points) || 0,
    })
  })

  const drivers = [...seasonStats]
    .sort((a, b) => Number(a.driver_number) - Number(b.driver_number))
    .map((entry) =>
      enrichDriverNationality({
        name: entry.name,
        number: entry.driver_number ?? '-',
        name_acronym: entry.name_acronym,
      })
    )

  return {
    nextRace,
    drivers,
    seasonStats,
    seasonStatsYear: seasonYear,
    source: 'ergast-fallback',
    timestamps: {
      nextRaceUpdatedAt: nowTs,
      driversUpdatedAt: nowTs,
      seasonStatsUpdatedAt: nowTs,
    },
  }
}
