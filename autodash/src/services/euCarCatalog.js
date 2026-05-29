// EU/wereldwijd merk+model catalogus (fallback naast NHTSA VS-database).
// Bron: https://github.com/DanielKohut/car-data (MIT, community dataset)

const DEFAULT_YEARS = Array.from({ length: 11 }, (_, i) => 2015 + i)

const CATALOG_URL =
  'https://raw.githubusercontent.com/DanielKohut/car-data/main/car_data.json'

const MAKE_ALIASES = {
  citroen: 'Citroën',
  citroën: 'Citroën',
  peugeot: 'Peugeot',
  renault: 'Renault',
  dacia: 'Dacia',
  volkswagen: 'Volkswagen',
  vw: 'Volkswagen',
  mercedes: 'Mercedes-Benz',
  'mercedes-benz': 'Mercedes-Benz',
  bmw: 'BMW',
  audi: 'Audi',
  opel: 'Opel',
  fiat: 'Fiat',
  volvo: 'Volvo',
  seat: 'SEAT',
  skoda: 'Škoda',
  toyota: 'Toyota',
  ford: 'Ford',
  nissan: 'Nissan',
  hyundai: 'Hyundai',
  kia: 'Kia',
  mazda: 'Mazda',
  honda: 'Honda',
}

/** Minimale fallback als de catalogus-URL niet bereikbaar is. */
const FALLBACK_BRANDS = {
  Citroën: [
    'C1',
    'C3',
    'C3 Aircross',
    'C4',
    'C4 Cactus',
    'C4 X',
    'C5 Aircross',
    'C5 X',
    'Berlingo',
    'Spacetourer',
    'Jumpy',
  ],
  Peugeot: ['108', '208', '2008', '308', '3008', '408', '508', '5008', 'Rifter', 'Partner'],
  Renault: ['Clio', 'Captur', 'Megane', 'Arkana', 'Austral', 'Scenic', 'Espace', 'Kadjar', 'Twingo', 'Zoe'],
  Dacia: ['Sandero', 'Duster', 'Jogger', 'Spring', 'Logan'],
  Volkswagen: ['Polo', 'Golf', 'T-Roc', 'Tiguan', 'Passat', 'ID.3', 'ID.4', 'ID.5', 'Caddy'],
  Ford: ['Mustang', 'Focus', 'Fiesta', 'Explorer', 'F-150', 'Bronco', 'Escape', 'Edge', 'Ranger', 'Puma'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'CLA', 'GLB'],
  Toyota: ['Corolla', 'Camry', 'RAV4', 'Yaris', 'Prius', 'Highlander', 'C-HR', 'Aygo'],
  BMW: ['1 Series', '2 Series', '3 Series', 'X1', 'X3', 'X5', 'i4', 'iX'],
  Honda: ['Civic', 'Accord', 'CR-V', 'Jazz', 'HR-V'],
}

let catalogPromise = null
let catalogBrands = null

async function readBundledCatalogBrands() {
  if (typeof process === 'undefined' || !process.versions?.node) return null
  try {
    const { readFileSync, existsSync } = await import('node:fs')
    const { dirname, join } = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    const localPath = join(dirname(fileURLToPath(import.meta.url)), '../../data/car_data.json')
    if (!existsSync(localPath)) return null
    const data = JSON.parse(readFileSync(localPath, 'utf-8'))
    if (data?.brands && Object.keys(data.brands).length) return data.brands
  } catch {
    // bundled catalog unavailable
  }
  return null
}

/** Roep aan bij serverstart zodat de volledige catalogus direct klaarstaat. */
export async function preloadCatalogBrands() {
  return loadCatalogBrands()
}

function fixCatalogJson(raw) {
  return raw.replace(/(\])\s*(\n\s*"Casalini")/, '],$2')
}

async function loadCatalogBrands() {
  if (catalogBrands) return catalogBrands

  if (!catalogPromise) {
    catalogPromise = (async () => {
      const bundled = await readBundledCatalogBrands()
      if (bundled) {
        catalogBrands = bundled
        return bundled
      }

      try {
        const res = await fetch(CATALOG_URL)
        if (res.ok) {
          const data = JSON.parse(fixCatalogJson(await res.text()))
          if (data?.brands) {
            catalogBrands = data.brands
            return data.brands
          }
        }
      } catch {
        // remote catalog unavailable
      }

      catalogBrands = FALLBACK_BRANDS
      return FALLBACK_BRANDS
    })()
  }

  return catalogPromise
}

function normalizeKey(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export async function resolveCatalogMake(query) {
  const brands = await loadCatalogBrands()
  const key = normalizeKey(query)

  for (const brand of Object.keys(brands)) {
    if (normalizeKey(brand) === key) return brand
  }

  return MAKE_ALIASES[key] ?? null
}

export async function isCatalogBrand(make) {
  const brands = await loadCatalogBrands()
  return Object.prototype.hasOwnProperty.call(brands, make)
}

/** Merken waar de EU-catalogus betrouwbaarder is dan NHTSA (VS-database). */
export const EU_PRIMARY_BRANDS = new Set([
  'Citroën',
  'Peugeot',
  'Renault',
  'Dacia',
  'Opel',
  'SEAT',
  'Škoda',
])

export async function isEuPrimaryBrand(make) {
  const resolved = await resolveCatalogMake(make)
  return Boolean(resolved && EU_PRIMARY_BRANDS.has(resolved))
}

function slugify(value) {
  return normalizeKey(value).replace(/[^a-z0-9]+/g, '-')
}

export function buildCatalogRows(make, models, year, modelFilter = '') {
  const filter = modelFilter.trim().toLowerCase()
  const matchedModels = filter
    ? models.filter((model) => model.toLowerCase().includes(filter))
    : models

  if (!matchedModels.length) return []

  const years = year ? [Number(year)] : DEFAULT_YEARS

  return years.flatMap((y) =>
    matchedModels.map((model) => ({
      id: `catalog-${slugify(make)}-${slugify(model)}-${y}`,
      make,
      model,
      year: String(y),
      fuel: null,
      trim: null,
      bodyType: null,
      color: null,
      country: null,
      pk: null,
      source: 'catalog',
    }))
  )
}

export async function getCatalogRows(make, year, modelFilter = '') {
  const brands = await loadCatalogBrands()
  const brand = (await resolveCatalogMake(make)) ?? make
  const models = brands[brand]
  if (!models?.length) return []
  return buildCatalogRows(brand, models, year, modelFilter)
}

export async function searchCatalogByModel(modelQuery, year) {
  const brands = await loadCatalogBrands()
  const q = modelQuery.trim().toLowerCase()
  if (!q) return []

  const rows = []
  for (const [brand, models] of Object.entries(brands)) {
    const matching = models.filter((model) => model.toLowerCase().includes(q))
    if (matching.length) {
      rows.push(...buildCatalogRows(brand, matching, year))
    }
  }

  return rows
}
