// Motorsport-nieuws: normalisatie + ophalen via BFF (/api/motorsport-news).

export const MIN_NEWS_ARTICLES = 5
export const MAX_NEWS_ARTICLES = 10

const RSS2JSON_FEEDS = [
  'https://www.motorsport.com/rss/f1/news/',
  'https://feeds.bbci.co.uk/sport/formula1/rss.xml',
  'https://www.autosport.com/rss/news/formula1/',
]

const GNEWS_SEARCH_URL = 'https://gnews.io/api/v4/search'

/** Verwijdert HTML-tags en normaliseert witruimte. */
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return ''
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateText(text, maxLen = 220) {
  const clean = (text || '').trim()
  if (clean.length <= maxLen) return clean
  return `${clean.slice(0, maxLen - 1).trim()}…`
}

function toIsoDate(value) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function pickImageFromRssItem(item) {
  if (!item || typeof item !== 'object') return null
  if (typeof item.thumbnail === 'string' && item.thumbnail.trim()) return item.thumbnail.trim()
  const enclosureLink = item.enclosure?.link
  if (typeof enclosureLink === 'string' && /^https?:\/\//i.test(enclosureLink)) {
    return enclosureLink.trim()
  }
  const desc = item.description || item.content || ''
  const imgMatch = String(desc).match(/<img[^>]+src=["']([^"']+)["']/i)
  return imgMatch?.[1]?.trim() || null
}

function normalizeArticle({ id, title, description, url, image, publishedAt }) {
  const safeTitle = (title || '').trim()
  const safeUrl = (url || '').trim()
  if (!safeTitle || !safeUrl || !/^https?:\/\//i.test(safeUrl)) return null

  return {
    id: id || safeUrl,
    title: safeTitle,
    description: truncateText(stripHtml(description || '')),
    url: safeUrl,
    image: image && /^https?:\/\//i.test(image) ? image.trim() : null,
    publishedAt: toIsoDate(publishedAt),
  }
}

export function normalizeGNewsPayload(payload) {
  const list = Array.isArray(payload?.articles) ? payload.articles : []
  return list
    .map((article, idx) =>
      normalizeArticle({
        id: article?.url || `gnews-${idx}`,
        title: article?.title,
        description: article?.description,
        url: article?.url,
        image: article?.image,
        publishedAt: article?.publishedAt,
      })
    )
    .filter(Boolean)
    .slice(0, MAX_NEWS_ARTICLES)
}

export function normalizeRss2JsonPayload(payload) {
  const list = Array.isArray(payload?.items) ? payload.items : []
  return list
    .map((item, idx) =>
      normalizeArticle({
        id: item?.guid || item?.link || `rss-${idx}`,
        title: item?.title,
        description: item?.description || item?.content,
        url: item?.link,
        image: pickImageFromRssItem(item),
        publishedAt: item?.pubDate,
      })
    )
    .filter(Boolean)
    .slice(0, MAX_NEWS_ARTICLES)
}

async function fetchJson(url, { headers } = {}) {
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`News provider failed (${res.status})`)
  }
  return res.json()
}

/** Server-side: GNews (NL) met RSS2JSON-fallback. */
export async function fetchMotorsportNewsFromProviders({ gnewsApiKey } = {}) {
  const key = (gnewsApiKey || '').trim()

  if (key) {
    try {
      const gnewsUrl = new URL(GNEWS_SEARCH_URL)
      gnewsUrl.searchParams.set('q', 'formula 1')
      gnewsUrl.searchParams.set('lang', 'nl')
      gnewsUrl.searchParams.set('max', String(MAX_NEWS_ARTICLES))
      gnewsUrl.searchParams.set('apikey', key)
      const payload = await fetchJson(gnewsUrl.toString())
      const articles = normalizeGNewsPayload(payload)
      if (articles.length >= MIN_NEWS_ARTICLES) {
        return { articles, source: 'gnews' }
      }
    } catch (error) {
      console.warn('[News] GNews failed, falling back to RSS:', error.message)
    }
  }

  let lastError = null
  for (const feedUrl of RSS2JSON_FEEDS) {
    try {
      const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`
      const rssPayload = await fetchJson(rss2jsonUrl)
      if (rssPayload?.status && rssPayload.status !== 'ok') {
        throw new Error('RSS-feed kon niet worden geladen.')
      }
      const articles = normalizeRss2JsonPayload(rssPayload)
      if (articles.length >= MIN_NEWS_ARTICLES) {
        return { articles, source: 'rss2json' }
      }
    } catch (error) {
      lastError = error
      console.warn(`[News] RSS feed failed (${feedUrl}):`, error.message)
    }
  }

  throw lastError || new Error('Onvoldoende nieuwsartikelen beschikbaar.')
}

/** Client: haalt genormaliseerde artikelen op via Express BFF. */
export async function fetchMotorsportNews({ signal } = {}) {
  const res = await fetch('/api/motorsport-news', { signal })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || 'Nieuws kon niet worden geladen.')
  }
  const data = await res.json()
  const articles = Array.isArray(data?.articles) ? data.articles : []
  if (articles.length < MIN_NEWS_ARTICLES) {
    throw new Error('Onvoldoende nieuwsartikelen beschikbaar.')
  }
  return data
}

export function formatNewsDate(isoString, locale = 'nl-NL') {
  if (!isoString) return 'Datum onbekend'
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return 'Datum onbekend'
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
