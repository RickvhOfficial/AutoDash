// AutoDash backend: levert dashboard snapshot, racekalender en hourly Unsplash-fotos.
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { resolveVinDecode, resolveVehicleSearch, resolveMakeEnrichment, applyEnrichment } from '../src/services/vehicleService.js'
import { preloadCatalogBrands } from '../src/services/euCarCatalog.js'
import {
  driverFlagUrl,
  enrichDriverNationality,
  resolveDriverCountryCode,
} from '../src/data/driverNationalities.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PERSIST_FILE = join(__dirname, 'cache.json')

const app = express()
const PORT = Number(process.env.PORT || 8787)

const UNSPLASH_API_URL = process.env.UNSPLASH_API_URL || 'https://api.unsplash.com'
const UNSPLASH_ACCESS_KEY =
  process.env.UNSPLASH_ACCESS_KEY || process.env.VITE_UNSPLASH_ACCESS_KEY || ''
const UNSPLASH_UTM = 'utm_source=autodash&utm_medium=referral'
const OPENF1_BASE = process.env.OPENF1_URL || process.env.VITE_OPENF1_URL || 'https://api.openf1.org/v1'
const OPEN_METEO_URL =
  process.env.OPEN_METEO_URL ||
  process.env.VITE_OPEN_METEO_URL ||
  'https://api.open-meteo.com/v1/forecast'
const OPENF1_TTL_MS = 30 * 60 * 1000
const WEATHER_TTL_MS = 30 * 1000
const RACE_CALENDAR_TTL_MS = 15 * 60 * 1000
/** Circuit-weerpagina: server-side cache per lat/lon (Open-Meteo forecast). */
const CIRCUIT_WEATHER_TTL_MS = 15 * 60 * 1000

const CIRCUIT_COORDS = {
  Sakhir: { latitude: 26.0325, longitude: 50.5106 },
  Jeddah: { latitude: 21.6319, longitude: 39.1044 },
  Melbourne: { latitude: -37.8497, longitude: 144.968 },
  Suzuka: { latitude: 34.8431, longitude: 136.541 },
  Shanghai: { latitude: 31.3389, longitude: 121.2197 },
  Miami: { latitude: 25.9581, longitude: -80.2389 },
  Imola: { latitude: 44.3439, longitude: 11.7167 },
  'Monte Carlo': { latitude: 43.7347, longitude: 7.4206 },
  Catalunya: { latitude: 41.57, longitude: 2.2611 },
  Montreal: { latitude: 45.5006, longitude: -73.5228 },
  Spielberg: { latitude: 47.2197, longitude: 14.7647 },
  Silverstone: { latitude: 52.0786, longitude: -1.0169 },
  Hungaroring: { latitude: 47.5789, longitude: 19.2486 },
  'Spa-Francorchamps': { latitude: 50.4372, longitude: 5.9714 },
  Zandvoort: { latitude: 52.3888, longitude: 4.5409 },
  Monza: { latitude: 45.6156, longitude: 9.2811 },
  Baku: { latitude: 40.3725, longitude: 49.8533 },
  Singapore: { latitude: 1.2914, longitude: 103.8644 },
  Austin: { latitude: 30.1328, longitude: -97.6411 },
  'Mexico City': { latitude: 19.4042, longitude: -99.0907 },
  Interlagos: { latitude: -23.7036, longitude: -46.6997 },
  'Las Vegas': { latitude: 36.1147, longitude: -115.1728 },
  Lusail: { latitude: 25.49, longitude: 51.4542 },
  'Yas Marina Circuit': { latitude: 24.4672, longitude: 54.6031 },
  Madring: { latitude: 40.4534, longitude: -3.6883 },
}
const SERVER_FALLBACK_PHOTOS = [
  {
    url: '/placeholders/ph1.jpg',
    photographerName: 'F1 Unleashed',
    profileUrl: `https://unsplash.com/@f1unleashed?${UNSPLASH_UTM}`,
    unsplashUrl: `https://unsplash.com/photos/4oAq0VOYl9A?${UNSPLASH_UTM}`,
  },
  {
    url: '/placeholders/ph2.jpg',
    photographerName: 'Jack B',
    profileUrl: `https://unsplash.com/@nervum?${UNSPLASH_UTM}`,
    unsplashUrl: `https://unsplash.com/photos/EwUZ8hjWXSk?${UNSPLASH_UTM}`,
  },
  {
    url: '/placeholders/ph3.jpg',
    photographerName: 'Ank Kumar',
    profileUrl: `https://unsplash.com/@ankkumar?${UNSPLASH_UTM}`,
    unsplashUrl: `https://unsplash.com/photos/tGghQBM-RVo?${UNSPLASH_UTM}`,
  },
  {
    url: '/placeholders/ph4.jpg',
    photographerName: 'F1 Unleashed',
    profileUrl: `https://unsplash.com/@f1unleashed?${UNSPLASH_UTM}`,
    unsplashUrl: `https://unsplash.com/photos/J0PLcahCOVk?${UNSPLASH_UTM}`,
  },
  {
    url: '/placeholders/ph5.jpg',
    photographerName: 'Mr. AN',
    profileUrl: `https://unsplash.com/@mran123?${UNSPLASH_UTM}`,
    unsplashUrl: `https://unsplash.com/photos/IFFPJpbF4CM?${UNSPLASH_UTM}`,
  },
]

