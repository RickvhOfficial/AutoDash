// Karttijden in localStorage. Later uitbreidbaar naar POST/GET /api/laps op de Express-server.
const STORAGE_KEY = 'autodash_lap_times'
const LEGACY_KEY = 'lapTimes'

export const LAP_DATA_EVENT = 'autodash-lap-data-changed'

export const KART_TYPES = ['Benzine', 'Elektrisch', 'Gas (LPG)', '50km/u', '70km/u', 'Monsterkart', 'Overig']

const EMPTY_DATA = { tracks: [], laps: [] }

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function normalizeTrackName(name) {
  return String(name ?? '').trim().toLowerCase()
}

export function isValidLapTime(timeStr) {
  return /^\d{1,2}:\d{2}\.\d{3}$/.test(String(timeStr ?? '').trim())
}

/** Alleen cijfers → live mm:ss.mmm (max. 7 cijfers). */
export function formatLapTimeInput(input) {
  const digits = String(input ?? '').replace(/\D/g, '').slice(0, 7)
  if (!digits) return ''

  const n = digits.length
  if (n <= 2) return n === 2 ? `${digits[0]}:${digits[1]}` : digits
  if (n === 3) return `${digits[0]}:${digits.slice(1)}`
  if (n === 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`
  if (n === 5) return `${digits[0]}:${digits.slice(1, 3)}.${digits.slice(3)}`
  if (n === 6) return `${digits[0]}:${digits.slice(1, 3)}.${digits.slice(3)}`
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}.${digits.slice(4)}`
}

/** Bij blur: ontbrekende milliseconden aanvullen (.000 of padding). */
export function completeLapTimeInput(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return ''
  if (isValidLapTime(trimmed)) return trimmed

  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''

  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}.000`
  }

  if (digits.length >= 4) {
    const filled = formatLapTimeInput(digits.padEnd(7, '0'))
    return isValidLapTime(filled) ? filled : trimmed
  }

  return trimmed
}

export function lapTimeToMs(timeStr) {
  const [minSec, ms] = String(timeStr).trim().split('.')
  const [min, sec] = minSec.split(':')
  return parseInt(min, 10) * 60000 + parseInt(sec, 10) * 1000 + parseInt(ms, 10)
}

export function msToLapTime(ms) {
  const totalMs = Math.max(0, Math.round(ms))
  const minutes = Math.floor(totalMs / 60000)
  const seconds = Math.floor((totalMs % 60000) / 1000)
  const millis = totalMs % 1000
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

function parseStored(raw) {
  if (!raw) return { ...EMPTY_DATA }
  const parsed = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object') return { ...EMPTY_DATA }
  return {
    tracks: Array.isArray(parsed.tracks) ? parsed.tracks : [],
    laps: Array.isArray(parsed.laps) ? parsed.laps : [],
  }
}

function migrateLegacyLapTimes() {
  const raw = localStorage.getItem(LEGACY_KEY)
  if (!raw) return null
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return null

  const tracks = []
  const laps = []
  const trackMap = new Map()

  for (const item of parsed) {
    let trackName = 'Onbekend circuit'
    let timeStr = null
    let timeMs = null
    let date = new Date().toISOString().slice(0, 10)
    let kartType = 'Rental'
    let note = ''

    if (typeof item === 'number') {
      timeMs = item < 600000 ? Math.round(item * 1000) : Math.round(item)
    } else if (item && typeof item === 'object') {
      trackName = String(item.circuit || item.track || item.trackName || trackName).trim()
      if (item.time && isValidLapTime(item.time)) {
        timeStr = item.time.trim()
        timeMs = lapTimeToMs(timeStr)
      } else {
        const n = Number(item.lapTime ?? item.time ?? item.timeMs ?? item.duration)
        if (Number.isFinite(n)) {
          timeMs = n < 600 && n >= 0 ? Math.round(n * 1000) : Math.round(n)
        }
      }
      if (item.date && typeof item.date === 'string') date = item.date.split('T')[0]
      if (KART_TYPES.includes(item.kartType)) kartType = item.kartType
      note = String(item.note ?? '').trim()
    }

    if (!Number.isFinite(timeMs) || timeMs <= 0) continue
    if (!timeStr) timeStr = msToLapTime(timeMs)

    const norm = normalizeTrackName(trackName)
    let trackId = trackMap.get(norm)
    if (!trackId) {
      trackId = newId('t')
      tracks.push({ id: trackId, name: trackName || 'Onbekend circuit' })
      trackMap.set(norm, trackId)
    }

    laps.push({
      id: newId('l'),
      trackId,
      date,
      time: timeStr,
      timeMs,
      kartType,
      note,
      createdAt: item?.createdAt ?? Date.now(),
    })
  }

  if (!laps.length) return null
  return { tracks, laps }
}

function persistLapData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LAP_DATA_EVENT, { detail: data }))
  }
}

export function getLapData() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const migrated = migrateLegacyLapTimes()
      if (migrated) {
        persistLapData(migrated)
        localStorage.removeItem(LEGACY_KEY)
        return migrated
      }
      return { ...EMPTY_DATA }
    }
    return parseStored(raw)
  } catch {
    return { ...EMPTY_DATA }
  }
}

export function findTrackByName(data, trackName) {
  const norm = normalizeTrackName(trackName)
  if (!norm) return null
  return data.tracks.find((t) => normalizeTrackName(t.name) === norm) ?? null
}

export function getTrackById(data, trackId) {
  return data.tracks.find((t) => t.id === trackId) ?? null
}

export function trackNameExists(data, trackName) {
  return Boolean(findTrackByName(data, trackName))
}

/** True als deze tijd een nieuw persoonlijk record wordt op de opgegeven baan. */
export function wouldBeTrackPersonalBest(data, trackName, timeStr) {
  return Boolean(getTrackPrCelebrationInfo(data, trackName, timeStr))
}

/** Info voor PR-viering vóór opslaan (vorige PR + verbetering in ms). */
export function getTrackPrCelebrationInfo(data, trackName, timeStr) {
  const trimmed = String(trackName ?? '').trim()
  if (!trimmed || !isValidLapTime(timeStr)) return null
  const newMs = lapTimeToMs(timeStr)
  const track = findTrackByName(data, trimmed)
  const trackLaps = track ? data.laps.filter((lap) => lap.trackId === track.id) : []
  if (!trackLaps.length) {
    return {
      isFirstOnTrack: true,
      previousBestTime: null,
      improvementMs: null,
      improvementFormatted: null,
    }
  }
  const previousBestMs = Math.min(...trackLaps.map((lap) => lap.timeMs))
  if (newMs >= previousBestMs) return null
  const improvementMs = previousBestMs - newMs
  return {
    isFirstOnTrack: false,
    previousBestTime: msToLapTime(previousBestMs),
    improvementMs,
    improvementFormatted: msToLapTime(improvementMs),
  }
}

function createTrack(data, trackName) {
  const trimmed = String(trackName ?? '').trim()
  if (!trimmed) {
    throw new Error('Vul een baannaam in.')
  }
  const existing = findTrackByName(data, trimmed)
  if (existing) {
    throw new Error('Deze baan bestaat al — kies hem uit de lijst.')
  }
  const track = { id: newId('t'), name: trimmed }
  data.tracks.push(track)
  return track
}

export function saveLapTime({ trackName, date, time, kartType, note = '' }) {
  const trimmedName = String(trackName ?? '').trim()
  const trimmedTime = String(time ?? '').trim()
  const trimmedDate = String(date ?? '').trim()

  if (!trimmedName) throw new Error('Vul een baannaam in.')
  if (!trimmedDate) throw new Error('Kies een datum.')
  if (!isValidLapTime(trimmedTime)) {
    throw new Error('Ongeldige tijd. Gebruik formaat mm:ss.mmm (bijv. 01:23.456).')
  }
  if (!KART_TYPES.includes(kartType)) throw new Error('Kies een karttype.')

  const data = getLapData()
  let track = findTrackByName(data, trimmedName)
  if (!track) {
    track = createTrack(data, trimmedName)
  }

  const newLap = {
    id: newId('l'),
    trackId: track.id,
    date: trimmedDate,
    time: trimmedTime,
    timeMs: lapTimeToMs(trimmedTime),
    kartType,
    note: String(note ?? '').trim(),
    createdAt: Date.now(),
  }

  data.laps.push(newLap)
  try {
    persistLapData(data)
  } catch {
    throw new Error('Opslaan mislukt. Controleer of localStorage beschikbaar is.')
  }
  return { lap: newLap, track, data }
}

export function deleteLapTime(lapId) {
  const data = getLapData()
  const before = data.laps.length
  data.laps = data.laps.filter((lap) => lap.id !== lapId)
  if (data.laps.length === before) return data
  try {
    persistLapData(data)
  } catch {
    throw new Error('Verwijderen mislukt. Controleer of localStorage beschikbaar is.')
  }
  return data
}

export function enrichLaps(data, trackIdFilter = null) {
  return data.laps
    .filter((lap) => !trackIdFilter || lap.trackId === trackIdFilter)
    .map((lap) => {
      const track = getTrackById(data, lap.trackId)
      return {
        ...lap,
        trackName: track?.name ?? 'Onbekende baan',
      }
    })
}

export function sortLaps(laps, sortMode) {
  const copy = [...laps]
  if (sortMode === 'best') {
    return copy.sort((a, b) => a.timeMs - b.timeMs || b.createdAt - a.createdAt)
  }
  return copy.sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date)
    if (dateCmp !== 0) return dateCmp
    return b.createdAt - a.createdAt
  })
}

export function getBestTimeMs(laps) {
  if (!laps.length) return null
  return Math.min(...laps.map((l) => l.timeMs))
}

/** PR op de baan van deze ronde — o.a. voor verwijder-bevestiging (niet voor tabel bij “alle banen”). */
export function isLapTrackPersonalBest(data, lapId) {
  const lap = data.laps.find((l) => l.id === lapId)
  if (!lap) return false
  const trackLaps = data.laps.filter((l) => l.trackId === lap.trackId)
  if (!trackLaps.length) return false
  const bestMs = Math.min(...trackLaps.map((l) => l.timeMs))
  return lap.timeMs === bestMs
}

export function getMostDrivenTrackId(data) {
  const laps = enrichLaps(data, null)
  if (!laps.length) return null

  const counts = new Map()
  for (const lap of laps) {
    counts.set(lap.trackId, (counts.get(lap.trackId) ?? 0) + 1)
  }
  let max = 0
  let maxId = null
  for (const [id, count] of counts) {
    if (count > max) {
      max = count
      maxId = id
    }
  }
  return maxId
}

/** Laatste PR-sprong: vorige snelste tijd → nieuwe snelste tijd (chronologisch). */
export function computeLastPrImprovement(laps) {
  if (!laps?.length || laps.length < 2) return null

  const byDate = [...laps].sort((a, b) => {
    const d = a.date.localeCompare(b.date)
    return d !== 0 ? d : a.createdAt - b.createdAt
  })

  let bestMs = byDate[0].timeMs
  let lastPrGain = null

  for (let i = 1; i < byDate.length; i++) {
    const lap = byDate[i]
    if (lap.timeMs < bestMs) {
      const previousBestMs = bestMs
      const deltaMs = lap.timeMs - previousBestMs
      lastPrGain = {
        deltaMs,
        formatted: formatImprovement(deltaMs),
        improved: deltaMs < 0,
        previousBestTime: msToLapTime(previousBestMs),
        newBestTime: msToLapTime(lap.timeMs),
      }
      bestMs = lap.timeMs
    }
  }

  return lastPrGain?.improved ? lastPrGain : null
}

export function computeLapStats(data, trackIdFilter = null) {
  const laps = enrichLaps(data, trackIdFilter)
  if (!laps.length) {
    return {
      bestTime: null,
      averageTime: null,
      improvement: null,
      mostDrivenTrack: null,
      lapCount: 0,
      trackCount: data.tracks.length,
    }
  }

  const bestMs = Math.min(...laps.map((l) => l.timeMs))
  const avgMs = laps.reduce((sum, l) => sum + l.timeMs, 0) / laps.length
  const improvement = computeLastPrImprovement(laps)

  let mostDrivenTrack = null
  if (!trackIdFilter) {
    const counts = new Map()
    for (const lap of laps) {
      counts.set(lap.trackId, (counts.get(lap.trackId) ?? 0) + 1)
    }
    let max = 0
    let maxId = null
    for (const [id, count] of counts) {
      if (count > max) {
        max = count
        maxId = id
      }
    }
    if (maxId) {
      const track = getTrackById(data, maxId)
      mostDrivenTrack = track ? { id: maxId, name: track.name, count: max } : null
    }
  }

  return {
    bestTime: msToLapTime(bestMs),
    averageTime: msToLapTime(avgMs),
    improvement,
    mostDrivenTrack,
    lapCount: laps.length,
    trackCount: data.tracks.length,
  }
}

/** Stats voor UI-filter: bij geen track-filter scope op meest gereden baan. */
export function computeLapStatsForFilter(data, selectedTrackId = null) {
  if (selectedTrackId) {
    const scoped = computeLapStats(data, selectedTrackId)
    const track = getTrackById(data, selectedTrackId)
    return {
      ...scoped,
      scopedTrackName: track?.name ?? null,
      scopeAllTracks: false,
    }
  }

  const global = computeLapStats(data, null)
  const mostId = global.mostDrivenTrack?.id ?? getMostDrivenTrackId(data)
  if (!mostId) {
    return {
      ...global,
      scopedTrackName: null,
      scopeAllTracks: true,
    }
  }

  const scoped = computeLapStats(data, mostId)
  return {
    ...scoped,
    mostDrivenTrack: global.mostDrivenTrack,
    lapCount: scoped.lapCount,
    trackCount: global.trackCount,
    scopedTrackName: global.mostDrivenTrack?.name ?? null,
    scopeAllTracks: true,
  }
}

export function formatImprovement(deltaMs) {
  const sign = deltaMs < 0 ? '−' : deltaMs > 0 ? '+' : ''
  const abs = Math.abs(Math.round(deltaMs))
  return `${sign}${msToLapTime(abs)}`
}

export function getHomeLapSummary(data = getLapData()) {
  const laps = enrichLaps(data)
  if (!laps.length) return null

  const sortedByTime = sortLaps(laps, 'best')
  const latestLap = sortLaps(laps, 'date')[0]

  const topFive = sortedByTime.slice(0, 5).map((lap) => ({
    time: lap.time,
    trackName: lap.trackName,
  }))

  return {
    total: laps.length,
    trackCount: data.tracks.length,
    topFive,
    latest: { time: latestLap.time, trackName: latestLap.trackName },
  }
}
