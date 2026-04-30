// Unsplash service: hourly cache keys, fallback-fotos en dashboard-afbeeldingen ophalen.
import { readUnsplashCache, writeUnsplashCacheForKey } from './cacheService'

export const UNSPLASH_UTM = 'utm_source=autodash&utm_medium=referral'
const UNSPLASH_HOURLY_CACHE_PREFIX = 'autodash_unsplash_hourly_v1'

function getCurrentHourBucketUtc() {
  return Math.floor(Date.now() / (60 * 60 * 1000))
}

export function getHourlyUnsplashCacheKey() {
  return `${UNSPLASH_HOURLY_CACHE_PREFIX}_${getCurrentHourBucketUtc()}`
}

// Lokale fallbackset als API/cached fotos tijdelijk niet beschikbaar zijn.
export function buildFallbackPhotos() {
  return [
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
}

// Probeert server-API, valt terug op local cache en daarna op placeholders.
export async function fetchDashboardBackgroundPhotos({
  unsplashApiUrl,
  unsplashAccessKey,
  fallbackPhotos,
  signal,
}) {
  void unsplashApiUrl
  void unsplashAccessKey
  const hourlyCacheKey = getHourlyUnsplashCacheKey()

  try {
    const res = await fetch('/api/unsplash-hourly', { signal })
    if (!res.ok) throw new Error('Unsplash niet beschikbaar.')
    const data = await res.json()
    const mappedPhotos = Array.isArray(data?.photos) ? data.photos : []

    if (mappedPhotos.length === 5) {
      writeUnsplashCacheForKey(mappedPhotos, hourlyCacheKey)
      return mappedPhotos
    }
    return fallbackPhotos
  } catch {
    const cachedPhotos = readUnsplashCache(hourlyCacheKey)
    if (cachedPhotos) return cachedPhotos
    return fallbackPhotos
  }
}
