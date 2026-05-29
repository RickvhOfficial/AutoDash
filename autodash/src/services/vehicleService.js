// Voertuig-API's: NHTSA (VS) + EPA (brandstof/modellen VS) + catalogus (236+ merken) + DB.VIN (VIN).
import {
  getCatalogRows,
  resolveCatalogMake,
  searchCatalogByModel,
} from './euCarCatalog.js'

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles'
const DB_VIN_BASE = 'https://db.vin/api/v1/vin'
const EPA_BASE = 'https://fueleconomy.gov/ws/rest'
const FETCH_TIMEOUT_MS = 12_000
const EPA_FETCH_TIMEOUT_MS = 6_000
const EPA_CACHE_TTL_MS = 1000 * 60 * 60 * 6
const NHTSA_MAKES_CACHE_TTL_MS = 1000 * 60 * 60 * 24
const EPA_ENRICH_CONCURRENCY = 8

const epaCache = new Map()
let nhtsaMakesCache = null

/** NHTSA-merken die prioriteit krijgen bij model-only zoekacties. */
const NHTSA_MODEL_SEARCH_MAKES = [
  'FORD',
  'TOYOTA',
  'HONDA',
  'CHEVROLET',
  'NISSAN',
  'BMW',
  'MERCEDES-BENZ',
  'AUDI',
  'VOLKSWAGEN',
  'HYUNDAI',
  'KIA',
  'MAZDA',
  'SUBARU',
  'LEXUS',
  'JEEP',
  'RAM',
  'GMC',
  'DODGE',
  'CHRYSLER',
  'CADILLAC',
  'BUICK',
  'LINCOLN',
  'ACURA',
  'INFINITI',
  'VOLVO',
  'JAGUAR',
  'LAND ROVER',
  'PORSCHE',
  'MINI',
  'MITSUBISHI',
  'TESLA',
  'GENESIS',
]

const NHTSA_MAKE_ALIASES = {
  mercedes: 'MERCEDES-BENZ',
  'mercedes-benz': 'MERCEDES-BENZ',
  vw: 'VOLKSWAGEN',
  volkswagen: 'VOLKSWAGEN',
  chevy: 'CHEVROLET',
  chevrolet: 'CHEVROLET',
}

/** Fallback als GetAllMakes tijdelijk niet bereikbaar is (403/rate limit). */
const NHTSA_CANONICAL_MAKES = {
  ford: 'FORD',
  toyota: 'TOYOTA',
  mercedes: 'MERCEDES-BENZ',
  'mercedes-benz': 'MERCEDES-BENZ',
  honda: 'HONDA',
  chevrolet: 'CHEVROLET',
  chevy: 'CHEVROLET',
  nissan: 'NISSAN',
  bmw: 'BMW',
  audi: 'AUDI',
  volkswagen: 'VOLKSWAGEN',
  vw: 'VOLKSWAGEN',
  hyundai: 'HYUNDAI',
  kia: 'KIA',
  mazda: 'MAZDA',
  subaru: 'SUBARU',
  lexus: 'LEXUS',
  jeep: 'JEEP',
  dodge: 'DODGE',
  ram: 'RAM',
  gmc: 'GMC',
  volvo: 'VOLVO',
  porsche: 'PORSCHE',
  mini: 'MINI',
  mitsubishi: 'MITSUBISHI',
  tesla: 'TESLA',
}

/** NHTSA Make_Name → EPA make parameter voor fueleconomy.gov. */
const EPA_MAKE_NAMES = {
  'MERCEDES-BENZ': 'Mercedes-Benz',
  FORD: 'Ford',
  TOYOTA: 'Toyota',
  HONDA: 'Honda',
  CHEVROLET: 'Chevrolet',
  NISSAN: 'Nissan',
  BMW: 'BMW',
  AUDI: 'Audi',
  VOLKSWAGEN: 'Volkswagen',
  HYUNDAI: 'Hyundai',
  KIA: 'Kia',
  MAZDA: 'Mazda',
  SUBARU: 'Subaru',
  LEXUS: 'Lexus',
  JEEP: 'Jeep',
  RAM: 'Ram',
  GMC: 'GMC',
  DODGE: 'Dodge',
  CHRYSLER: 'Chrysler',
  CADILLAC: 'Cadillac',
  BUICK: 'Buick',
  LINCOLN: 'Lincoln',
  ACURA: 'Acura',
  INFINITI: 'Infiniti',
  VOLVO: 'Volvo',
  JAGUAR: 'Jaguar',
  'LAND ROVER': 'Land Rover',
  PORSCHE: 'Porsche',
  MINI: 'MINI',
  MITSUBISHI: 'Mitsubishi',
  TESLA: 'Tesla',
  GENESIS: 'Genesis',
}
export const DEFAULT_SEARCH_YEARS = Array.from({ length: 11 }, (_, i) => 2015 + i)

const FUEL_LABELS_NL = {
  gasoline: 'Benzine',
  petrol: 'Benzine',
  diesel: 'Diesel',
  electric: 'Elektrisch',
  hybrid: 'Hybride',
  'plug-in hybrid': 'Plug-in hybride',
  lpg: 'LPG',
  cng: 'CNG',
}

