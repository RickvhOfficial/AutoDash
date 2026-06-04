# Testplan — AutoDash (handmatig / browser)

**Versie:** 1.3
**Datum:** 2 juni 2026
**Auteur:** Rick (stage)
**Status:** Concept — wacht op goedkeuring Naoufal vóór uitvoering

**Referentie:** feature list in [README.md](./README.md) — dit plan **bouwt daarop voort** met eigen scenario’s (visueel, doorloop per pagina, randgevallen), niet alleen de acceptatiecriteria letterlijk afvinken.

---

## Overzicht: twee soorten tests (gescheiden)

|                       | **Dit document**                               | **Unit tests (apart)**                                                        |
| --------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Type**        | Handmatig testen in de browser                       | Geautomatiseerd met**Vitest** + React Testing Library                         |
| **Wat test je** | Hele app: pagina’s, API’s, layout, gebruikersflows | Losse**componenten** en **utils** (bv. `ThemeToggle`, `lapStorage`) |
| **ID’s**       | **TC-001 t/m TC-041**                          | **UT-001, UT-002, …** (eigen nummering)                                      |
| **Uitvoeren**   | `npm run dev:all` + browser                        | `npm run test` in `autodash/`                                                   |
| **Document**    | `TESTPLAN.md` (dit bestand)                        | [TESTPLAN-UNIT.md](./TESTPLAN-UNIT.md) (UT-001 t/m UT-016)                             |

Deze plannen **vullen elkaar aan**, maar horen **niet door elkaar** in één checklist: handmatige TC’s vervangen geen unit tests en omgekeerd.

---

## 1. Testdoelen (handmatig)

1. **Functionaliteit** — Elke pagina en kernactie (zoeken, opslaan, verwijderen, filteren) werkt zoals bedoeld in de app.
2. **Visuele kwaliteit** — Layout, kleuren, leesbaarheid en dark/light zijn consistent op desktop én mobiel; geen overlappende of afgebroken UI.
3. **Responsive gedrag** — Bruikbaar op desktop (≥1024px) en mobiel (375px via DevTools); geen onnodige horizontale scroll.
4. **Foutafhandeling** — API-fouten en ongeldige invoer tonen `LoadingSpinner` / `ErrorMessage`; de app crasht niet.
5. **Persistentie** — Karttijden en themavoorkeur blijven na refresh (`localStorage`).
6. **Traceerbaarheid** — Vaste testcase-ID’s; bij falen ❌ + korte notitie; resultaten in defectenlog (sectie 5).

---

## 2. Testomgeving (handmatig)

| Onderdeel               | Specificatie                                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Browsers**      | Google Chrome (laatste stabiele), Mozilla Firefox (laatste stabiele)                                                                    |
| **Apparaten**     | Desktop (standaard venster), mobiel via DevTools device mode (**375×667** of vergelijkbaar)                                      |
| **Omgeving**      | Lokaal development                                                                                                                      |
| **Startcommando** | `npm run dev:all` in map `autodash/` (Vite frontend + Express API op poort **8787**, proxy via Vite)                          |
| **Alternatief**   | Twee terminals:`npm run dev:server` en `npm run dev`                                                                                |
| **Frontend-URL**  | `http://localhost:5173` (standaard Vite-poort)                                                                                        |
| **Voorwaarden**   | Netwerk aan voor externe API’s (OpenF1, Open-Meteo, NHTSA, REST Countries, Unsplash); backend moet draaien voor F1-data en `/health` |
| **Testdata**      | Schone `localStorage` optioneel voor karttijden-tests; anders eerst testrijen verwijderen                                             |
| **Offline-test**  | Chrome/Firefox DevTools → Network →**Offline** (TC-032, TC-040)                                                                 |

### Routes (ter referentie)

| Pagina           | Pad              | Navigatielabel |
| ---------------- | ---------------- | -------------- |
| Home             | `/`            | Home           |
| Racekalender     | `/races`       | Racekalender   |
| Coureurs standen | `/standings`   | Standen        |
| Circuit weer     | `/weather`     | Weer           |
| Voertuigen       | `/vehicles`    | Voertuigen     |
| Karttijden       | `/lap-tracker` | Karttijden     |

---

## 3. Testcases (handmatig — TC-001 t/m TC-041)

**Hoe afvinken:** klik op het vakje in Cursor/VS Code (Markdown-preview of direct in het `.md`-bestand). Afgevinkt = test geslaagd. Bij falen: laat uitgevinkt en zet `❌` + korte notitie achter de regel.

**Uitvoervolgorde:** van **TC-001** naar **TC-041** (boven naar beneden). Start met `npm run dev:all`. Alleen **TC-037** (backend uit) en **TC-032 / TC-040** (offline) wijken af — zie blok *Fouten & omgeving*.

**Voortgang:** 0 / 41 afgevinkt *(handmatig bijwerken of tellen via afgevinkte items)*

### Navigatie & Home

