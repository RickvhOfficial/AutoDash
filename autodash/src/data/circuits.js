/** F1-circuits voor weer: officiële naam, land, herkenbare plaats/stad, coördinaten. */
export const circuits = [
  { name: 'Bahrain International Circuit', country: 'Bahrain', place: 'Sakhir', lat: 26.032, lon: 50.511 },
  { name: 'Jeddah Corniche Circuit', country: 'Saudi-Arabië', place: 'Jeddah', lat: 21.6319, lon: 39.1044 },
  { name: 'Albert Park Circuit', country: 'Australië', place: 'Melbourne', lat: -37.8497, lon: 144.968 },
  { name: 'Baku City Circuit', country: 'Azerbeidzjan', place: 'Bakoe', lat: 40.3729, lon: 49.8533 },
  { name: 'Shanghai International Circuit', country: 'China', place: 'Shanghai', lat: 31.3389, lon: 121.2197 },
  { name: 'Miami International Autodrome', country: 'VS', place: 'Miami', lat: 25.9581, lon: -80.2389 },
  { name: 'Autodromo Enzo e Dino Ferrari', country: 'Italië', place: 'Imola', lat: 44.3439, lon: 11.7167 },
  { name: 'Circuit Gilles Villeneuve', country: 'Canada', place: 'Montreal', lat: 45.5017, lon: -73.5223 },
  { name: 'Suzuka Circuit', country: 'Japan', place: 'Suzuka', lat: 34.8431, lon: 136.541 },
  { name: 'Circuit de Monaco', country: 'Monaco', place: 'Monte Carlo', lat: 43.7347, lon: 7.4205 },
  { name: 'Circuit de Barcelona-Catalunya', country: 'Spanje', place: 'Barcelona', lat: 41.57, lon: 2.261 },
  { name: 'Red Bull Ring', country: 'Oostenrijk', place: 'Spielberg', lat: 47.2197, lon: 14.7647 },
  { name: 'Silverstone Circuit', country: 'Groot-Brittannië', place: 'Silverstone', lat: 52.0786, lon: -1.0169 },
  { name: 'Hungaroring', country: 'Hongarije', place: 'Boedapest', lat: 47.5789, lon: 19.2486 },
  { name: 'Spa-Francorchamps', country: 'België', place: 'Spa', lat: 50.4372, lon: 5.9714 },
  { name: 'Monza Circuit', country: 'Italië', place: 'Monza', lat: 45.6156, lon: 9.2811 },
  { name: 'Marina Bay Street Circuit', country: 'Singapore', place: 'Singapore', lat: 1.2914, lon: 103.8644 },
  { name: 'Lusail International Circuit', country: 'Qatar', place: 'Lusail', lat: 25.49, lon: 51.4542 },
  { name: 'Circuit of the Americas', country: 'VS', place: 'Austin', lat: 30.1328, lon: -97.6411 },
  { name: 'Autodromo Hermanos Rodriguez', country: 'Mexico', place: 'Mexico-Stad', lat: 19.4042, lon: -99.0907 },
  { name: 'Las Vegas Strip Circuit', country: 'VS', place: 'Las Vegas', lat: 36.1147, lon: -115.1728 },
  { name: 'Interlagos Circuit', country: 'Brazilië', place: 'São Paulo', lat: -23.7036, lon: -46.6997 },
  { name: 'Yas Marina Circuit', country: 'VAE', place: 'Abu Dhabi', lat: 24.4672, lon: 54.6031 },
  { name: 'Zandvoort Circuit', country: 'Nederland', place: 'Zandvoort', lat: 52.3888, lon: 4.5409 },
  { name: 'Madring', country: 'Spanje', place: 'Madrid', lat: 40.4653, lon: -3.6153 },
]

export const CIRCUIT_COORDS_BY_KEY = {
  sakhir: { lat: 26.0325, lon: 50.5106 },
  jeddah: { lat: 21.6319, lon: 39.1044 },
  melbourne: { lat: -37.8497, lon: 144.968 },
  suzuka: { lat: 34.8431, lon: 136.541 },
  shanghai: { lat: 31.3389, lon: 121.2197 },
  miami: { lat: 25.9581, lon: -80.2389 },
  imola: { lat: 44.3439, lon: 11.7167 },
  montecarlo: { lat: 43.7347, lon: 7.4206 },
  catalunya: { lat: 41.57, lon: 2.2611 },
  montreal: { lat: 45.5006, lon: -73.5228 },
  spielberg: { lat: 47.2197, lon: 14.7647 },
  silverstone: { lat: 52.0786, lon: -1.0169 },
  hungaroring: { lat: 47.5789, lon: 19.2486 },
  spafrancorchamps: { lat: 50.4372, lon: 5.9714 },
  zandvoort: { lat: 52.3888, lon: 4.5409 },
  monza: { lat: 45.6156, lon: 9.2811 },
  baku: { lat: 40.3725, lon: 49.8533 },
  singapore: { lat: 1.2914, lon: 103.8644 },
  austin: { lat: 30.1328, lon: -97.6411 },
  mexicocity: { lat: 19.4042, lon: -99.0907 },
  interlagos: { lat: -23.7036, lon: -46.6997 },
  lasvegas: { lat: 36.1147, lon: -115.1728 },
  lusail: { lat: 25.49, lon: 51.4542 },
  yasmarinacircuit: { lat: 24.4672, lon: 54.6031 },
  madring: { lat: 40.4653, lon: -3.6153 },
}

