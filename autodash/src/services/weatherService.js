// Weerservice: circuitcoordinaten, retryberekening en actuele weersnapshot per race.
import { requestJsonWithRetry } from './httpClient'

export const CIRCUIT_COORDS = {
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

export const WEATHER_RETRY_BASE_MS = 2 * 60 * 1000
export const WEATHER_RETRY_MAX_MS = 30 * 60 * 1000

export function computeWeatherRetryDelay(failureStreak) {
  return Math.min(WEATHER_RETRY_BASE_MS * (2 ** (failureStreak - 1)), WEATHER_RETRY_MAX_MS)
}

/** Weer voor circuitweerpagina: via eigen backend (cache + zelfde origin als overige /api-calls). */
const CIRCUIT_WEATHER_API = '/api/circuit-weather'

/** WMO weathercode → emoji (opdracht-buckets). */
export function weatherCodeToIcon(code) {
  const c = Number(code)
  if (!Number.isFinite(c)) return '⛅'
  if (c === 0) return '☀️'
  if (c >= 1 && c <= 3) return '⛅'
  if (c >= 51 && c <= 67) return '🌧️'
  if (c >= 71 && c <= 77) return '❄️'
  if (c >= 80 && c <= 99) return '⛈️'
  return '⛅'
}

/** Korte Nederlandse omschrijving bij WMO-code. */
export function weatherCodeToLabelNl(code) {
  const c = Number(code)
  if (!Number.isFinite(c)) return 'Onbekend'
  if (c === 0) return 'Helder'
  if (c >= 1 && c <= 3) return 'Bewolkt'
  if (c >= 51 && c <= 67) return 'Regen'
  if (c >= 71 && c <= 77) return 'Sneeuw'
  if (c >= 80 && c <= 99) return 'Onweer'
  return 'Deels bewolkt'
}

/** Windrichting in kompasletters (NL gangbaar). */
export function formatWindDirectionDegrees(degrees) {
  if (!Number.isFinite(degrees)) return '—'
  const labels = [
    'N',
    'NNO',
    'NO',
    'ONO',
    'O',
    'OZO',
    'ZO',
    'ZZO',
    'Z',
    'ZZW',
    'ZW',
    'WZW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ]
  const i = Math.round(degrees / 22.5) % 16
  return labels[i]
}

/**
 * 7-daagse forecast + actueel weer (één request) voor circuitcoördinaten.
 * @param {AbortSignal} [signal]
 */
export async function getCircuitWeather(lat, lon, signal, forceRefresh = false) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    ...(forceRefresh ? { refresh: '1' } : {}),
  })
  const response = await fetch(`${CIRCUIT_WEATHER_API}?${params}`, {
    ...(signal ? { signal } : {}),
    ...(forceRefresh ? { cache: 'no-store' } : {}),
  })
  if (!response.ok) throw new Error('Weerdata niet beschikbaar')
  return response.json()
}

// Bepaalt coordinaten (geocoding of fallback-map) en haalt Open-Meteo current weather op.
export async function fetchWeatherForRace({
  raceData,
  geocodingClient,
  openMeteoClient,
  openMeteoUrl,
  signal,
}) {
  if (!raceData) throw new Error('Geen race-data beschikbaar voor weerlocatie.')

  let coords = null
  try {
    const geoRes = await geocodingClient.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(raceData.location)}&count=1&language=en&format=json`,
      { signal }
    )
    const hit = geoRes.data?.results?.[0]
    if (Number.isFinite(hit?.latitude) && Number.isFinite(hit?.longitude)) {
      coords = { latitude: hit.latitude, longitude: hit.longitude }
    }
  } catch {
    // Geocoding mislukt → fallback map
  }

  if (!coords) coords = CIRCUIT_COORDS[raceData.circuit_short_name] || null
  if (!coords) throw new Error('Geen coördinaten beschikbaar voor dit circuit.')

  const weatherData = await requestJsonWithRetry(
    openMeteoClient,
    `${openMeteoUrl}?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,wind_speed_10m,precipitation&timezone=auto`,
    signal
  )

  return { ...weatherData.current, raceCircuit: raceData.circuitName }
}
