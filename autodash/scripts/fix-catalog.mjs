import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '../data/car_data.json')

const response = await fetch(
  'https://raw.githubusercontent.com/DanielKohut/car-data/main/car_data.json'
)
const raw = await response.text()
const fixed = raw.replace(/(\])\s*(\n\s*"Casalini")/, '],$2')
const data = JSON.parse(fixed)
const brands = Object.keys(data.brands)

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8')
console.log(`Saved ${brands.length} brands to ${outPath}`)
console.log('Sample:', brands.slice(0, 5).join(', '))