async function fetchWithTimeout(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'AutoDash/1.0 (vehicle-search)',
      },
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function getModelsByMake(make) {
  const encoded = encodeURIComponent(make.trim())
  const response = await fetch(`${NHTSA_BASE}/GetModelsForMake/${encoded}?format=json`)
  if (!response.ok) return []
  const data = await response.json()
  return data.Results ?? []
}

export async function getModelsByMakeAndYear(make, year) {
  const encoded = encodeURIComponent(make.trim())
  const response = await fetch(
    `${NHTSA_BASE}/GetModelsForMakeYear/make/${encoded}/modelyear/${year}?format=json`
  )
  if (!response.ok) return []
  const data = await response.json()
  return data.Results ?? []
}

export async function getModelsByMakeForYears(make, years = DEFAULT_SEARCH_YEARS) {
  const makeEntry = await resolveNhtsaMake(make)
  if (makeEntry) {
    return getModelsByMakeIdForYears(makeEntry.Make_ID, years, makeEntry.Make_Name)
  }
  const batches = await Promise.all(
    years.map(async (year) => {
      const models = await getModelsByMakeAndYear(make, year)
      return models.map((model) => ({ ...model, _year: year }))
    })
  )
  return batches.flat()
}

function normalizeMakeKey(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

async function getAllNhtsaMakes() {
  if (nhtsaMakesCache && Date.now() < nhtsaMakesCache.expires) {
    return nhtsaMakesCache.data
  }
  try {
    const response = await fetchWithTimeout(`${NHTSA_BASE}/GetAllMakes?format=json`)
    if (!response.ok) return nhtsaMakesCache?.data ?? []
    const data = await response.json()
    const makes = data.Results ?? []
    nhtsaMakesCache = { data: makes, expires: Date.now() + NHTSA_MAKES_CACHE_TTL_MS }
    return makes
  } catch {
    return nhtsaMakesCache?.data ?? []
  }
}

export async function resolveNhtsaMake(query) {
  const key = normalizeMakeKey(query)
  if (!key) return null

  const aliasTarget = NHTSA_MAKE_ALIASES[key]
  const makes = await getAllNhtsaMakes()

  if (makes.length) {
    for (const make of makes) {
      if (normalizeMakeKey(make.Make_Name) === key) return make
    }

    if (aliasTarget) {
      for (const make of makes) {
        if (make.Make_Name.toUpperCase() === aliasTarget) return make
      }
    }
  }

  const canonical = NHTSA_CANONICAL_MAKES[key]
  const candidates = [
    canonical,
    aliasTarget,
    query.trim().toUpperCase(),
    query.trim(),
  ].filter(Boolean)

  for (const name of [...new Set(candidates)]) {
    const probed = await probeNhtsaMake(name)
    if (probed) return probed
  }

  return null
}

async function probeNhtsaMake(makeName) {
  const probeYear = DEFAULT_SEARCH_YEARS[DEFAULT_SEARCH_YEARS.length - 1]
  const models = await getModelsByMakeAndYear(makeName, probeYear)
  if (!models.length) return null
  return {
    Make_ID: 0,
    Make_Name: models[0].Make_Name ?? makeName,
  }
}

async function getModelsByMakeIdAndYear(_makeId, year, makeName) {
  return getModelsByMakeAndYear(makeName, year)
}

async function getModelsByMakeIdForYears(_makeId, years = DEFAULT_SEARCH_YEARS, makeName) {
  const batches = await Promise.all(
    years.map(async (year) => {
      const models = await getModelsByMakeAndYear(makeName, year)
      return models.map((model) => ({ ...model, _year: year }))
    })
  )
  return batches.flat()
}

export function parseVehicleSearchQuery(query) {
  const trimmed = query.trim()
  if (!trimmed) return { makePart: '', modelPart: '' }
  const parts = trimmed.split(/\s+/)
  return {
    makePart: parts[0],
    modelPart: parts.slice(1).join(' '),
  }
}

function dedupeRows(rows) {
  const seenBase = new Set()
  const seenFull = new Set()

  return rows.filter((row) => {
    const baseKey = `${normalizeMakeKey(row.make ?? '')}|${row.model?.toLowerCase() ?? ''}|${row.year ?? ''}`
    const fullKey = `${baseKey}|${(row.trim ?? '').toLowerCase()}|${row.epaVehicleId ?? ''}|${row.source ?? ''}`

    if (row.trim || row.epaVehicleId) {
      if (seenFull.has(fullKey)) return false
      seenFull.add(fullKey)
      return true
    }

    if (seenBase.has(baseKey)) return false
    seenBase.add(baseKey)
    seenFull.add(fullKey)
    return true
  })
}

async function fetchEpaMakeRows(makePart, year, modelFilter = '') {
  const displayMake = (await resolveCatalogMake(makePart)) ?? makePart.trim()
  const nhtsaEntry = await resolveNhtsaMake(makePart)
  const epaMake = nhtsaEntry ? toEpaMakeName(nhtsaEntry.Make_Name) : displayMake
  if (!epaMake) return []

  const years = year ? [Number(year)] : DEFAULT_SEARCH_YEARS
  const rows = []

  await Promise.all(
    years.map(async (y) => {
      const models = await fetchEpaModelsForYearMake(epaMake, y)
      for (const modelName of models) {
        if (modelFilter && !modelName.toLowerCase().includes(modelFilter.toLowerCase())) continue
        rows.push({
          id: `epa-${normalizeMakeKey(displayMake)}-${normalizeMakeKey(modelName)}-${y}`,
          make: displayMake,
          model: modelName,
          year: String(y),
          fuel: inferFuelFromEpaModelName(modelName),
          trim: null,
          bodyType: null,
          color: null,
          country: null,
          pk: null,
          source: 'epa',
        })
      }
    })
  )

  return rows
}

async function mergeMakeResults(makePart, year, modelFilter = '') {
  const [nhtsaRows, epaRows, catalogRows] = await Promise.all([
    fetchNhtsaMakeRowsForQuery(makePart, year, modelFilter),
    fetchEpaMakeRows(makePart, year, modelFilter),
    fetchCatalogMakeRows(makePart, year, modelFilter),
  ])
  return dedupeRows([...nhtsaRows, ...epaRows, ...catalogRows])
}

function toEpaMakeName(nhtsaMakeName) {
  if (!nhtsaMakeName) return ''
  const upper = nhtsaMakeName.trim().toUpperCase()
  if (EPA_MAKE_NAMES[upper]) return EPA_MAKE_NAMES[upper]

  if (upper.includes('-')) {
    return upper
      .split('-')
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join('-')
  }

  return nhtsaMakeName
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function cacheGet(key) {
  const entry = epaCache.get(key)
  if (!entry || Date.now() > entry.expires) {
    epaCache.delete(key)
    return null
  }
  return entry.value
}

function cacheSet(key, value) {
  epaCache.set(key, { value, expires: Date.now() + EPA_CACHE_TTL_MS })
}

function parseEpaMenuItems(xml) {
  if (!xml) return []
  const items = []
  const re = /<menuItem>\s*<text>([^<]*)<\/text>\s*<value>([^<]*)<\/value>/gi
  let match = re.exec(xml)
  while (match) {
    items.push({ text: match[1].trim(), value: match[2].trim() })
    match = re.exec(xml)
  }
  return items
}

async function fetchEpaXml(path) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), EPA_FETCH_TIMEOUT_MS)
    try {
      const response = await fetch(`${EPA_BASE}${path}`, { signal: controller.signal })
      if (!response.ok) return null
      return await response.text()
    } finally {
      clearTimeout(timer)
    }
  } catch {
    return null
  }
}

