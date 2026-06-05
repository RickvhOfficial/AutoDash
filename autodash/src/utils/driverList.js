import { enrichF1Driver } from '../data/f1Enrichment'
import { enrichDriverNationality } from '../data/driverNationalities'

export function enrichDriverList(list) {
  return Array.isArray(list)
    ? list.map((driver) => enrichF1Driver(enrichDriverNationality(driver)))
    : []
}
