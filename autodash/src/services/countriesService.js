// Landservice: vlag-URL en volledige landinfo via REST Countries met in-memory cache.
// OpenF1 gebruikt "Netherlands" + NED; zoeken op alleen "Netherlands" geeft ten onrechte Caribisch Nederland.
const countryFlagCache = new Map()
const countryInfoCache = new Map()

const REST_COUNTRIES_BASE =
  import.meta.env.VITE_REST_COUNTRIES_URL || 'https://restcountries.com/v3.1'

const COUNTRY_INFO_FIELDS =
  'name,flags,capital,population,currencies,languages,region,timezones,cca2,cca3'

const F1_COUNTRY_NAME_TO_ALPHA = {
  netherlands: 'NED',
  'united kingdom': 'GBR',
  'united states': 'USA',
  'united states of america': 'USA',
}

function normalizeCountryKey(countryName) {
  return countryName?.trim?.().toLowerCase() ?? ''
}

function resolveCacheKey(countryName, countryCode) {
  const code = countryCode?.trim()?.toLowerCase()
  if (code) return code
  return normalizeCountryKey(countryName)
}

function resolveAlphaCode(countryName, countryCode) {
  const code = countryCode?.trim()?.toUpperCase()
  if (code) return code
  return F1_COUNTRY_NAME_TO_ALPHA[normalizeCountryKey(countryName)] || null
}

function pickBestCountryMatch(data, countryName) {
  if (!Array.isArray(data) || data.length === 0) return null
  const key = normalizeCountryKey(countryName)
  if (key === 'netherlands') {
    return data.find((c) => c.cca2 === 'NL' || c.cca3 === 'NLD') ?? data[0]
  }
  return data[0]
}

async function fetchCountryRecord(countryName, countryCode, fields, signal) {
  const alpha = resolveAlphaCode(countryName, countryCode)
  if (alpha) {
    const response = await fetch(
      `${REST_COUNTRIES_BASE}/alpha/${encodeURIComponent(alpha)}?fields=${fields}`,
      { signal }
    )
    if (!response.ok) return null
    const data = await response.json()
    return data?.name ? data : null
  }

  if (!countryName?.trim()) return null
  const response = await fetch(
    `${REST_COUNTRIES_BASE}/name/${encodeURIComponent(countryName)}?fields=${fields}`,
    { signal }
  )
  if (!response.ok) return null
  const data = await response.json()
  return pickBestCountryMatch(data, countryName)
}

function storeCountryInCache(cacheKey, country) {
  if (!cacheKey || !country) return
  countryInfoCache.set(cacheKey, country)
  const flag = country.flags?.png || ''
  if (flag) countryFlagCache.set(cacheKey, flag)
}

export async function getCountryInfo(countryName, signal, countryCode) {
  const cacheKey = resolveCacheKey(countryName, countryCode)
  if (!cacheKey) return null
  if (countryInfoCache.has(cacheKey)) return countryInfoCache.get(cacheKey)

  try {
    const country = await fetchCountryRecord(
      countryName,
      countryCode,
      COUNTRY_INFO_FIELDS,
      signal
    )
    if (country) storeCountryInCache(cacheKey, country)
    return country
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    return null
  }
}

export async function getCountryFlag(countryName, signal, countryCode) {
  if (!countryName && !countryCode) return ''
  const cacheKey = resolveCacheKey(countryName, countryCode)
  if (!cacheKey) return ''
  if (countryFlagCache.has(cacheKey)) return countryFlagCache.get(cacheKey)

  const cachedInfo = countryInfoCache.get(cacheKey)
  if (cachedInfo?.flags?.png) {
    countryFlagCache.set(cacheKey, cachedInfo.flags.png)
    return cachedInfo.flags.png
  }

  try {
    const country = await fetchCountryRecord(countryName, countryCode, 'flags,name,cca2,cca3', signal)
    const flag = country?.flags?.png || ''
    if (flag) countryFlagCache.set(cacheKey, flag)
    return flag
  } catch {
    return ''
  }
}