let cache = {
  hourBucket: null,
  photos: null,
}
let inFlightPromise = null
let dashboardCache = {
  openf1: { updatedAt: 0, data: null },
  weather: { updatedAt: 0, key: null, data: null },
  raceCalendar: { updatedAt: 0, seasonYear: null, data: null },
}
try {
  if (existsSync(PERSIST_FILE)) {
    const saved = JSON.parse(readFileSync(PERSIST_FILE, 'utf-8'))
    if (saved?.openf1) dashboardCache.openf1 = saved.openf1
    if (saved?.weather) dashboardCache.weather = saved.weather
    if (saved?.raceCalendar) dashboardCache.raceCalendar = saved.raceCalendar
  }
} catch {
  // corrupt or missing file — start with empty cache
}
let dashboardInFlightPromise = null

/** @type {Map<string, { updatedAt: number, data: unknown }>} */
const circuitWeatherCache = new Map()

function hasEnrichedSeasonStats(openf1Data) {
  const seasonStats = openf1Data?.seasonStats
  if (!Array.isArray(seasonStats) || seasonStats.length === 0) return true
  return seasonStats.some(
    (row) =>
      Object.prototype.hasOwnProperty.call(row, 'team_name') ||
      Object.prototype.hasOwnProperty.call(row, 'headshot_url') ||
      Object.prototype.hasOwnProperty.call(row, 'country_code') ||
      Object.prototype.hasOwnProperty.call(row, 'name_acronym')
  )
}

// UTC hour-bucket zodat alle clients in hetzelfde uur dezelfde fotos krijgen.
function getCurrentHourBucketUtc() {
  return Math.floor(Date.now() / (60 * 60 * 1000))
}

// Normaliseert ruwe Unsplash-response naar frontend-vorm.
function mapUnsplashPhoto(photo) {
  return {
    url: photo?.urls?.regular || '',
    photographerName: photo?.user?.name || 'Onbekend',
    profileUrl: `${photo?.user?.links?.html || 'https://unsplash.com'}?${UNSPLASH_UTM}`,
    unsplashUrl: `${photo?.links?.html || 'https://unsplash.com'}?${UNSPLASH_UTM}`,
  }
}

// Fetch helper met timeout + retry/backoff voor externe APIs.
async function requestJsonWithRetry(url, retries = 2, timeoutMs = 8000) {
  let lastError = null
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!res.ok) {
        const retryable = [429, 500, 502, 503, 504].includes(res.status)
        if (retryable && attempt < retries) {
          await new Promise((r) => setTimeout(r, 500 * (2 ** attempt)))
          continue
        }
        throw new Error(`Request failed (${res.status}) for ${url}`)
      }
      return await res.json()
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (2 ** attempt)))
      }
    }
  }
  throw lastError || new Error(`Request failed for ${url}`)
}

