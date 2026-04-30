// Landservice: vertaalt landnaam naar vlag-URL met eenvoudige in-memory cache.
const countryFlagCache = new Map()

export async function getCountryFlag(countryName, signal) {
  if (!countryName) return ''
  const cacheKey = countryName.trim().toLowerCase()
  if (!cacheKey) return ''
  if (countryFlagCache.has(cacheKey)) return countryFlagCache.get(cacheKey)

  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fields=flags,name`,
      { signal }
    )
    if (!response.ok) return ''
    const data = await response.json()
    const flag = data?.[0]?.flags?.png || ''
    countryFlagCache.set(cacheKey, flag)
    return flag
  } catch {
    return ''
  }
}
