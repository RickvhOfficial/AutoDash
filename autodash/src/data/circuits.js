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
]

export const CIRCUIT_COORDS_BY_KEY = {
  sakhir: { lat: 26.0325, lon: 50.5106 },
  jeddah: { lat: 21.6319, lon: 39.1044 },
  melbourne: { lat: -37.8497, lon: 144.968 },
  suzuka: { lat: 34.8431, lon: 136.541 },
  madring: { lat: 40.4534, lon: -3.6883 },
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
}

const CIRCUIT_KEY_ALIASES = {
  bahraininternationalcircuit: 'sakhir',
  circuitdemonaco: 'montecarlo',
  circuitdebarcelonacatalunya: 'catalunya',
  redbullring: 'spielberg',
  circuitgillesvilleneuve: 'montreal',
  bakucitycircuit: 'baku',
  maringabaystreetcircuit: 'singapore',
  circuitoftheamericas: 'austin',
  autodromohermanosrodriguez: 'mexicocity',
  lasvegasstripcircuit: 'lasvegas',
  yasmarina: 'yasmarinacircuit',
  abudhabi: 'yasmarinacircuit',
  saopaulo: 'interlagos',
  albertparkcircuit: 'melbourne',
  albertparkgrandprixcircuit: 'melbourne',
  japanesegrandprix: 'suzuka',
  madrid: 'madring',
  spanishgrandprix: 'catalunya',
  barcelonagrandprix: 'catalunya',
  austiangrandprix: 'spielberg',
  belgiangrandprix: 'spafrancorchamps',
  dutchgrandprix: 'zandvoort',
  italiangrandprix: 'monza',
  britishgrandprix: 'silverstone',
  canadiangrandprix: 'montreal',
  monacograndprix: 'montecarlo',
  hungariangrandprix: 'hungaroring',
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

    const circuit = circuits.find((entry) => {
      const nameKey = normalizeCircuitKey(entry.name)
      const placeKey = normalizeCircuitKey(entry.place)
      return normalized === nameKey || normalized === placeKey || normalized.includes(placeKey) || placeKey.includes(normalized)
    })
    if (circuit) return { lat: circuit.lat, lon: circuit.lon }
  }
  return null
}
