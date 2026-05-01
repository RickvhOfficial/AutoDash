// Route: /standings — toont F1-coureurs van laatste sessie via OpenF1 met zoekfilter.
import { useMemo, useState } from 'react'
import DriverCard from '../components/DriverCard'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import { useF1Drivers } from '../hooks/useF1Drivers'
import { HOME_HERO_HEIGHT_PX } from './Home'

const STANDEN_HERO_HEIGHT_PX = HOME_HERO_HEIGHT_PX
const HERO_IMG =
  'https://images.unsplash.com/photo-1571663434890-12a1afaa7e16?auto=format&fit=crop&w=1920&q=80'

export default function DriverStandings() {
  const { drivers, loading, error } = useF1Drivers()
  const [search, setSearch] = useState('')
  const seasonYear = new Date().getFullYear()

  // Filter op naam of team; lowercase compare zoals in het briefing.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return drivers
    return drivers.filter((d) => {
      const name = d?.full_name?.toLowerCase() ?? ''
      const team = d?.team_name?.toLowerCase() ?? ''
      return name.includes(term) || team.includes(term)
    })
  }, [drivers, search])

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-slate-950 text-slate-100">
      <div
        className="relative w-full shrink-0 border-b border-slate-800"
        style={{ height: STANDEN_HERO_HEIGHT_PX, maxHeight: STANDEN_HERO_HEIGHT_PX }}
      >
        <img
          src={HERO_IMG}
          alt="F1 coureurs hero"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/30 to-slate-950/80" />
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="w-full px-6 py-7 md:px-10">
            <h1 className="pl-12 text-3xl font-extrabold tracking-tight text-white [text-shadow:0_5px_18px_rgba(0,0,0,0.95)] md:text-4xl">
              F1 Coureurs {seasonYear}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative flex w-full max-w-md items-center">
            <span className="sr-only">Zoek op naam of team</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op naam of team..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/60"
            />
          </label>
          {!loading && !error && drivers.length > 0 && (
            <p className="text-sm text-slate-400">
              {filtered.length} van {drivers.length} coureurs
            </p>
          )}
        </div>

        {loading && <LoadingSpinner message="Coureurs laden..." />}

        {!loading && error && (
          <ErrorMessage
            message={error}
            onRetry={() => {
              if (typeof window !== 'undefined') window.location.reload()
            }}
          />
        )}

        {!loading && !error && drivers.length === 0 && (
          <ErrorMessage message="Geen coureurs gevonden voor de laatste sessie." />
        )}

        {!loading && !error && drivers.length > 0 && filtered.length === 0 && (
          <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-center text-slate-300">
            Geen coureurs gevonden voor je zoekopdracht.
          </p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((driver, idx) => (
              <DriverCard
                key={driver.driver_number ?? `${driver.full_name}-${idx}`}
                driver={driver}
                position={idx + 1}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
