// Nationaliteit per coureur-acroniem (stabiel over seizoenen; startnummers wisselen wel).
// OpenF1 levert meestal country_code=null — daarom geen mapping op driver_number.

const ACRONYM_FLAG_CODES = {
  ALO: 'es',
  ANT: 'it',
  BEA: 'gb',
  BOR: 'br',
  BOT: 'fi',
  COL: 'ar',
  DEV: 'nl',
  GAS: 'fr',
  HAD: 'fr',
  HAM: 'gb',
  HUL: 'de',
  LAW: 'gb',
  LEC: 'mc',
  LIN: 'gb',
  NOR: 'gb',
  OCO: 'fr',
  PER: 'mx',
  PIA: 'au',
  RIC: 'au',
  RUS: 'gb',
  SAI: 'es',
  STR: 'ca',
  TSU: 'jp',
  VER: 'nl',
  ALB: 'th',
  ZHO: 'cn',
}

const ISO3_FLAG_CODES = {
  NED: 'nl',
  GBR: 'gb',
  MON: 'mc',
  FRA: 'fr',
  ITA: 'it',
  ESP: 'es',
  MEX: 'mx',
  CAN: 'ca',
  THA: 'th',
  DEU: 'de',
  GER: 'de',
  NZL: 'nz',
  ARG: 'ar',
  FIN: 'fi',
  AUS: 'au',
  BRA: 'br',
  JPN: 'jp',
  CHN: 'cn',
}

const ACRONYM_ISO3 = {
  ALO: 'ESP',
  ANT: 'ITA',
  BEA: 'GBR',
  BOR: 'BRA',
  BOT: 'FIN',
  COL: 'ARG',
  GAS: 'FRA',
  HAD: 'FRA',
  HAM: 'GBR',
  HUL: 'DEU',
  LAW: 'GBR',
  LEC: 'MON',
  LIN: 'GBR',
  NOR: 'GBR',
  OCO: 'FRA',
  PER: 'MEX',
  PIA: 'AUS',
  RUS: 'GBR',
  SAI: 'ESP',
  STR: 'CAN',
  TSU: 'JPN',
  VER: 'NED',
  ALB: 'THA',
  ZHO: 'CHN',
}

const FLAG_CODE_LABELS = {
  nl: 'Nederland',
  gb: 'Verenigd Koninkrijk',
  mc: 'Monaco',
  fr: 'Frankrijk',
  it: 'Italië',
  es: 'Spanje',
  mx: 'Mexico',
  ca: 'Canada',
  th: 'Thailand',
  de: 'Duitsland',
  nz: 'Nieuw-Zeeland',
  ar: 'Argentinië',
  fi: 'Finland',
  au: 'Australië',
  br: 'Brazilië',
  jp: 'Japan',
  cn: 'China',
}

const ISO3_LABELS = {
  NED: 'Nederland',
  GBR: 'Verenigd Koninkrijk',
  MON: 'Monaco',
  FRA: 'Frankrijk',
  ITA: 'Italië',
  ESP: 'Spanje',
  MEX: 'Mexico',
  CAN: 'Canada',
  THA: 'Thailand',
  DEU: 'Duitsland',
  NZL: 'Nieuw-Zeeland',
  ARG: 'Argentinië',
  FIN: 'Finland',
  AUS: 'Australië',
  BRA: 'Brazilië',
  JPN: 'Japan',
  CHN: 'China',
}

function normalizeAcronym(acronym) {
  return acronym?.trim?.().toUpperCase() ?? ''
}

/** @param {{ country_code?: string, name_acronym?: string } | null | undefined} driver */
export function resolveDriverFlagCode(driver) {
  if (!driver) return ''

  // Acroniem eerst: cache/API country_code kan verouderd zijn (bv. #1 = NED na nummerwissel).
  const acronym = normalizeAcronym(driver.name_acronym)
  if (acronym && ACRONYM_FLAG_CODES[acronym]) {
    return ACRONYM_FLAG_CODES[acronym]
  }

  const apiCode = driver.country_code?.trim()?.toUpperCase()
  if (apiCode && ISO3_FLAG_CODES[apiCode]) {
    return ISO3_FLAG_CODES[apiCode]
  }

  return ''
}

/** @param {{ country_code?: string, name_acronym?: string } | null | undefined} driver */
export function resolveDriverCountryCode(driver) {
  if (!driver) return null

  const acronym = normalizeAcronym(driver.name_acronym)
  if (acronym && ACRONYM_ISO3[acronym]) {
    return ACRONYM_ISO3[acronym]
  }

  const apiCode = driver.country_code?.trim()?.toUpperCase()
  if (apiCode) return apiCode

  const flagCode = resolveDriverFlagCode(driver)
  if (!flagCode) return null

  const isoFromFlag = Object.entries(ISO3_FLAG_CODES).find(([, fc]) => fc === flagCode)
  return isoFromFlag?.[0] ?? null
}

/** @param {{ country_code?: string, name_acronym?: string, flag?: string } | null | undefined} driver */
export function driverFlagUrl(driver) {
  const code = resolveDriverFlagCode(driver)
  return code ? `https://flagcdn.com/w40/${code}.png` : ''
}

/** @param {{ country_code?: string, name_acronym?: string, flag?: string } | null | undefined} driver */
export function resolveDriverCountryLabel(driver) {
  if (!driver) return 'Onbekend'

  const acronym = normalizeAcronym(driver.name_acronym)
  if (acronym && ACRONYM_ISO3[acronym] && ISO3_LABELS[ACRONYM_ISO3[acronym]]) {
    return ISO3_LABELS[ACRONYM_ISO3[acronym]]
  }

  const flagCode = resolveDriverFlagCode(driver)
  if (flagCode && FLAG_CODE_LABELS[flagCode]) {
    return FLAG_CODE_LABELS[flagCode]
  }

  const apiCode = driver.country_code?.trim()?.toUpperCase()
  if (apiCode && ISO3_LABELS[apiCode]) {
    return ISO3_LABELS[apiCode]
  }

  return 'Onbekend'
}

/** Hercalculeert vlag/land; negeert verouderde flag-URL in cache. */
export function enrichDriverNationality(driver) {
  if (!driver) return driver
  const flag = driverFlagUrl(driver)
  const country_code = resolveDriverCountryCode(driver)
  return {
    ...driver,
    flag: flag || driver.flag || '',
    country_code: country_code ?? driver.country_code ?? null,
  }
}