// Bouwt OpenF1 snapshot (next race, drivers, standings) met server-cache.
async function fetchOpenF1Snapshot() {
  const nowTs = Date.now()
  if (
    dashboardCache.openf1.data &&
    nowTs - dashboardCache.openf1.updatedAt < OPENF1_TTL_MS &&
    hasEnrichedSeasonStats(dashboardCache.openf1.data)
  ) {
    return dashboardCache.openf1.data
  }

  const now = new Date()
  const year = now.getFullYear()
  const meetings = await requestJsonWithRetry(`${OPENF1_BASE}/meetings?year=${year}`)
  const raceSessions = await requestJsonWithRetry(`${OPENF1_BASE}/sessions?session_name=Race&year=${year}`)
  let allMeetings = Array.isArray(meetings) ? meetings : []

  const hasUpcomingCurrentYearRace = allMeetings.some(
    (m) =>
      !m.is_cancelled &&
      String(m.meeting_name || '').toLowerCase().includes('grand prix') &&
      new Date(m.date_start) > now
  )
  if (!hasUpcomingCurrentYearRace) {
    try {
      const nextYearMeetings = await requestJsonWithRetry(`${OPENF1_BASE}/meetings?year=${year + 1}`)
      allMeetings = allMeetings.concat(Array.isArray(nextYearMeetings) ? nextYearMeetings : [])
    } catch {
      // no-op
    }
  }

  const upcomingRace =
    allMeetings
      .filter(
        (m) =>
          !m.is_cancelled &&
          String(m.meeting_name || '').toLowerCase().includes('grand prix') &&
          new Date(m.date_start) > now
      )
      .sort((a, b) => new Date(a.date_start) - new Date(b.date_start))[0] || null

  const latestSession =
    (Array.isArray(raceSessions) ? raceSessions : [])
      .filter((s) => s.date_end && new Date(s.date_end) <= now && !s.is_cancelled)
      .sort((a, b) => new Date(b.date_end) - new Date(a.date_end))[0] || null

  const sessionKey = latestSession?.session_key || null
  let drivers = []
  let seasonStats = []
  if (sessionKey) {
    const driversData = await requestJsonWithRetry(`${OPENF1_BASE}/drivers?session_key=${sessionKey}`)
    const standingsData = await requestJsonWithRetry(
      `${OPENF1_BASE}/championship_drivers?session_key=${sessionKey}`
    )
    drivers = (Array.isArray(driversData) ? driversData : [])
      .map((d) =>
        enrichDriverNationality({
          name: `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || d.broadcast_name || 'Onbekend',
          number: d.driver_number ?? '-',
          name_acronym: d.name_acronym || null,
        })
      )
      .sort((a, b) => Number(a.number) - Number(b.number))

    const driverByNumber = new Map((Array.isArray(driversData) ? driversData : []).map((d) => [d.driver_number, d]))

    function mapChampionshipRow(row) {
      const driver = driverByNumber.get(row.driver_number)
      const fullName = driver
        ? `${driver.first_name ?? ''} ${driver.last_name ?? ''}`.trim() || driver.broadcast_name
        : `#${row.driver_number}`
      return enrichDriverNationality({
        position: row.position_current ?? row.position_start ?? null,
        driver_number: row.driver_number,
        name: fullName,
        full_name: fullName,
        name_acronym: driver?.name_acronym || null,
        team_name: driver?.team_name || null,
        team_colour: driver?.team_colour || null,
        headshot_url: driver?.headshot_url || null,
        points: row.points_current ?? row.points_start ?? 0,
      })
    }

    const standingsRows = (Array.isArray(standingsData) ? standingsData : []).filter(
      (row) => row?.driver_number != null
    )
    const seenNumbers = new Set(standingsRows.map((r) => r.driver_number))
    seasonStats = standingsRows.map(mapChampionshipRow)

    // Soms ontbreekt een coureur in championship_drivers (of beide posities zijn null); drivers-sessie is bron voor 22 startnummers.
    for (const d of Array.isArray(driversData) ? driversData : []) {
      if (d?.driver_number == null || seenNumbers.has(d.driver_number)) continue
      seenNumbers.add(d.driver_number)
      const fullName =
        `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || d.broadcast_name || 'Onbekend'
      seasonStats.push(
        enrichDriverNationality({
          position: null,
          driver_number: d.driver_number,
          name: fullName,
          full_name: fullName,
          name_acronym: d.name_acronym || null,
          team_name: d.team_name || null,
          team_colour: d.team_colour || null,
          headshot_url: d.headshot_url || null,
          points: 0,
        })
      )
    }

    seasonStats.sort((a, b) => {
      const ap = a.position
      const bp = b.position
      if (ap != null && bp != null) return Number(ap) - Number(bp)
      if (ap != null) return -1
      if (bp != null) return 1
      return Number(a.driver_number) - Number(b.driver_number)
    })
  }

  const nextRace = upcomingRace
    ? {
        ...upcomingRace,
        countryName: upcomingRace.country_name || 'Land onbekend',
        countryCode: upcomingRace.country_code || null,
        countryFlag: upcomingRace.country_flag || '',
        circuitName: upcomingRace.circuit_short_name || upcomingRace.location || 'Circuit onbekend',
        circuitImage: upcomingRace.circuit_image || null,
      }
    : null

  const snapshot = {
    nextRace,
    drivers,
    seasonStats,
    seasonStatsYear: year,
    timestamps: {
      nextRaceUpdatedAt: nowTs,
      driversUpdatedAt: nowTs,
      seasonStatsUpdatedAt: nowTs,
    },
  }
  dashboardCache.openf1 = { updatedAt: nowTs, data: snapshot }
  try {
    writeFileSync(PERSIST_FILE, JSON.stringify(dashboardCache), 'utf-8')
  } catch { /* disk write failure is non-fatal */ }
  console.log('[OpenF1] Snapshot fetched successfully — nextRace:', snapshot.nextRace?.meeting_name ?? 'none', '| drivers:', snapshot.drivers.length, '| seasonStats:', snapshot.seasonStats.length)
  return snapshot
}

function sortByDateStartAsc(a, b) {
  return new Date(a.date_start) - new Date(b.date_start)
}

// Normaliseert race-status op basis van start/einddatums.
function toRaceStatus(dateStart, dateEnd, now) {
  const start = new Date(dateStart)
  const end = new Date(dateEnd || dateStart)
  if (Number.isNaN(start.getTime())) return 'Aankomend'
  if (now > end) return 'Voorbij'
  const weekendWindowStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000)
  if (now >= weekendWindowStart && now <= end) return 'Dit weekend'
  return 'Aankomend'
}

// Mapt OpenF1 racesessie naar kalenderregel voor de frontend.
function mapRaceSession(session, meetingNameByKey, now) {
  const meetingMeta = meetingNameByKey.get(session.meeting_key) || null
  const meetingTitle = meetingMeta?.name || session.meeting_name
  return {
    sessionKey: session.session_key ?? null,
    meetingName: meetingTitle || session.session_name || 'Race onbekend',
    circuitName: session.circuit_short_name || session.location || 'Circuit onbekend',
    countryName: session.country_name || 'Land onbekend',
    countryCode: session.country_code || null,
    countryFlag: session.country_flag || '',
    dateStart: meetingMeta?.dateStart || session.date_start || null,
    dateEnd: meetingMeta?.dateEnd || session.date_end || session.date_start || null,
    status: toRaceStatus(
      meetingMeta?.dateStart || session.date_start,
      meetingMeta?.dateEnd || session.date_end || session.date_start,
      now
    ),
  }
}

async function fetchRaceSessionsForYear(year) {
  const sessions = await requestJsonWithRetry(`${OPENF1_BASE}/sessions?year=${year}&session_name=Race`)
  return Array.isArray(sessions) ? sessions.sort(sortByDateStartAsc) : []
}

async function fetchMeetingNameMapForYear(year) {
  try {
    const meetings = await requestJsonWithRetry(`${OPENF1_BASE}/meetings?year=${year}`)
    if (!Array.isArray(meetings)) return new Map()
    return new Map(
      meetings.map((meeting) => [
        meeting.meeting_key,
        {
          name: meeting.meeting_name || 'Race onbekend',
          dateStart: meeting.date_start || null,
          dateEnd: meeting.date_end || meeting.date_start || null,
        },
      ])
    )
  } catch {
    return new Map()
  }
}

// Bouwt racekalender per seizoen met cache en fallback naar volgend jaar.
async function fetchRaceCalendarSnapshot() {
  const nowTs = Date.now()
  const cachedCalendarData = Array.isArray(dashboardCache.raceCalendar.data)
    ? dashboardCache.raceCalendar.data
    : []
  const cacheLooksLegacy =
    cachedCalendarData.length > 0 &&
    cachedCalendarData.every((race) => race.meetingName === 'Race' || !race.dateEnd)
  if (
    cachedCalendarData.length > 0 &&
    !cacheLooksLegacy &&
    nowTs - dashboardCache.raceCalendar.updatedAt < RACE_CALENDAR_TTL_MS
  ) {
    return {
      races: cachedCalendarData,
      seasonYear: dashboardCache.raceCalendar.seasonYear,
      cached: true,
      updatedAt: dashboardCache.raceCalendar.updatedAt,
    }
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentYearSessions = await fetchRaceSessionsForYear(currentYear)

  const hasUpcomingCurrentYearRace = currentYearSessions.some(
    (session) => session.date_end && new Date(session.date_end) >= now && !session.is_cancelled
  )
  const shouldFallbackToNextYear =
    currentYearSessions.length === 0 || !hasUpcomingCurrentYearRace

  let selectedYear = currentYear
  let selectedSessions = currentYearSessions
  if (shouldFallbackToNextYear) {
    const nextYearSessions = await fetchRaceSessionsForYear(currentYear + 1)
    if (nextYearSessions.length > 0) {
      selectedYear = currentYear + 1
      selectedSessions = nextYearSessions
    }
  }

  const meetingNameByKey = await fetchMeetingNameMapForYear(selectedYear)

  const mappedRaces = selectedSessions
    .filter((session) => !session.is_cancelled)
    .map((session) => mapRaceSession(session, meetingNameByKey, now))

  dashboardCache.raceCalendar = {
    updatedAt: nowTs,
    seasonYear: selectedYear,
    data: mappedRaces,
  }
  try {
    writeFileSync(PERSIST_FILE, JSON.stringify(dashboardCache), 'utf-8')
  } catch {}

  return {
    races: mappedRaces,
    seasonYear: selectedYear,
    cached: false,
    updatedAt: nowTs,
  }
}

// Haalt actuele weerdata op voor de volgende race met coord-fallback.
async function fetchWeatherSnapshot(nextRace) {
  const nowTs = Date.now()
  if (!nextRace) return { weather: null, weatherUpdatedAt: 0 }
  const weatherKey = `${nextRace.circuitName}|${nextRace.location}`
  if (
    dashboardCache.weather.data &&
    dashboardCache.weather.key === weatherKey &&
    nowTs - dashboardCache.weather.updatedAt < WEATHER_TTL_MS
  ) {
    return {
      weather: dashboardCache.weather.data,
      weatherUpdatedAt: dashboardCache.weather.updatedAt,
    }
  }

  let coords = null
  try {
    const geo = await requestJsonWithRetry(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        nextRace.location
      )}&count=1&language=en&format=json`
    )
    const hit = geo?.results?.[0]
    if (Number.isFinite(hit?.latitude) && Number.isFinite(hit?.longitude)) {
      coords = { latitude: hit.latitude, longitude: hit.longitude }
    }
  } catch {
    // no-op
  }
  if (!coords) coords = CIRCUIT_COORDS[nextRace.circuit_short_name] || null
  if (!coords) return { weather: null, weatherUpdatedAt: 0 }

  const weatherData = await requestJsonWithRetry(
    `${OPEN_METEO_URL}?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,wind_speed_10m,precipitation&timezone=auto`
  )
  const weather = { ...(weatherData?.current || {}), raceCircuit: nextRace.circuitName }
  dashboardCache.weather = { updatedAt: nowTs, key: weatherKey, data: weather }
  try {
    writeFileSync(PERSIST_FILE, JSON.stringify(dashboardCache), 'utf-8')
  } catch {}
  return { weather, weatherUpdatedAt: nowTs }
}

// Combineert OpenF1 + weather tot één dashboard payload.
async function getDashboardSnapshot() {
  if (!dashboardInFlightPromise) {
    dashboardInFlightPromise = (async () => {
      const openf1 = await fetchOpenF1Snapshot()
      const weather = await fetchWeatherSnapshot(openf1.nextRace)
      return {
        nextRace: openf1.nextRace,
        drivers: openf1.drivers,
        seasonStats: openf1.seasonStats,
        seasonStatsYear: openf1.seasonStatsYear,
        weather: weather.weather,
        timestamps: {
          ...openf1.timestamps,
          weatherUpdatedAt: weather.weatherUpdatedAt,
        },
      }
    })().finally(() => {
      dashboardInFlightPromise = null
    })
  }
  return dashboardInFlightPromise
}

// Haalt exact 5 fotos op uit Unsplash voor het huidige uur.
async function fetchHourlyPhotosFromUnsplash() {
  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error('UNSPLASH_ACCESS_KEY ontbreekt op server.')
  }

  const page = (getCurrentHourBucketUtc() % 100) + 1
  const url = `${UNSPLASH_API_URL}/search/photos?query=formula%201%20motorsport&orientation=landscape&content_filter=high&per_page=5&page=${page}`
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  })
  if (!res.ok) {
    throw new Error(`Unsplash request failed (${res.status})`)
  }

  const data = await res.json()
  const mappedPhotos = (Array.isArray(data?.results) ? data.results : [])
    .map(mapUnsplashPhoto)
    .filter((p) => p.url)
    .slice(0, 5)

  if (mappedPhotos.length !== 5) {
    throw new Error('Onvoldoende fotos ontvangen van Unsplash.')
  }
  return mappedPhotos
}