function inferFuelFromEpaModelName(name) {
  const n = name.toLowerCase()
  if (n.includes('plug-in') || n.includes('plug in')) return 'Plug-in hybride'
  if (n.includes('hybrid') || n.startsWith('prius')) return 'Hybride'
  if (n.includes('electric') || n.includes(' ev') || n.includes(' i-ev')) return 'Elektrisch'
  if (n.includes('diesel') || n.includes('tdi') || n.includes('bluetec')) return 'Diesel'
  if (n.includes('ffv')) return 'Benzine/E85'
  if (n.includes('cng')) return 'Benzine/CNG'
  return 'Benzine'
}

function buildSpecsFromEpaNames(model, epaModels) {
  const matched = matchEpaModelNames(model, epaModels)
  if (!matched.length) return {}

  const fuels = [...new Set(matched.map(inferFuelFromEpaModelName))].sort()
  return { fuel: fuels.join(' / ') }
}

function matchEpaModelNames(nhtsaModel, epaModels) {
  const norm = nhtsaModel.trim().toLowerCase()
  const exact = epaModels.filter((name) => name.toLowerCase() === norm)
  if (exact.length) return exact

  return epaModels.filter((name) => {
    const epa = name.toLowerCase()
    return epa === norm || epa.startsWith(`${norm} `)
  })
}

