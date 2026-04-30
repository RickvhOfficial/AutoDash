// Generieke HTTP-helpers met retry/backoff voor externe API-calls.
import axios from 'axios'

export const API_RETRY_ATTEMPTS = 2
export const API_RETRY_BASE_DELAY_MS = 600

export function createHttpClient(config = {}) {
  return axios.create(config)
}

// Verrijkt axios-fouten met uniforme metadata voor retrylogica.
export function normalizeRequestError(error, signal, url) {
  const status = error?.response?.status ?? 'unknown'
  const wrapped = new Error(`API request failed (${status}) for ${url}`, { cause: error })
  wrapped.status = status
  wrapped.code = error?.code ?? null
  wrapped.isAbort = signal?.aborted || error?.code === 'ERR_CANCELED'
  wrapped.isNetworkError = !error?.response
  return wrapped
}

// Basis JSON request met centrale foutnormalisatie.
export async function requestJson(client, url, signal) {
  try {
    const res = await client.get(url, { signal })
    return res.data
  } catch (error) {
    throw normalizeRequestError(error, signal, url)
  }
}

// Bepaalt of foutcodes/netwerkissues opnieuw geprobeerd moeten worden.
export function shouldRetryApiError(error) {
  if (error?.isAbort) return false
  const status = Number(error?.status)
  return (
    error?.isNetworkError ||
    error?.status === 'unknown' ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  )
}

export async function waitForRetry(delayMs, signal) {
  if (delayMs <= 0) return
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, delayMs)
    function onAbort() {
      clearTimeout(timer)
      reject(new Error('Retry aborted'))
    }
    if (signal) signal.addEventListener('abort', onAbort, { once: true })
  })
}

// Retry-loop met exponential backoff.
export async function requestJsonWithRetry(
  client,
  url,
  signal,
  retries = API_RETRY_ATTEMPTS,
  baseDelayMs = API_RETRY_BASE_DELAY_MS
) {
  let attempt = 0
  while (attempt <= retries) {
    try {
      return await requestJson(client, url, signal)
    } catch (error) {
      const canRetry = shouldRetryApiError(error) && attempt < retries
      if (!canRetry) throw error
      const delay = baseDelayMs * (2 ** attempt)
      await waitForRetry(delay, signal)
    }
    attempt += 1
  }
  throw new Error(`Retry exhaustion for ${url}`)
}