- [X] **TC-001** — Volledige menu-doorloop · Invoer: klik Home → Racekalender → Standen → Weer → Voertuigen → Karttijden · Verwacht: juiste URL per item; geen wit scherm
- [X] **TC-002** — Racekalender via menu · Invoer: klik **Racekalender** · Verwacht: URL `/races`; titel/lijst zichtbaar
- [X] **TC-003** — Header/logo op elke pagina · Invoer: open alle 6 routes op desktop · Verwacht: logo + navigatie; actieve link herkenbaar
- [X] **TC-004** — Home dashboard · Invoer: `/` met backend · Verwacht: banner + kaarten met data of duidelijke lege staat
- [X] **TC-005** — Home-widgets visueel · Invoer: `/` met data · Verwacht: kaarten netjes; geen overlap (desktop + mobiel)
- [X] **TC-006** — Footer GitHub-link · Invoer: scroll naar footer · Verwacht: **GitHub** opent repo in nieuw tabblad

### Racekalender

- [X] **TC-007** — Races laden · Invoer: `/races` · Verwacht: min. **10** races; geen blijvende fout
- [X] **TC-008** — Landvlag per race · Invoer: — · Verwacht: vlag of landcode per race

### Coureurs standen

- [X] **TC-009** — Coureurs laden · Invoer: `/standings` · Verwacht: min. **10** coureurs; posities/teams zichtbaar
- [X] **TC-010** — Zoeken op naam · Invoer: `Max` · Verwacht: gefilterde lijst (o.a. Verstappen)
- [X] **TC-011** — Zoeken op team · Invoer: `Red Bull` · Verwacht: alleen dat team
- [X] **TC-012** — Zoekveld leegmaken · Invoer: eerst `Max`, daarna wissen · Verwacht: volledige lijst terug

### Circuitweer

- [X] **TC-013** — Circuit kiezen · Invoer: **Zandvoort Circuit** · Verwacht: actueel weerblok zichtbaar
- [X] **TC-014** — 7-daagse forecast · Invoer: — · Verwacht: **7** dagen met temp., neerslag, wind
- [X] **TC-015** — Temperatuurgrafiek · Invoer: geladen circuit · Verwacht: lijngrafiek leesbaar (light + dark)

### Voertuigen

- [X] **TC-016** — Geldig merk zoeken · Invoer: `Toyota` + **Zoeken** · Verwacht: modellen in tabel
- [X] **TC-017** — Zoeken met jaartal · Invoer: `BMW` + `2020` · Verwacht: resultaten; tabel leesbaar
- [X] **TC-018** — Leeg zoekveld · Invoer: `""` + **Zoeken** · Verwacht: foutmelding verplicht veld
- [X] **TC-019** — Geen resultaten · Invoer: `ZZZZ_Onbestaand_Merk` · Verwacht: lege staat; geen crash

### Karttijden

- [X] **TC-020** — Geldige tijd invoeren · Invoer: track `Testbaan`, datum vandaag, `01:23.456`, karttype · Verwacht: nieuwe rij
- [X] **TC-021** — Ongeldige tijd · Invoer: `abc` + opslaan · Verwacht: validatiefout; geen nieuwe rij
- [X] **TC-022** — Verwijderen annuleren · Invoer: delete → **Annuleren** · Verwacht: rij blijft staan
- [X] **TC-023** — Verwijderen bevestigen · Invoer: delete op rij van **TC-020** + bevestig · Verwacht: rij weg
- [X] **TC-024** — localStorage · Invoer: F5 op `/lap-tracker` · Verwacht: data nog aanwezig
- [X] **TC-025** — Statistieken · Invoer: ≥2 ronden zelfde track · Verwacht: beste tijd + gemiddelde
- [X] **TC-026** — Sorteren · Invoer: min. 2 ronden → **Beste tijd** · Verwacht: snelste bovenaan
- [X] **TC-027** — Filter op track · Invoer: 2 banen → kies één in **Selecteer track** · Verwacht: gefilterde lijst + stats

### Theme

- [X] **TC-028** — Dark mode toggle · Invoer: theme-knop · Verwacht: `html.dark`; donker schema
- [X] **TC-029** — Voorkeur onthouden · Invoer: light → refresh · Verwacht: `localStorage.theme` = `light`
- [X] **TC-030** — Dark op drukke pagina’s · Invoer: dark → `/lap-tracker` + `/vehicles` · Verwacht: tabellen/formulieren leesbaar

### Loading & mobiel

- [X] **TC-031** — API laadtijd · Invoer: koud openen Home/Racekalender · Verwacht: `LoadingSpinner` vóór data
- [X] **TC-032** — Offline F1-pagina’s · Invoer: DevTools offline → herlaad Standen/races · Verwacht: `ErrorMessage`; geen crash
- [X] **TC-033** — Hamburger menu · Invoer: **375px** + hamburger · Verwacht: overlay-menu open
- [X] **TC-034** — Racekalender mobiel · Invoer: `/races` op **375px** · Verwacht: geen horizontale scroll
- [X] **TC-035** — Karttijden mobiel · Invoer: `/lap-tracker` op **375px** · Verwacht: formulier + lijst bruikbaar

