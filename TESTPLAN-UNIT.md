# Testplan — AutoDash (unit tests / Vitest)

**Versie:** 1.1
**Datum:** 2 juni 2026
**Auteur:** Rick (stage)
**Status:** Klaar om af te vinken — los van handmatig [TESTPLAN.md](./TESTPLAN.md)

**Referentie:** stage-opdracht *Unit Tests schrijven met Vitest* + [README.md](./README.md).

---

## Overzicht: twee soorten tests (gescheiden)

| | **Handmatig** | **Dit document** |
| --- | --- | --- |
| **Type** | Browser, hele app | Vitest + React Testing Library |
| **ID’s** | TC-001 t/m TC-041 | UT-001 t/m UT-016 |
| **Uitvoeren** | `npm run dev:all` | `npm run test` in map `autodash/` |
| **Document** | [TESTPLAN.md](./TESTPLAN.md) | `TESTPLAN-UNIT.md` (dit bestand) |

---

## 1. Testdoelen (unit)

1. **Setup** — Vitest draait lokaal via Vite-config en `setup.js`.
2. **Utils** — `isValidLapTime` en `lapTimeToMs` gedragen zich correct (opdracht).
3. **Componenten** — `LoadingSpinner`, `Footer`, `ErrorMessage` renderen verwachte inhoud.
4. **Automatisering** — `npm run test` slaagt zonder fouten; minimaal 5 testbestanden.
5. **Traceerbaarheid** — Vaste UT-ID’s; bij falen ❌ + notitie; defectenlog (sectie 5).

---

## 2. Testomgeving (unit)

| Onderdeel | Specificatie |
| --- | --- |
| **Map** | `autodash/` (projectroot frontend) |
| **Commando** | `npm run test` (alle tests) |
| **Coverage** *(optioneel)* | `npm run test:coverage` → map `coverage/` (alleen rapport, niet committen) |
| **Watch-modus** *(optioneel)* | `npm run test:watch` |
| **Vereisten** | `npm install` eenmalig; **geen** browser; **geen** live website |
| **Testbestanden** | `autodash/src/tests/*.test.js(x)` |
| **Setup-bestand** | `autodash/src/tests/setup.js` |

### Testbestanden (ter referentie)

| Bestand | Onderdeel |
| --- | --- |
| `lapStorage.test.js` | `isValidLapTime`, `lapTimeToMs` |
| `LoadingSpinner.test.jsx` | `LoadingSpinner` |
| `Footer.test.jsx` | `Footer` |
| `ErrorMessage.test.jsx` | `ErrorMessage` |
| `lapTimeFormat.test.js` | `formatLapTimeInput`, `completeLapTimeInput`, `msToLapTime` |

---

## 3. Testcases (unit — UT-001 t/m UT-016)

**Hoe afvinken:** klik op het vakje in Cursor/VS Code. Afgevinkt = geslaagd. Bij falen: laat uitgevinkt en zet `❌` + korte notitie achter de regel.

**Uitvoervolgorde:** van **UT-001** naar **UT-016** (boven naar beneden). Eerst setup controleren, dan `npm run test` in `autodash/`.

**Voortgang:** 0 / 16 afgevinkt *(handmatig bijwerken)*

### Setup (Vitest-configuratie)

- [ ] **UT-001** — `vite.config.js` bevat `test.environment: 'jsdom'`, `globals: true`, `setupFiles: './src/tests/setup.js'` · Verwacht: config aanwezig
- [ ] **UT-002** — `src/tests/setup.js` importeert `@testing-library/jest-dom` · Verwacht: bestand aanwezig
- [ ] **UT-003** — `package.json` heeft script `"test": "vitest run"` · Verwacht: `npm run test` start Vitest
- [ ] **UT-004** — Minimaal **5** bestanden in `src/tests/` met extensie `.test.js` of `.test.jsx` · Verwacht: 5 bestanden

### Lap Time Utilities (`lapStorage.test.js`)

