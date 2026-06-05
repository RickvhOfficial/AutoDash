import { normalizeCircuitKey, resolveCircuitCoords } from '../data/circuits'

export function parseDateOnly(isoDateString) {
  if (!isoDateString || typeof isoDateString !== 'string') return null
  const datePart = isoDateString.split('T')[0]
  if (!datePart) return null
  return new Date(`${datePart}T00:00:00Z`)
}

/** Normaliseert kalender- en dashboard-race naar één vorm. */
export function normalizeRaceSession(race) {
  if (!race) return null
  return {
    sessionKey: race.sessionKey ?? race.meeting_key ?? null,
    meetingName: race.meetingName ?? race.meeting_name ?? 'Race onbekend',
    circuitName: race.circuitName ?? race.circuit_short_name ?? 'Circuit onbekend',
    circuit_short_name: race.circuit_short_name ?? race.circuitName ?? null,
    countryName: race.countryName ?? race.country_name ?? null,
    dateStart: race.dateStart ?? race.date_start ?? null,
    dateEnd: race.dateEnd ?? race.date_end ?? null,
    status: race.status ?? null,
    location: race.location ?? null,
  }
}

export function getRaceStartTime(session) {
  const start = parseDateOnly(session?.dateStart || session?.date_start)
  if (!start || Number.isNaN(start.getTime())) return Number.POSITIVE_INFINITY
  return start.getTime()
}

export function getRaceEndTime(session) {
  const end = parseDateOnly(
    session?.dateEnd || session?.date_end || session?.dateStart || session?.date_start
  )
  if (!end || Number.isNaN(end.getTime())) return Number.NEGATIVE_INFINITY
  return end.getTime()
}

export function getTodayStartUtc() {
  const now = new Date()
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).getTime()
}

export function formatDateRange(dateStart, dateEnd) {
  const start = parseDateOnly(dateStart)
  const end = parseDateOnly(dateEnd || dateStart)
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Datum onbekend'
  }
  const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' }
  return `${start.toLocaleDateString('nl-NL', dateOptions)} t/m ${end.toLocaleDateString('nl-NL', dateOptions)}`
}

export function getRaceKey(session) {
  const race = normalizeRaceSession(session)
  return `${race?.sessionKey ?? race?.meetingName}-${race?.dateStart ?? ''}`
}

export function isRaceStillRelevant(race, todayStart = getTodayStartUtc()) {
  const normalized = normalizeRaceSession(race)
  if (!normalized) return false
  if (normalized.status === 'Dit weekend') return true
  const end = getRaceEndTime(normalized)
  if (Number.isFinite(end) && end >= todayStart) return true
  return getRaceStartTime(normalized) >= todayStart
}

export function getDisplayStatus(session, nextRaceKey) {
  const race = normalizeRaceSession(session)
  if (!race) return 'Aankomend'
  if (race.status === 'Dit weekend') return 'Dit weekend'
  if (race.status === 'Aankomend' && getRaceKey(race) === nextRaceKey) return 'Eerst Volgende'
  return race.status || 'Aankomend'
}

export function circuitIdFromRace(race) {
  const normalized = normalizeRaceSession(race)
  if (!normalized) return ''
  const candidates = [
    normalized.circuitName,
    normalized.circuit_short_name,
    normalized.location,
    normalized.meetingName,
  ]
  for (const name of candidates) {
    if (!name) continue
    const coords = resolveCircuitCoords(name, normalized.meetingName, normalized.countryName)
    if (!coords) continue
    return normalizeCircuitKey(name)
  }
  return ''
}

/** Eerstvolgende (of huidige) race uit kalender. */
export function pickNextRace(races) {
  if (!Array.isArray(races) || races.length === 0) return null
  const todayStart = getTodayStartUtc()
  const next =
    races
      .filter((race) => isRaceStillRelevant(race, todayStart))
      .sort((a, b) => getRaceStartTime(a) - getRaceStartTime(b))[0] || null
  return next ? normalizeRaceSession(next) : null
}

/** Dashboard-snapshot eerst, anders kalender — zelfde keuze overal. */
export function pickNextRaceFromSources({ races = [], dashboardNextRace = null } = {}) {
  if (dashboardNextRace && isRaceStillRelevant(dashboardNextRace)) {
    return normalizeRaceSession(dashboardNextRace)
  }
  return pickNextRace(races)
}

export function pickNextRaceCircuitId(races, dashboardNextRace = null) {
  const next = pickNextRaceFromSources({ races, dashboardNextRace })
  if (next) {
    const id = circuitIdFromRace(next)
    if (id) return id
  }

  if (!Array.isArray(races) || races.length === 0) return ''
  const todayStart = getTodayStartUtc()
  const relevant = races
    .filter((race) => isRaceStillRelevant(race, todayStart))
    .sort((a, b) => getRaceStartTime(a) - getRaceStartTime(b))

  for (const race of relevant) {
    const id = circuitIdFromRace(race)
    if (id) return id
  }
  return ''
}

/** Default circuit voor weerpagina op basis van kalender + optioneel dashboard-race. */
export function resolveDefaultCircuitIdFromOptions(races, options, dashboardNextRace = null) {
  const preferredId = pickNextRaceCircuitId(races, dashboardNextRace)
  if (preferredId && options.some((circuit) => circuit.id === preferredId)) {
    return preferredId
  }

  const upcomingOptions = options
    .filter((circuit) => circuit.dateStart)
    .sort(
      (a, b) =>
        getRaceStartTime({ dateStart: a.dateStart }) - getRaceStartTime({ dateStart: b.dateStart })
    )

  return upcomingOptions[0]?.id || options[0]?.id || ''
}
