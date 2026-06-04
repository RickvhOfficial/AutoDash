// Dashboard BFF: snapshot en health-check (zelfde origin /api, /health).

export async function fetchDashboardSnapshot({ signal } = {}) {
  const res = await fetch('/api/dashboard-snapshot', { signal })
  if (!res.ok) {
    throw new Error('Dashboard API tijdelijk niet beschikbaar.')
  }
  return res.json()
}

export async function fetchDashboardSnapshotForStandings({ signal } = {}) {
  const res = await fetch('/api/dashboard-snapshot', { signal })
  if (!res.ok) {
    throw new Error('Coureurs konden niet worden geladen.')
  }
  return res.json()
}

export async function fetchApiHealth() {
  const res = await fetch('/health')
  return res.ok
}