async function fetchEpaModelsForYearMake(make, year) {
  const cacheKey = `epa-models:${year}:${make.toLowerCase()}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const xml = await fetchEpaXml(
    `/vehicle/menu/model?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}`
  )
  const models = parseEpaMenuItems(xml).map((item) => item.text)
  cacheSet(cacheKey, models)
  return models
}

async function fetchEpaOptionsForYearMakeModel(make, year, model) {
  const cacheKey = `epa-options:${year}:${make.toLowerCase()}:${model.toLowerCase()}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const xml = await fetchEpaXml(
    `/vehicle/menu/options?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
  )
  const options = parseEpaMenuItems(xml)
  cacheSet(cacheKey, options)
  return options
}

function decodeXmlEntities(text) {
  if (!text) return text
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function parseEpaXmlTag(xml, tag) {
  if (!xml) return null
  const re = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i')
  const match = xml.match(re)
  return match ? decodeXmlEntities(match[1].trim()) : null
}

function mapEpaFuelType(value) {
  if (!value) return null
  const v = value.toLowerCase()
  if (v.includes('electric')) return 'Elektrisch'
  if (v.includes('diesel')) return 'Diesel'
  if (v.includes('plug-in') || v.includes('plug in')) return 'Plug-in hybride'
  if (v.includes('hybrid')) return 'Hybride'
  if (v.includes('regular') || v.includes('premium') || v.includes('gasoline') || v === 'gas') {
    return 'Benzine'
  }
  return labelFuel(value)
}

function mapEpaBodyClass(value) {
  if (!value) return null
  const v = value.toLowerCase()
  if (v.includes('wagon') || v.includes('station')) return 'Wagon'
  if (v.includes('suv') || v.includes('sport utility')) return 'SUV'
  if (v.includes('pickup') || v.includes('truck')) return 'Pick-up'
  if (v.includes('van') || v.includes('minivan')) return 'Bus/Van'
  if (v.includes('convertible') || v.includes('cabrio')) return 'Cabrio'
  if (v.includes('coupe')) return 'Coupé'
  if (v.includes('car')) return 'Sedan'
  return value
}

function buildTrimFromEpaVehicle(xml) {
  const displ = parseEpaXmlTag(xml, 'displ')
  const cyl = parseEpaXmlTag(xml, 'cylinders')
  const parts = []
  if (cyl && displ) parts.push(`${cyl}-cylinder ${displ} L`)
  else if (displ) parts.push(`${displ} L`)
  else if (cyl) parts.push(`${cyl} cyl`)
  return parts.length ? parts.join(', ') : null
}

function mapEpaDrive(value) {
  if (!value) return null
  const v = value.toLowerCase()
  if (v.includes('all-wheel') || v.includes('awd')) return 'AWD'
  if (v.includes('4-wheel') || v.includes('4wd')) return '4WD'
  if (v.includes('front-wheel') || v.includes('fwd')) return 'Voorwiel'
  if (v.includes('rear-wheel') || v.includes('rwd')) return 'Achterwiel'
  if (v.includes('part-time')) return '4WD (deel)'
  return value
}

function mpgToL100km(mpg) {
  const n = Number(mpg)
  if (!n || n <= 0) return null
  return (235.214583 / n).toFixed(1)
}

function co2MiToGkm(co2) {
  const n = Number(co2)
  if (!n || n <= 0) return null
  return `${Math.round(n / 1.60934)} g/km`
}

function buildConsumptionFromEpa(xml, fuelRaw = '') {
  const fuel = (fuelRaw || parseEpaXmlTag(xml, 'fuelType') || '').toLowerCase()

  if (fuel.includes('electric')) {
    const range = Number(parseEpaXmlTag(xml, 'range'))
    const rangeCity = Number(parseEpaXmlTag(xml, 'rangeCity'))
    if (range > 0) return `~${Math.round(range * 1.60934)} km bereik`
    if (rangeCity > 0) return `~${Math.round(rangeCity * 1.60934)} km bereik (stad)`
    return null
  }

  const comb = mpgToL100km(parseEpaXmlTag(xml, 'comb08'))
  if (!comb) return null

  const city = mpgToL100km(parseEpaXmlTag(xml, 'city08'))
  const highway = mpgToL100km(parseEpaXmlTag(xml, 'highway08'))

  if (city && highway) {
    return `${comb} L/100km (stad ${city} · snelweg ${highway})`
  }

  return `${comb} L/100km`
}

function parseEpaVehicleXml(xml) {
  const fuelRaw = parseEpaXmlTag(xml, 'fuelType1') || parseEpaXmlTag(xml, 'fuelType')
  const displ = parseEpaXmlTag(xml, 'displ')
  const cyl = parseEpaXmlTag(xml, 'cylinders')
  const engDscr = parseEpaXmlTag(xml, 'eng_dscr')

  let trim = buildTrimFromEpaVehicle(xml)
  if (engDscr && trim && !trim.toLowerCase().includes(engDscr.toLowerCase())) {
    trim = `${trim}, ${engDscr}`
  } else if (engDscr && !trim) {
    trim = engDscr
  }

  return {
    fuel: mapEpaFuelType(fuelRaw),
    bodyType: mapEpaBodyClass(parseEpaXmlTag(xml, 'VClass')),
    trim,
    transmission: parseEpaXmlTag(xml, 'trany'),
    drive: mapEpaDrive(parseEpaXmlTag(xml, 'drive')),
    displacement: displ ? `${displ} L` : null,
    cylinders: cyl ?? null,
    consumption: buildConsumptionFromEpa(xml, fuelRaw),
    co2: co2MiToGkm(parseEpaXmlTag(xml, 'co2')),
  }
}

async function fetchEpaVehicleDetail(vehicleId) {
  const id = String(vehicleId).trim()
  if (!id) return null

  const cacheKey = `epa-vehicle:v2:${id}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const xml = await fetchEpaXml(`/vehicle/${encodeURIComponent(id)}`)
  if (!xml) return null

  const detail = parseEpaVehicleXml(xml)
  cacheSet(cacheKey, detail)
  return detail
}