const CIRCUIT_KEY_ALIASES = {
  bahraininternationalcircuit: 'sakhir',
  albertparkcircuit: 'melbourne',
  albertparkgrandprixcircuit: 'melbourne',
  shanghaiinternationalcircuit: 'shanghai',
  suzukacircuit: 'suzuka',
  miamiinternationalautodrome: 'miami',
  autodromoenzoedinodferrari: 'imola',
  circuitdemonaco: 'montecarlo',
  montecarlo: 'montecarlo',
  circuitdebarcelonacatalunya: 'catalunya',
  redbullring: 'spielberg',
  circuitgillesvilleneuve: 'montreal',
  silverstonecircuit: 'silverstone',
  circuitdespafrancorchamps: 'spafrancorchamps',
  spafrancorchamps: 'spafrancorchamps',
  circuitparkzandvoort: 'zandvoort',
  zandvoortcircuit: 'zandvoort',
  autodromonazionaledimonza: 'monza',
  monzacircuit: 'monza',
  madring: 'madring',
  bakucitycircuit: 'baku',
  marinabaystreetcircuit: 'singapore',
  maringabaystreetcircuit: 'singapore',
  circuitoftheamericas: 'austin',
  autodromohermanosrodriguez: 'mexicocity',
  autodromojosecarlospace: 'interlagos',
  interlagoscircuit: 'interlagos',
  lasvegasstripcircuit: 'lasvegas',
  lasvegasstripstreetcircuit: 'lasvegas',
  losailinternationalcircuit: 'lusail',
  jeddahcornichecircuit: 'jeddah',
  yasmarinacircuit: 'yasmarinacircuit',
  yasmarina: 'yasmarinacircuit',
  abudhabi: 'yasmarinacircuit',
  saopaulo: 'interlagos',
  bakoe: 'baku',
  boedapest: 'hungaroring',
  barcelona: 'catalunya',
  madrid: 'madring',
  mexicostad: 'mexicocity',
  spa: 'spafrancorchamps',
}

/** Bekende F1-roepnamen per circuit (canonical id). */
const CIRCUIT_ROEPNAAM_BY_ID = {
  sakhir: 'Sakhir',
  jeddah: 'Jeddah',
  melbourne: 'Melbourne',
  shanghai: 'Shanghai',
  suzuka: 'Suzuka',
  miami: 'Miami',
  imola: 'Imola',
  montecarlo: 'Monaco',
  catalunya: 'Barcelona',
  montreal: 'Montreal',
  spielberg: 'Spielberg',
  silverstone: 'Silverstone',
  hungaroring: 'Boedapest',
  spafrancorchamps: 'Spa',
  zandvoort: 'Zandvoort',
  monza: 'Monza',
  madring: 'Madrid',
  baku: 'Bakoe',
  singapore: 'Singapore',
  austin: 'Austin',
  mexicocity: 'Mexico-Stad',
  interlagos: 'São Paulo',
  lasvegas: 'Las Vegas',
  lusail: 'Lusail',
  yasmarinacircuit: 'Abu Dhabi',
}

const F1_COUNTRY_NL = {
  australia: 'Australië',
  bahrain: 'Bahrein',
  azerbaijan: 'Azerbeidzjan',
  austria: 'Oostenrijk',
  belgium: 'België',
  brazil: 'Brazilië',
  canada: 'Canada',
  china: 'China',
  hungary: 'Hongarije',
  italy: 'Italië',
  japan: 'Japan',
  mexico: 'Mexico',
  monaco: 'Monaco',
  netherlands: 'Nederland',
  qatar: 'Qatar',
  'saudi-arabie': 'Saudi-Arabië',
  saudiarabia: 'Saudi-Arabië',
  singapore: 'Singapore',
  spain: 'Spanje',
  uae: 'Verenigde Arabische Emiraten',
  uk: 'Groot-Brittannië',
  usa: 'Verenigde Staten',
  unitedarabemirates: 'Verenigde Arabische Emiraten',
  unitedkingdom: 'Groot-Brittannië',
  unitedstates: 'Verenigde Staten',
  vae: 'Verenigde Arabische Emiraten',
  vs: 'Verenigde Staten',
}

