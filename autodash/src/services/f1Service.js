// Frontend API-client voor racekalenderdata uit de eigen backend.
const BASE_URL = '/api'

// Haalt racekalender op en normaliseert de response-shape.
export async function getRaceCalendar(signal) {
  const response = await fetch(`${BASE_URL}/race-calendar`, { signal })
  if (!response.ok) {
    throw new Error('F1-data kon niet worden geladen.')
  }
  const data = await response.json()
  return {
    races: Array.isArray(data?.races) ? data.races : [],
    seasonYear: data?.seasonYear ?? new Date().getFullYear(),
    stale: Boolean(data?.stale),
    updatedAt: data?.updatedAt ?? null,
  }
}