async function runWithConcurrency(items, limit, fn) {
  if (!items.length) return []
  const results = new Array(items.length)
  let index = 0

  async function worker() {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await fn(items[current], current)
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

function inferSpecsFromModelName(modelName) {
  if (!modelName) return {}
  const n = modelName.toLowerCase()
  const specs = {}

  if (
    n.includes('tdi') ||
    n.includes('dci') ||
    n.includes('hdi') ||
    n.includes('jtdm') ||
    n.includes('bluetec') ||
    n.includes('cdti') ||
    n.includes('tdci')
  ) {
    specs.fuel = 'Diesel'
  } else if (
    n.includes('e-tron') ||
    n.includes(' electric') ||
    n.endsWith(' ev') ||
    n.includes(' i3') ||
    n.includes(' i4') ||
    n.includes(' i5') ||
    n.includes(' i7')
  ) {
    specs.fuel = 'Elektrisch'
  } else if (n.includes('hybrid') || n.includes('hybride') || n.includes(' phev')) {
    specs.fuel = 'Hybride'
  } else if (n.includes(' tsi') || n.includes(' tfsi') || n.includes(' gti') || n.includes(' ecoboost')) {
    specs.fuel = 'Benzine'
  }

  if (
    n.includes('wagon') ||
    n.includes('estate') ||
    n.includes(' sw') ||
    n.includes('tourer') ||
    n.includes(' combi') ||
    n.includes(' break')
  ) {
    specs.bodyType = 'Wagon'
  } else if (n.includes('suv') || n.includes(' cross') || n.includes(' xc')) {
    specs.bodyType = 'SUV'
  } else if (n.includes('cabrio') || n.includes('convertible') || n.includes(' spider')) {
    specs.bodyType = 'Cabrio'
  } else if (n.includes('coupe') || n.includes('coupé')) {
    specs.bodyType = 'Coupé'
  }

  const dispMatch = modelName.match(/\b(\d\.\d)\s*(?:L|l|TDI|TDCi|TSI|TFSI|HDi|dCi|i)?\b/i)
  if (dispMatch) specs.displacement = `${dispMatch[1]} L`

  const cylMatch = modelName.match(/\b(V6|V8|V12|I4|I6)\b/i)
  if (cylMatch) specs.cylinders = cylMatch[1].toUpperCase()

  return specs
}

async function resolveEpaModelName(epaMake, year, nhtsaModel) {
  const epaModels = await fetchEpaModelsForYearMake(epaMake, year)
  const matched = matchEpaModelNames(nhtsaModel, epaModels)
  return matched[0] ?? null
}

function mergeSpecs(base, extra) {
  const merged = { ...base }
  for (const [key, value] of Object.entries(extra)) {
    if (value != null && value !== '') merged[key] = value
  }
  return merged
}

async function enrichSingleRow(row) {
  if (row._enriched) {
    return { specsById: {}, variantsById: {} }
  }

  if (row.epaVehicleId) {
    const detail = await fetchEpaVehicleDetail(row.epaVehicleId)
    if (!detail) return { specsById: {}, variantsById: {} }
    return {
      specsById: {
        [row.id]: mergeSpecs(row, detail),
      },
      variantsById: {},
    }
  }

  const epaMake = toEpaMakeName(row.make)
  if (epaMake && row.year && row.model) {
    const epaModel = await resolveEpaModelName(epaMake, row.year, row.model)
    if (epaModel) {
      const options = await fetchEpaOptionsForYearMakeModel(epaMake, row.year, epaModel)
      if (options.length > 1) {
        const variants = await runWithConcurrency(options, EPA_ENRICH_CONCURRENCY, async (opt) => {
          const detail = (await fetchEpaVehicleDetail(opt.value)) ?? {}
          return mergeSpecs(
            {
              ...row,
              id: `${row.id}-v${opt.value}`,
              model: epaModel,
              trim: opt.text || detail.trim || null,
              epaVehicleId: opt.value,
              fuel: detail.fuel ?? inferFuelFromEpaModelName(opt.text),
              _enriched: true,
            },
            detail
          )
        })
        return { specsById: {}, variantsById: { [row.id]: variants } }
      }

      if (options.length === 1) {
        const detail = (await fetchEpaVehicleDetail(options[0].value)) ?? {}
        return {
          specsById: {
            [row.id]: mergeSpecs(
              {
                trim: options[0].text || detail.trim,
                fuel: detail.fuel ?? inferFuelFromEpaModelName(options[0].text),
                epaVehicleId: options[0].value,
              },
              detail
            ),
          },
          variantsById: {},
        }
      }

      const epaModels = await fetchEpaModelsForYearMake(epaMake, row.year)
      const fuelOnly = buildSpecsFromEpaNames(row.model, epaModels)
      if (fuelOnly.fuel) {
        return { specsById: { [row.id]: fuelOnly }, variantsById: {} }
      }
    }
  }

  const inferred = inferSpecsFromModelName(row.model)
  if (Object.keys(inferred).length) {
    return { specsById: { [row.id]: inferred }, variantsById: {} }
  }

  return { specsById: {}, variantsById: {} }
}

function buildNhtsaRows(make, year, results) {
  const expectedMake = normalizeMakeKey(make)
  const seen = new Set()
  return results
    .filter((model) => {
      if (expectedMake && normalizeMakeKey(model.Make_Name ?? '') !== expectedMake) return false
      const rowYear = model._year ?? year ?? 'all'
      const key = `${model.Model_ID}-${rowYear}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((model) => {
      const rowYear = model._year ?? year ?? null
      return {
        ...mapModelToRow(model, rowYear),
        id: `${model.Model_ID}-${rowYear ?? 'all'}`,
        source: 'nhtsa',
      }
    })
}

async function fetchNhtsaMakeRows(makeEntry, year) {
  const makeName = makeEntry.Make_Name
  try {
    const years = year ? [Number(year)] : DEFAULT_SEARCH_YEARS

    const yearlyBatches = await Promise.all(
      years.map(async (y) => {
        const models = await getModelsByMakeIdAndYear(makeEntry.Make_ID, y, makeName)
        return models.map((model) => ({ ...model, _year: y }))
      })
    )

    const allMakeModels = await getModelsByMake(makeName)
    const fromAllModels = years.flatMap((y) => allMakeModels.map((model) => ({ ...model, _year: y })))

    return buildNhtsaRows(makeName, year, [...yearlyBatches.flat(), ...fromAllModels])
  } catch {
    return []
  }
}

function filterRowsByModel(rows, modelFilter) {
  const filter = modelFilter.trim().toLowerCase()
  if (!filter) return rows
  return rows.filter((row) => row.model?.toLowerCase().includes(filter))
}

async function fetchCatalogMakeRows(make, year, modelFilter = '') {
  const catalogBrand = await resolveCatalogMake(make)
  if (!catalogBrand) return []
  return getCatalogRows(catalogBrand, year, modelFilter)
}

async function fetchNhtsaMakeRowsForQuery(make, year, modelFilter = '') {
  const makeEntry = await resolveNhtsaMake(make)
  if (!makeEntry) return []
  const rows = await fetchNhtsaMakeRows(makeEntry, year)
  return filterRowsByModel(rows, modelFilter)
}

async function searchNhtsaByModel(modelQuery, year) {
  const q = modelQuery.trim().toLowerCase()
  if (!q) return []

  const makes = await getAllNhtsaMakes()
  const prioritySet = new Set(NHTSA_MODEL_SEARCH_MAKES)
  let priorityMakes = makes.filter((make) => prioritySet.has(make.Make_Name.toUpperCase()))

  if (!priorityMakes.length) {
    priorityMakes = [...new Set(Object.values(NHTSA_CANONICAL_MAKES))].map((name) => ({
      Make_ID: 0,
      Make_Name: name,
    }))
  }

  const batches = await Promise.all(
    priorityMakes.map(async (makeEntry) => {
      try {
        const rows = await fetchNhtsaMakeRows(makeEntry, year)
        return filterRowsByModel(rows, q)
      } catch {
        return []
      }
    })
  )

  return dedupeRows(batches.flat())
}

async function searchByMakeOnly(makePart, year) {
  return mergeMakeResults(makePart, year, '')
}

async function searchByMakeAndModel(makePart, modelPart, year) {
  const merged = await mergeMakeResults(makePart, year, modelPart)
  if (merged.length) return merged

  const catalogFallback = await searchCatalogByModel(modelPart, year)
  if (catalogFallback.length) return catalogFallback

  return searchNhtsaByModel(modelPart, year)
}

async function searchByModelOnly(modelPart, year) {
  const catalogRows = await searchCatalogByModel(modelPart, year)
  const nhtsaRows = await searchNhtsaByModel(modelPart, year)
  return dedupeRows([...catalogRows, ...nhtsaRows])
}

export async function resolveVehicleSearch(query, year) {
  const trimmed = query.trim()
  if (!trimmed) throw new Error('Voer een merk of model in.')

  const { makePart, modelPart } = parseVehicleSearchQuery(trimmed)

  if (modelPart) {
    const rows = await searchByMakeAndModel(makePart, modelPart, year)
    if (rows.length) return rows
    throw new Error(
      `Geen modellen gevonden voor '${trimmed}'. Probeer een ander jaartal of een andere spelling.`
    )
  }

  const brandRows = await searchByMakeOnly(makePart, year)
  if (brandRows.length) return brandRows

  const modelRows = await searchByModelOnly(makePart, year)
  if (modelRows.length) return modelRows

  throw new Error(
    `Geen modellen gevonden voor '${trimmed}'. Probeer merk + model (bijv. Citroën cactus) of een ander jaartal.`
  )
}

export async function resolveMakeSearch(make, year, modelFilter = '') {
  const query = modelFilter.trim() ? `${make.trim()} ${modelFilter.trim()}` : make.trim()
  return resolveVehicleSearch(query, year)
}

export async function resolveMakeEnrichment(_make, rows) {
  if (!rows.length) return { specsById: {}, variantsById: {} }

  const enrichable = rows.filter(
    (row) => row.id && !row._enriched && row.source !== 'vin'
  )
  if (!enrichable.length) return { specsById: {}, variantsById: {} }

  const partials = await runWithConcurrency(
    enrichable,
    EPA_ENRICH_CONCURRENCY,
    enrichSingleRow
  )

  const specsById = {}
  const variantsById = {}

  for (const partial of partials) {
    Object.assign(specsById, partial.specsById)
    Object.assign(variantsById, partial.variantsById)
  }

  return { specsById, variantsById }
}

export async function searchVehicleModels(query, year) {
  const params = new URLSearchParams({ q: query.trim() })
  if (year) params.set('year', String(year))
  const response = await fetch(`/api/models-by-make?${params}`)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || 'Voertuigdata kon niet worden geladen.')
  }
  return data
}

export async function searchModelsByMake(make, year, modelFilter = '') {
  const query = modelFilter.trim() ? `${make.trim()} ${modelFilter.trim()}` : make.trim()
  return searchVehicleModels(query, year)
}

export async function enrichModelsByMake(_make, rows) {
  const response = await fetch('/api/models-enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rows: rows.map((row) => ({
        id: row.id,
        year: row.year,
        model: row.model,
        make: row.make,
        source: row.source,
        fuel: row.fuel,
        trim: row.trim,
        bodyType: row.bodyType,
        epaVehicleId: row.epaVehicleId,
        _enriched: row._enriched,
      })),
    }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || 'Specs konden niet worden geladen.')
  }
  return data
}

export function applyEnrichment(rows, enrichment) {
  if (!enrichment) return rows

  const legacySpecsByKey =
    enrichment.specsById || enrichment.variantsById ? null : enrichment

  const specsById = enrichment.specsById ?? {}
  const variantsById = enrichment.variantsById ?? {}

  const result = []
  for (const row of rows) {
    if (variantsById[row.id]) {
      result.push(...variantsById[row.id])
      continue
    }

    const specs =
      specsById[row.id] ??
      (legacySpecsByKey ? legacySpecsByKey[`${row.year}|${row.model}`] : null)

    if (specs) {
      result.push({ ...row, ...specs, _enriched: true })
    } else {
      result.push(row)
    }
  }
  return result
}

function getVinVariable(results, variable) {
  const entry = results.find((r) => r.Variable === variable)
  const value = entry?.Value
  if (value == null || value === '') return null
  return String(value)
}

export function normalizeVinInput(vin) {
  return vin.trim().toUpperCase().replace(/[\s-]/g, '')
}

export function validateVinFormat(vin) {
  const normalized = normalizeVinInput(vin)
  if (!normalized) throw new Error('Voer een VIN in.')
  if (normalized.length !== 17) {
    throw new Error(
      `Een VIN bestaat uit exact 17 tekens (nu ${normalized.length}). Controleer of je het volledige nummer hebt.`
    )
  }
  if (/[IOQ]/.test(normalized)) {
    throw new Error('Een VIN bevat nooit de letters I, O of Q — controleer je invoer.')
  }
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(normalized)) {
    throw new Error(
      'Het VIN bevat ongeldige tekens. Gebruik alleen letters (A–Z, behalve I, O, Q) en cijfers.'
    )
  }
  return normalized
}

function labelFuel(value) {
  if (!value) return null
  const key = value.trim().toLowerCase()
  return FUEL_LABELS_NL[key] ?? value
}

function emptyVehicleRow(overrides = {}) {
  return {
    make: null,
    model: null,
    year: null,
    fuel: null,
    trim: null,
    bodyType: null,
    transmission: null,
    drive: null,
    displacement: null,
    cylinders: null,
    consumption: null,
    co2: null,
    color: null,
    country: null,
    pk: null,
    ...overrides,
  }
}

function mapNhtsaVinResults(results) {
  const errorCode = getVinVariable(results, 'Error Code')
  const displacement = getVinVariable(results, 'Displacement (L)')
  const engineModel = getVinVariable(results, 'Engine Model')
  const fuelRaw = getVinVariable(results, 'Fuel Type - Primary')
  const trimRaw = getVinVariable(results, 'Trim')

  const row = emptyVehicleRow({
    make: getVinVariable(results, 'Make'),
    model: getVinVariable(results, 'Model'),
    year: getVinVariable(results, 'Model Year'),
    trim: trimRaw ?? engineModel ?? (displacement ? `${displacement} L` : null),
    fuel: labelFuel(fuelRaw),
    bodyType: getVinVariable(results, 'Body Class'),
    transmission: getVinVariable(results, 'Transmission Style'),
    drive: getVinVariable(results, 'Drive Type'),
    displacement: displacement ? `${displacement} L` : null,
    cylinders: getVinVariable(results, 'Engine Number of Cylinders'),
    pk: getVinVariable(results, 'Engine Brake (hp) From'),
  })

  const hasData = row.make || row.model || row.year
  if (!hasData) return null

  return {
    row,
    clean: !errorCode || errorCode === '0',
  }
}

async function fetchNhtsaVinRow(normalized) {
  try {
    const encoded = encodeURIComponent(normalized)
    const response = await fetchWithTimeout(`${NHTSA_BASE}/DecodeVin/${encoded}?format=json`)
    if (!response.ok) return null
    const data = await response.json()
    return mapNhtsaVinResults(data.Results ?? [])
  } catch {
    return null
  }
}

function mapDbVinToRow(data) {
  if (!data?.brand && !data?.model) return null

  return emptyVehicleRow({
    make: data.brand ?? null,
    model: data.model ?? null,
    year: data.year != null ? String(data.year) : null,
    fuel: labelFuel(data.fuelType),
    trim: data.version ?? null,
    bodyType: data.bodyType ?? null,
    transmission: data.transmission ?? null,
    drive: data.driveType ?? data.drive ?? null,
    displacement: data.engineCapacity ?? data.displacement ?? null,
    cylinders: data.cylinders != null ? String(data.cylinders) : null,
    consumption: data.consumption ?? data.fuelConsumption ?? null,
    co2: data.co2Emission ?? data.co2 ?? null,
    color: data.color ?? null,
    country: data.registrationCountry ?? null,
    pk: data.power ?? data.horsepower ?? null,
  })
}

async function fetchDbVinRow(normalized) {
  try {
    const response = await fetchWithTimeout(`${DB_VIN_BASE}/${encodeURIComponent(normalized)}`)
    if (!response.ok) return null
    const data = await response.json()
    return mapDbVinToRow(data)
  } catch {
    return null
  }
}

async function fetchWmiFallback(normalized) {
  try {
    const wmi = normalized.slice(0, 3)
    const response = await fetchWithTimeout(`${NHTSA_BASE}/DecodeWMI/${encodeURIComponent(wmi)}?format=json`)
    if (!response.ok) return null
    const data = await response.json()
    const entry = data.Results?.[0]
    if (!entry) return null
    return emptyVehicleRow({
      make: entry.Make ?? entry.CommonName ?? null,
      bodyType: entry.VehicleType ?? null,
    })
  } catch {
    return null
  }
}

function mergeFields(primary, secondary) {
  if (!primary) return secondary
  if (!secondary) return primary

  return emptyVehicleRow({
    make: primary.make ?? secondary.make,
    model: primary.model ?? secondary.model,
    year: primary.year ?? secondary.year,
    fuel: primary.fuel ?? secondary.fuel,
    trim: primary.trim ?? secondary.trim,
    bodyType: primary.bodyType ?? secondary.bodyType,
    transmission: primary.transmission ?? secondary.transmission,
    drive: primary.drive ?? secondary.drive,
    displacement: primary.displacement ?? secondary.displacement,
    cylinders: primary.cylinders ?? secondary.cylinders,
    consumption: primary.consumption ?? secondary.consumption,
    co2: primary.co2 ?? secondary.co2,
    color: primary.color ?? secondary.color,
    country: primary.country ?? secondary.country,
    pk: primary.pk ?? secondary.pk,
  })
}

export async function resolveVinDecode(vin) {
  const normalized = validateVinFormat(vin)

  const [dbRow, nhtsaResult] = await Promise.all([
    fetchDbVinRow(normalized),
    fetchNhtsaVinRow(normalized),
  ])

  const nhtsaRow = nhtsaResult?.row ?? null
  const nhtsaClean = nhtsaResult?.clean ?? false

  let merged = null

  if (nhtsaClean && nhtsaRow) {
    merged = mergeFields(nhtsaRow, dbRow)
  } else if (dbRow) {
    merged = mergeFields(dbRow, nhtsaRow)
  } else if (nhtsaRow) {
    merged = nhtsaRow
  }

  if (!merged?.make && !merged?.model) {
    merged = mergeFields(merged, await fetchWmiFallback(normalized))
  }

  if (!merged?.make && !merged?.model) {
    throw new Error(
      'Geen voertuigdata gevonden voor dit VIN. Controleer of het nummer correct is ingevuld.'
    )
  }

  return {
    id: `vin-${Date.now()}`,
    ...merged,
  }
}

export async function decodeVin(vin) {
  const normalized = validateVinFormat(vin)
  const response = await fetch(`/api/vin-decode?vin=${encodeURIComponent(normalized)}`)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || 'VIN kon niet worden gedecodeerd.')
  }
  return data
}

export function mapModelToRow(model, yearFilter) {
  return {
    id: `${model.Model_ID}-${yearFilter ?? 'all'}`,
    ...emptyVehicleRow({
      make: model.Make_Name,
      model: model.Model_Name,
      year: yearFilter || null,
    }),
  }
}

export const VEHICLE_TABLE_COLUMNS = [
  { key: 'make', label: 'Merk', always: true },
  { key: 'model', label: 'Model', always: true },
  { key: 'trim', label: 'Uitvoering' },
  { key: 'year', label: 'Jaar', always: true },
  { key: 'fuel', label: 'Brandstof' },
  { key: 'bodyType', label: 'Carrosserie' },
  { key: 'transmission', label: 'Transmissie' },
  { key: 'drive', label: 'Aandrijving' },
  { key: 'displacement', label: 'Cilinderinhoud' },
  { key: 'cylinders', label: 'Cilinders' },
  { key: 'consumption', label: 'Verbruik' },
  { key: 'co2', label: 'CO₂' },
  { key: 'pk', label: 'PK' },
  { key: 'color', label: 'Kleur' },
  { key: 'country', label: 'Land' },
]

const BASE_COLUMN_KEYS = ['make', 'model', 'trim', 'year', 'fuel']

export const VEHICLE_BASE_COLUMNS = BASE_COLUMN_KEYS.map((key) =>
  VEHICLE_TABLE_COLUMNS.find((col) => col.key === key)
).filter(Boolean)

export const VEHICLE_DETAIL_COLUMNS = VEHICLE_TABLE_COLUMNS.filter(
  (col) => !col.always && col.key !== 'fuel' && col.key !== 'trim'
)

export function getRowDetailEntries(row) {
  return VEHICLE_DETAIL_COLUMNS.filter(
    (col) => row[col.key] != null && row[col.key] !== ''
  )
}

export function getVisibleColumns(rows) {
  return VEHICLE_TABLE_COLUMNS.filter((col) => {
    if (col.always) return true
    return rows.some((row) => row[col.key] != null && row[col.key] !== '')
  })
}

function displayValue(value) {
  return value != null && value !== '' ? value : '—'
}

export { displayValue }