function normalizeCountryKey(country) {
  return String(country || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function countryNameToNl(country) {
  const key = normalizeCountryKey(country)
  if (!key) return 'Onbekend land'
  return F1_COUNTRY_NL[key] || country
}

export function circuitRoepnaam(id, fallback = '') {
  if (id && CIRCUIT_ROEPNAAM_BY_ID[id]) return CIRCUIT_ROEPNAAM_BY_ID[id]
  const trimmed = String(fallback || '').trim()
  if (!trimmed) return 'Circuit onbekend'
  return trimmed
}

export function formatCircuitWeatherLabel(roepnaam, country) {
  return `${roepnaam} (${countryNameToNl(country)})`
}

function buildCircuitOption({ id, roepnaam, country, lat, lon, dateStart }) {
  const countryNl = countryNameToNl(country)
  return {
    id,
    roepnaam,
    country: countryNl,
    label: formatCircuitWeatherLabel(roepnaam, country),
    lat,
    lon,
    dateStart,
  }
}

export function normalizeCircuitKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function resolveCircuitCoords(...keys) {
  for (const key of keys) {
    const normalized = normalizeCircuitKey(key)
    if (!normalized) continue
    const canonical = CIRCUIT_KEY_ALIASES[normalized] || normalized
    const direct = CIRCUIT_COORDS_BY_KEY[canonical]
    if (direct) return direct
  }
  return null
}

function coordsFromLatLon(lat, lon) {
  const latNum = Number(lat)
  const lonNum = Number(lon)
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return null
  return { lat: latNum, lon: lonNum }
}

/** Coördinaten uit race-snapshot (OpenF1/Ergast) of statische lookup. */
export function resolveCircuitCoordsFromRace(race) {
  const fromApi = coordsFromLatLon(race?.latitude, race?.longitude)
  if (fromApi) return fromApi
  return resolveCircuitCoords(
    race?.circuit_short_name,
    race?.circuitName,
    race?.meetingName,
    race?.location
  )
}

export function canonicalCircuitId(...keys) {
  for (const key of keys) {
    const normalized = normalizeCircuitKey(key)
    if (!normalized) continue
    return CIRCUIT_KEY_ALIASES[normalized] || normalized
  }
  return ''
}

export function circuitIdFromRace(race) {
  return canonicalCircuitId(
    race?.circuit_short_name,
    race?.circuitName,
    race?.meetingName,
    race?.location
  )
}

function circuitOptionFromStatic(circuit) {
  const id = canonicalCircuitId(circuit.place, circuit.name)
  const roepnaam = circuitRoepnaam(id, circuit.place)
  return buildCircuitOption({
    id,
    roepnaam,
    country: circuit.country,
    lat: circuit.lat,
    lon: circuit.lon,
    dateStart: null,
  })
}

/** Dropdown-opties: seizoenskalender + statische circuits die nog ontbreken. */
export function buildCircuitWeatherOptions(races) {
  const unique = new Map()

  if (Array.isArray(races)) {
    for (const race of races) {
      const coords = resolveCircuitCoordsFromRace(race)
      if (!coords) continue

      const id = circuitIdFromRace(race)
      if (!id || unique.has(id)) continue

      const roepnaam = circuitRoepnaam(
        id,
        race?.circuit_short_name || race?.location || race?.circuitName
      )
      unique.set(
        id,
        buildCircuitOption({
          id,
          roepnaam,
          country: race?.countryName || 'Land onbekend',
          lat: coords.lat,
          lon: coords.lon,
          dateStart: race?.dateStart || null,
        })
      )
    }
  }

  for (const circuit of circuits) {
    const id = canonicalCircuitId(circuit.place, circuit.name)
    if (!id || unique.has(id)) continue
    unique.set(id, circuitOptionFromStatic(circuit))
  }

  return [...unique.values()].sort((a, b) => {
    const aTime = a.dateStart ? new Date(a.dateStart).getTime() : Number.POSITIVE_INFINITY
    const bTime = b.dateStart ? new Date(b.dateStart).getTime() : Number.POSITIVE_INFINITY
    if (aTime !== bTime) return aTime - bTime
    return a.roepnaam.localeCompare(b.roepnaam, 'nl')
  })
}