// Geeft de huidige hour-bucket set terug, met in-flight deduping.
async function getHourlyPhotos() {
  const currentHour = getCurrentHourBucketUtc()
  if (cache.hourBucket === currentHour && Array.isArray(cache.photos) && cache.photos.length === 5) {
    return cache.photos
  }

  if (!inFlightPromise) {
    inFlightPromise = fetchHourlyPhotosFromUnsplash()
      .then((photos) => {
        cache = { hourBucket: currentHour, photos }
        return photos
      })
      .finally(() => {
        inFlightPromise = null
      })
  }

  return inFlightPromise
}

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

// Hourly foto-endpoint met centrale fallback zodat alle clients gelijk blijven.
app.get('/api/unsplash-hourly', async (_req, res) => {
  const currentHour = getCurrentHourBucketUtc()
  try {
    const photos = await getHourlyPhotos()
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.json({ photos, source: 'server-hourly-cache', hourBucket: currentHour })
  } catch (error) {
    // Centrale fallback per uur zodat alle clients identieke data houden.
    if (cache.hourBucket !== currentHour || !Array.isArray(cache.photos) || cache.photos.length !== 5) {
      cache = { hourBucket: currentHour, photos: SERVER_FALLBACK_PHOTOS }
    }
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.json({
      photos: cache.photos,
      source: 'server-hourly-fallback',
      hourBucket: currentHour,
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Dashboard endpoint voor widgets op home.
app.get('/api/dashboard-snapshot', async (_req, res) => {
  try {
    const data = await getDashboardSnapshot()
    res.setHeader('Cache-Control', 'public, max-age=10')
    res.json(data)
  } catch (error) {
    console.warn('[Dashboard] Fetch failed:', error.message)
    // Serveer last-known-good snapshot als beschikbaar (ook al is TTL verlopen).
    const lastKnownOpenf1 = dashboardCache.openf1?.data
    if (lastKnownOpenf1) {
      const lastKnownWeather = dashboardCache.weather?.data || null
      res.setHeader('Cache-Control', 'no-store')
      res.json({
        ...lastKnownOpenf1,
        weather: lastKnownWeather,
        timestamps: {
          ...lastKnownOpenf1.timestamps,
          weatherUpdatedAt: dashboardCache.weather?.updatedAt || 0,
        },
        stale: true,
      })
    } else {
      res.status(502).json({
        error: 'Dashboard data tijdelijk niet beschikbaar.',
        detail: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
})

// Open-Meteo 7-daagse + actueel weer voor circuitcoördinaten (proxy + servercache + browser-cache headers).
app.get('/api/circuit-weather', async (req, res) => {
  const lat = Number(req.query.latitude)
  const lon = Number(req.query.longitude)
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    res.status(400).json({ error: 'Ongeldige breedte- of lengtegraad.' })
    return
  }

  const key = `${lat.toFixed(5)},${lon.toFixed(5)}`
  const nowTs = Date.now()
  const bypassServerCache = req.query.refresh === '1'
  const hit = circuitWeatherCache.get(key)
  if (!bypassServerCache && hit && nowTs - hit.updatedAt < CIRCUIT_WEATHER_TTL_MS) {
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.json(hit.data)
    return
  }

  const daily =
    'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode'
  const current =
    'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m'
  const url =
    `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=${current}` +
    `&daily=${daily}` +
    '&timezone=auto&forecast_days=7'

  try {
    const data = await requestJsonWithRetry(url)
    circuitWeatherCache.set(key, { updatedAt: nowTs, data })
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.json(data)
  } catch (error) {
    if (hit?.data) {
      res.setHeader('Cache-Control', 'no-store')
      res.json({ ...hit.data, stale: true })
      return
    }
    res.status(502).json({
      error: 'Weerdata tijdelijk niet beschikbaar.',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Racekalender endpoint met last-known-good fallback.
app.get('/api/race-calendar', async (_req, res) => {
  try {
    const data = await fetchRaceCalendarSnapshot()
    res.setHeader('Cache-Control', 'public, max-age=30')
    res.json(data)
  } catch (error) {
    const hasCachedCalendar = Array.isArray(dashboardCache.raceCalendar.data)
    if (hasCachedCalendar) {
      res.setHeader('Cache-Control', 'no-store')
      res.json({
        races: dashboardCache.raceCalendar.data,
        seasonYear: dashboardCache.raceCalendar.seasonYear,
        cached: true,
        stale: true,
        updatedAt: dashboardCache.raceCalendar.updatedAt,
      })
    } else {
      res.status(502).json({
        error: 'Racekalender tijdelijk niet beschikbaar.',
        detail: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
})

// VIN-decoder: DB.VIN (Europa) + NHTSA (motor/PK waar beschikbaar).
app.get('/api/vin-decode', async (req, res) => {
  try {
    const row = await resolveVinDecode(String(req.query.vin || ''))
    res.setHeader('Cache-Control', 'private, max-age=300')
    res.json(row)
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'VIN kon niet worden gedecodeerd.',
    })
  }
})

const SEARCH_ENRICH_BATCH = 30

// Merk/model-zoeken: NHTSA + wereldwijd catalogus (236+ merken).
app.get('/api/models-by-make', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    const make = String(req.query.make || '').trim()
    const modelFilter = String(req.query.model || '').trim()
    const query = q || (modelFilter ? `${make} ${modelFilter}` : make)
    const yearRaw = req.query.year
    const year = yearRaw ? Number(yearRaw) : null
    if (!query) {
      return res.status(400).json({ error: 'Voer een merk of model in.' })
    }
    if (yearRaw && (!Number.isFinite(year) || year < 1984)) {
      return res.status(400).json({ error: 'Ongeldig jaartal.' })
    }
    let rows = await resolveVehicleSearch(query, year)
    if (rows.length) {
      const enrichment = await resolveMakeEnrichment('', rows.slice(0, SEARCH_ENRICH_BATCH))
      rows = applyEnrichment(rows, enrichment)
    }
    res.setHeader('Cache-Control', 'private, max-age=600')
    res.json(rows)
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Voertuigdata kon niet worden geladen.',
    })
  }
})

// Specs aanvullen via EPA (per pagina, voor rijen buiten de eerste batch).
app.post('/api/models-enrich', async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : []
    if (!rows.length) {
      return res.status(400).json({ error: 'Geen rijen om te verrijken.' })
    }
    const enrichment = await resolveMakeEnrichment('', rows)
    res.setHeader('Cache-Control', 'private, max-age=600')
    res.json(enrichment)
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Specs konden niet worden geladen.',
    })
  }
})

const server = app.listen(PORT, () => {
  console.log(`AutoDash API running on http://localhost:${PORT}`)
  console.log('[Vehicle] Zoeken met EPA-verrijking (v2) actief')
  preloadCatalogBrands().catch((err) =>
    console.warn('[Startup] Catalog preload failed:', err.message)
  )
  getDashboardSnapshot().catch((err) =>
    console.warn('[Startup] Dashboard snapshot warmup failed:', err.message)
  )
  fetchHourlyPhotosFromUnsplash().catch(() => {})
})

server.on('close', () => {
  console.log('AutoDash API server closed.')
})

// Keep process alive in local dev shells where handles can be detached.
setInterval(() => {}, 60 * 1000)
