// Custom hook: haalt F1-coureurs van de laatste sessie op via OpenF1.
// Dedupliceert op driver_number (OpenF1 levert soms meerdere rijen per coureur).
import { useEffect, useState } from 'react'

const OPENF1_DRIVERS_URL = 'https://api.openf1.org/v1/drivers?session_key=latest'

export function useF1Drivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetch(OPENF1_DRIVERS_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Coureurs konden niet worden geladen.')
        return res.json()
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        const unique = Array.from(
          new Map(list.map((d) => [d.driver_number, d])).values()
        )
        setDrivers(unique)
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setError(err?.message || 'Onbekende fout bij laden coureurs.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { drivers, loading, error }
}
