// LocalStorage cachehelpers voor dashboarddata en hourly Unsplash-afbeeldingen.
export const CACHE_KEY = 'autodash_cache_site_v3'
export const CACHE_KEY_RACE_CALENDAR = 'autodash_cache_race_calendar_v2'
export const CACHE_KEY_DRIVER_STANDINGS = 'autodash_cache_driver_standings_v3'
/** Per circuit: `{ circuits: { [circuitName]: { weather, updatedAt } } }` */
export const CACHE_KEY_CIRCUIT_WEATHER = 'autodash_cache_circuit_weather_v1'
export const CACHE_MAX_AGE_MS = 60 * 60 * 1000
export const UNSPLASH_BG_CACHE_KEY = 'autodash_unsplash_bg_v1'
export const UNSPLASH_BG_TTL_MS = 60 * 60 * 1000

export function getCacheKey() {
  return CACHE_KEY
}

// Leest dashboardcache en valideert op maximale leeftijd.
export function readCache(cacheKey) {
  try {
    const raw = localStorage.getItem(cacheKey)
    if (!raw) return null
    const cache = JSON.parse(raw)
    if (!cache.savedAt || Date.now() - cache.savedAt > CACHE_MAX_AGE_MS) return null
    return cache
  } catch {
    return null
  }
}

// Merged partial update zodat losse widgets cache kunnen bijwerken.
export function writeCache(cacheKey, partial) {
  try {
    const existing = readCache(cacheKey) || {}
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ ...existing, ...partial, savedAt: Date.now() })
    )
  } catch {
    // localStorage vol of niet beschikbaar
  }
}

// Leest specifieke Unsplash-cache-entry met TTL + shape-validatie.
export function readUnsplashCache(cacheKey = UNSPLASH_BG_CACHE_KEY) {
  try {
    const raw = localStorage.getItem(cacheKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed.savedAt || Date.now() - parsed.savedAt > UNSPLASH_BG_TTL_MS) return null
    if (!Array.isArray(parsed.photos) || parsed.photos.length !== 5) return null
    return parsed.photos
  } catch {
    return null
  }
}

export function writeUnsplashCache(photos) {
  return writeUnsplashCacheForKey(photos, UNSPLASH_BG_CACHE_KEY)
}

// Schrijft hourly Unsplash-resultaten onder een expliciete cache key.
export function writeUnsplashCacheForKey(photos, cacheKey = UNSPLASH_BG_CACHE_KEY) {
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ photos, savedAt: Date.now() })
    )
  } catch {
    // localStorage vol of niet beschikbaar
  }
}
