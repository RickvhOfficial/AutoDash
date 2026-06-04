# Code review — AutoDash checklist

**Datum:** 4 juni 2026  
**Doel:** React best practices doorvoeren zonder gedragswijziging (zelfde UI/UX en API-flow).

---

## Samenvatting verbeteringen (≥5)

| # | Verbetering | Bestanden |
|---|-------------|-----------|
| 1 | Dashboard-`fetch` naar services-laag | `services/dashboardService.js`, hooks, `App.jsx` |
| 2 | DRY `enrichDriverList` | `utils/driverList.js` |
| 3 | Hero-hoogte centraal + Tailwind i.p.v. inline `style` | `constants/layout.js`, alle hero-pagina’s |
| 4 | `SafeImg` met `onError` / `fallbackSrc` op alle relevante `<img>` | `components/SafeImg.jsx`, pages + components |
| 5 | Dode code verwijderd | `openf1Service.js` (ongebruikt) |
| 6 | `useIsLgScreen` naar hook | `hooks/useMediaQuery.js` |
| 7 | Tabel-grid Tailwind i.p.v. inline style | `VehicleSearch.jsx` |
| 8 | Header/RaceCard opgesplitst (<~100 regels per bestand) | `Header*.jsx`, `RaceCard*.jsx`, `headerNav.js` |

---

## Checklist

### Componenten

| Item | Status | Opmerking |
|------|--------|-----------|
| Eén verantwoordelijkheid | Gedeeltelijk | Pagina’s blijven orchestrators; UI-blokken in `components/` |
| ~100 regels per component | Verbeterd | `Header`, `RaceCard` gesplitst; kleine components al OK |
| `key` bij `.map()` | OK | Bestaande keys behouden |
| `onError` bij `<img>` | Gedaan | Via `SafeImg` (+ `DriverHeadshot` ongewijzigd) |

### State & Hooks

| Item | Status | Opmerking |
|------|--------|-----------|
| `useEffect` dependencies | OK | Geen wijzigingen aan dependency-logica |
| Custom hooks voor API | OK | `useDashboardData`, `useF1Drivers`, `useLapTimes`, `useMediaQuery` |
| Geen redundante state | OK | Geen wijziging |

### API Services

| Item | Status | Opmerking |
|------|--------|-----------|
| API in `/services` | Gedaan | Snapshot + health in `dashboardService.js` |
| Error handling bij fetch | OK | Bestaande foutafhandeling behouden |
| Geen hardcoded API-keys | OK | Alleen env-vars |

### DRY

| Item | Status | Opmerking |
|------|--------|-----------|
| Herbruikbare functies | Gedaan | `enrichDriverList`, `SafeImg`, race/header helpers |
| Constanten centraal | Gedaan | `constants/layout.js`, bestaande `data/` + `constants/uiTiming.js` |

### Naamgeving

| Item | Status |
|------|--------|
| PascalCase componenten | OK |
| camelCase utils/functies | OK |
| Bestandsconventies | OK |

### Tailwind

| Item | Status | Opmerking |
|------|--------|-----------|
| Geen inline `style` waar Tailwind kan | Gedeeltelijk | Heroes + tabel-grid; dynamische kleuren/posities blijven `style` |
| Responsieve classes | OK | Geen wijziging |

### Overig

| Item | Status |
|------|--------|
| Geen `console.log` in `src/` | OK |
| Unit tests | `npm run test` — zie testrun |

---

## Bewust inline `style` (N.v.t. voor Tailwind-migratie)

- Teamkleur `borderLeft` (standen, `DriverCard`)
- Chart-tooltip kleur (`CircuitWeather`)
- Popup-positie (`VehicleSearch`, `LapTracker`)
- `backgroundImage` hero-panel (`CircuitWeather`)
- Sidebar `top: var(--sidebar-mid-y)` (`App.jsx`)
- `document.body.style.overflow` scroll-lock (`App.jsx`)

---

## Verificatie

```bash
cd autodash
npm run test
```

Handmatig (zie [TESTPLAN.md](./TESTPLAN.md)): home, races, standings, weather, vehicles, lap-tracker.