- [ ] **UT-005** — `isValidLapTime('01:23.456')` is geldig · Invoer: unit test · Verwacht: `true`
- [ ] **UT-006** — `isValidLapTime('abc')` en `'1:2.3'` ongeldig · Invoer: unit test · Verwacht: `false`
- [ ] **UT-007** — `lapTimeToMs('01:23.456')` → `83456` · Invoer: unit test · Verwacht: juiste ms
- [ ] **UT-008** — `lapTimeToMs('00:00.001')` → `1` · Invoer: unit test · Verwacht: juiste ms

### LoadingSpinner (`LoadingSpinner.test.jsx`)

- [ ] **UT-009** — Standaard laadtekst · Invoer: render zonder props · Verwacht: tekst `Data laden...`
- [ ] **UT-010** — Aangepaste boodschap · Invoer: `message="Races worden geladen..."` · Verwacht: die tekst zichtbaar

### Footer (`Footer.test.jsx`)

- [ ] **UT-011** — Projectnaam · Invoer: render `<Footer />` · Verwacht: tekst bevat `AutoDash`
- [ ] **UT-012** — Huidig jaar · Invoer: render `<Footer />` · Verwacht: tekst bevat `new Date().getFullYear()`

### ErrorMessage (`ErrorMessage.test.jsx`)

- [ ] **UT-013** — Foutmelding tonen · Invoer: `message="API niet bereikbaar"` · Verwacht: melding + “Oeps” in document
- [ ] **UT-014** — Retry-knop · Invoer: klik **Probeer opnieuw** · Verwacht: `onRetry` wordt aangeroepen

### Lap Time Format (`lapTimeFormat.test.js`)

- [ ] **UT-015** — `formatLapTimeInput` / `completeLapTimeInput` · Invoer: unit test · Verwacht: tests slagen in bestand

### Uitvoering & acceptatie run

- [ ] **UT-016** — Volledige testrun · Invoer: `cd autodash` → `npm run test` · Verwacht: alle testbestanden **passed** (11 tests)

**Totaal:** 16 testcases (UT-001 t/m UT-016) + 5 testbestanden + 11 Vitest-asserties.

### Optioneel (niet verplicht voor afvinken)

- [ ] **UT-COV** — Coverage · Invoer: `npm run test:coverage` · Verwacht: rapport in `coverage/`; `isValidLapTime` + `lapTimeToMs` regels gedekt

---

## 4. Acceptatiecriteria (unit testplan)

- [X] Minimaal 5 testbestanden beschreven en aanwezig
- [X] Testdoelen, omgeving en UT-001 t/m UT-016 vastgelegd
- [ ] Alle 16 UT’s afgevinkt of met ❌ gedocumenteerd
- [ ] `npm run test` lokaal uitgevoerd en geslaagd
- [ ] Opdracht: `lapTimeToMs` en `isValidLapTime` getest (UT-005 t/m UT-008)
- [ ] Gefaalde UT’s vastgelegd in defectenlog (sectie 5)

### Goedkeuring

- [ ] **Naoufal** — akkoord unit testplan · Datum: ___________

---

## 5. Uitvoeringsnotities (invullen na testen)

### Testronde

- **Datum uitvoering:**
- **Uitgevoerd door:**
- **Commando:** `npm run test` ja/nee
- **Coverage gedraaid:** ja/nee
- **Samenvatting:** ___ / 16 UT’s afgevinkt (geslaagd)

### Bekende aandachtspunten vóór start

- Unit tests draaien in **`autodash/`**, niet in de repo-root.
- Map **`coverage/`** is gegenereerd rapport — geen broncode; niet handmatig bewerken.
- UT-016 moet als laatste: bevestigt dat alles samen groen is.
- Handmatige browser-tests blijven in **TESTPLAN.md** (TC-001 t/m TC-041).

### Defectenlog (voorbeeld)

| Test ID | Korte beschrijving | Prioriteit |
| ------- | ------------------ | ---------- |
|         |                    |            |

---

*Vink UT’s af na `npm run test`. Bij ❌ een korte notitie achter de regel. Handmatig testen = [TESTPLAN.md](./TESTPLAN.md).*
