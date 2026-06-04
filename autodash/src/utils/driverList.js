import { enrichDriverNationality } from '../data/driverNationalities'

export function enrichDriverList(list) {
  return Array.isArray(list) ? list.map(enrichDriverNationality) : []
}