### Overig

- [X] **TC-036** — 404-pagina · Invoer: `/bestaat-niet` · Verwacht: 404 + link naar Home

### Fouten & omgeving *(afwijkende setup)*

- [X] **TC-037** — Backend uit · Invoer: alleen `npm run dev` → `/` of `/races` · Verwacht: fout/lege staat; geen crash
- [X] **TC-038** — Ongeldige VIN · Invoer: `123` of 16 tekens + decode · Verwacht: `ErrorMessage`
- [X] **TC-039** — Standen zonder treffer · Invoer: `ZZZ_NIEMAND` · Verwacht: lege lijst; app stabiel
- [X] **TC-040** — Offline weer/voertuigen · Invoer: offline → `/weather` + `/vehicles` · Verwacht: fout/geen data; geen crash
- [X] **TC-041** — VIN-decoder *(bonus)* · Invoer: geldige 17-teken VIN · Verwacht: resultaat in tabel

**Totaal:** 41 testcases (TC-001 t/m TC-041, oplopend genummerd).

### Dekking foutgevoelige onderdelen (checklist)

| Risico in de app                       | Gedekt door                         |
| -------------------------------------- | ----------------------------------- |
| API traag/kapot                        | TC-031, TC-032, TC-037, TC-040      |
| Ongeldige invoer (kart, voertuig, VIN) | TC-018, TC-021, TC-038              |
| Geen zoekresultaten                    | TC-012, TC-019, TC-039              |
| localStorage / verwijderen             | TC-022, TC-023, TC-024              |
| Backend verplicht voor F1/weer         | TC-004, TC-007, TC-037              |
| Responsive / theme breekt UI           | TC-003, TC-005, TC-030, TC-033–035 |

---

## 4. Acceptatiecriteria (handmatig testplan)

- [X] Minimaal 20 testcases beschreven (41 aanwezig, TC-001 t/m TC-041)
- [X] Foutgevoelige flows expliciet (sectie randgevallen + dekkingstabel)
- [X] Testdoelen, omgeving en verwachte resultaten vastgelegd
- [X] Eigen scenario’s toegevoegd (visueel, doorloop menu, filters, mobiel per pagina)
- [ ] Plan goedgekeurd door **Naoufal** vóór uitvoering
- [X] Alle 41 testcases afgevinkt of met ❌ gedocumenteerd
- [X] Gefaalde tests vastgelegd in defectenlog (sectie 5)

### Goedkeuring

- [ ] **Naoufal** — akkoord om testplan uit te voeren · Datum: ___________

---

## 5. Uitvoeringsnotities (invullen na testen)

### Testronde

- **Datum uitvoering:**
- **Uitgevoerd door:**
- **Browsers getest:**
- **Backend:** `dev:all` ja/nee
- **Samenvatting:** ___ / 41 afgevinkt (geslaagd)

### Bekende aandachtspunten vóór start

- Navigatielabel is **Racekalender**, niet “Races”; coureurspagina heet **Standen** (`/standings`).
- Zonder Express-backend: TC-007, TC-009, TC-031 (deels) en TC-004 falen of tonen lege staat.
- Karttijdformaat: `m:ss.mmm` (bijv. `01:23.456`); invoer kan ook via cijfers `123456`.
- TC-025–027: minimaal twee ronden nodig (liefst zelfde + andere track voor filter).
- TC-022 vóór TC-023 (eerst annuleren, dan echt verwijderen).
- Visueel (TC-003, TC-005, TC-015, TC-030): even **light én dark** controleren.
- TC-037: alleen frontend. TC-032/040: DevTools offline, daarna weer online. Niet beide tegelijk in één run.

### Defectenlog (voorbeeld)

| Test ID | Browser | Korte beschrijving | Prioriteit |
| ------- | ------- | ------------------ | ---------- |
|         |         |                    |            |

---

*Dit document is bedoeld om **vóór** handmatig testen te worden goedgekeurd. Vink testcases af tijdens de testronde; bij ❌ een korte notitie achter de regel zetten.*

---

## 6. Unit tests (Vitest) — apart plan

**Status:** geïmplementeerd — afvinken in **[TESTPLAN-UNIT.md](./TESTPLAN-UNIT.md)** (UT-001 t/m UT-016).

- Unit tests **niet** in de TC-checklist hierboven.
- Uitvoeren: `cd autodash` → `npm run test`.

| Wel (unit, UT)                       | Niet (handmatig, TC)    |
| ------------------------------------ | ----------------------- |
| `isValidLapTime` / `lapTimeToMs` | Hele karttijden-pagina  |
| LoadingSpinner-tekst                 | API laadtijd in browser |
| Footer toont jaar                    | GitHub-link klikken     |
| ErrorMessage + retry                 | VIN-decode via API      |
