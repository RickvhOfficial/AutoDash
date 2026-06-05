// Statische F1-metadata wanneer OpenF1 geblokkeerd is (401 tijdens live sessies).
const F1_MEDIA = 'https://media.formula1.com/content/dam/fom-website'
const F1_FLAGS = `${F1_MEDIA}/2018-redesign-assets/Flags%2016x9`
const F1_TRACKS = `${F1_MEDIA}/2018-redesign-assets/Track%20icons%204x3`

/** @type {Record<string, { team_name: string, team_colour: string, headshot_url: string }>} */
const DRIVER_META_BY_ACRONYM = {
  ANT: { team_name: 'Mercedes', team_colour: '00D7B6', headshot_url: `${F1_MEDIA}/drivers/K/ANDANT01_Kimi_Antonelli/andant01.png.transform/1col/image.png` },
  RUS: { team_name: 'Mercedes', team_colour: '00D7B6', headshot_url: `${F1_MEDIA}/drivers/G/GEORUS01_George_Russell/georus01.png.transform/1col/image.png` },
  LEC: { team_name: 'Ferrari', team_colour: 'ED1131', headshot_url: `${F1_MEDIA}/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png.transform/1col/image.png` },
  HAM: { team_name: 'Ferrari', team_colour: 'ED1131', headshot_url: `${F1_MEDIA}/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png.transform/1col/image.png` },
  NOR: { team_name: 'McLaren', team_colour: 'F47600', headshot_url: `${F1_MEDIA}/drivers/L/LANNOR01_Lando_Norris/lannor01.png.transform/1col/image.png` },
  PIA: { team_name: 'McLaren', team_colour: 'F47600', headshot_url: `${F1_MEDIA}/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png.transform/1col/image.png` },
  VER: { team_name: 'Red Bull Racing', team_colour: '4781D7', headshot_url: `${F1_MEDIA}/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/1col/image.png` },
  GAS: { team_name: 'Alpine', team_colour: '00A1E8', headshot_url: `${F1_MEDIA}/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png.transform/1col/image.png` },
  BEA: { team_name: 'Haas F1 Team', team_colour: '9C9FA2', headshot_url: `${F1_MEDIA}/drivers/O/OLIBEA01_Oliver_Bearman/olibea01.png.transform/1col/image.png` },
  LAW: { team_name: 'Racing Bulls', team_colour: '6C98FF', headshot_url: `${F1_MEDIA}/drivers/L/LIALAW01_Liam_Lawson/lialaw01.png.transform/1col/image.png` },
  COL: { team_name: 'Alpine', team_colour: '00A1E8', headshot_url: `${F1_MEDIA}/drivers/F/FRACOL01_Franco_Colapinto/fracol01.png.transform/1col/image.png` },
  HAD: { team_name: 'Red Bull Racing', team_colour: '4781D7', headshot_url: `${F1_MEDIA}/drivers/I/ISAHAD01_Isack_Hadjar/isahad01.png.transform/1col/image.png` },
  SAI: { team_name: 'Williams', team_colour: '1868DB', headshot_url: `${F1_MEDIA}/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png.transform/1col/image.png` },
  LIN: { team_name: 'Racing Bulls', team_colour: '6C98FF', headshot_url: `${F1_MEDIA}/drivers/A/ARVLIN01_Arvid_Lindblad/arvlin01.png.transform/1col/image.png` },
  BOR: { team_name: 'Audi', team_colour: 'F50537', headshot_url: `${F1_MEDIA}/drivers/G/GABBOR01_Gabriel_Bortoleto/gabbor01.png.transform/1col/image.png` },
  OCO: { team_name: 'Haas F1 Team', team_colour: '9C9FA2', headshot_url: `${F1_MEDIA}/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png.transform/1col/image.png` },
  ALB: { team_name: 'Williams', team_colour: '1868DB', headshot_url: `${F1_MEDIA}/drivers/A/ALEALB01_Alexander_Albon/alealb01.png.transform/1col/image.png` },
  HUL: { team_name: 'Audi', team_colour: 'F50537', headshot_url: `${F1_MEDIA}/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png.transform/1col/image.png` },
  BOT: { team_name: 'Cadillac', team_colour: '909090', headshot_url: `${F1_MEDIA}/drivers/V/VALBOT01_Valtteri_Bottas/valbot01.png.transform/1col/image.png` },
  PER: { team_name: 'Cadillac', team_colour: '909090', headshot_url: `${F1_MEDIA}/drivers/S/SERPER01_Sergio_Perez/serper01.png.transform/1col/image.png` },
  STR: { team_name: 'Aston Martin', team_colour: '229971', headshot_url: `${F1_MEDIA}/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png.transform/1col/image.png` },
  ALO: { team_name: 'Aston Martin', team_colour: '229971', headshot_url: `${F1_MEDIA}/drivers/F/FERALO01_Fernando_Alonso/feralo01.png.transform/1col/image.png` },
}

const CONSTRUCTOR_COLOURS = {
  Mercedes: '00D7B6',
  Ferrari: 'ED1131',
  McLaren: 'F47600',
  'Red Bull': '4781D7',
  'Red Bull Racing': '4781D7',
  Alpine: '00A1E8',
  'Alpine F1 Team': '00A1E8',
  Haas: '9C9FA2',
  'Haas F1 Team': '9C9FA2',
  'Racing Bulls': '6C98FF',
  'RB F1 Team': '6C98FF',
  Williams: '1868DB',
  Audi: 'F50537',
  Cadillac: '909090',
  'Cadillac F1 Team': '909090',
  'Aston Martin': '229971',
}

const COUNTRY_FLAG_URLS = {
  Australia: `${F1_FLAGS}/australia-flag.png`,
  China: `${F1_FLAGS}/china-flag.png`,
  Japan: `${F1_FLAGS}/japan-flag.png`,
  USA: `${F1_FLAGS}/united-states-flag.png`,
  'United States': `${F1_FLAGS}/united-states-flag.png`,
  Canada: `${F1_FLAGS}/canada-flag.png`,
  Monaco: `${F1_FLAGS}/monaco-flag.png`,
  Spain: `${F1_FLAGS}/spain-flag.png`,
  Austria: `${F1_FLAGS}/austria-flag.png`,
  UK: `${F1_FLAGS}/united-kingdom-flag.png`,
  'United Kingdom': `${F1_FLAGS}/united-kingdom-flag.png`,
  Belgium: `${F1_FLAGS}/belgium-flag.png`,
  Hungary: `${F1_FLAGS}/hungary-flag.png`,
  Netherlands: `${F1_FLAGS}/netherlands-flag.png`,
  Italy: `${F1_FLAGS}/italy-flag.png`,
  Azerbaijan: `${F1_FLAGS}/azerbaijan-flag.png`,
  Singapore: `${F1_FLAGS}/singapore-flag.png`,
  Mexico: `${F1_FLAGS}/mexico-flag.png`,
  Brazil: `${F1_FLAGS}/brazil-flag.png`,
  Qatar: `${F1_FLAGS}/qatar-flag.png`,
  UAE: `${F1_FLAGS}/united-arab-emirates-flag.png`,
  'United Arab Emirates': `${F1_FLAGS}/united-arab-emirates-flag.png`,
  Bahrain: `${F1_FLAGS}/bahrain-flag.png`,
  'Saudi Arabia': `${F1_FLAGS}/saudi-arabia-flag.png`,
}

const CIRCUIT_IMAGE_URLS = {
  Melbourne: `${F1_TRACKS}/Australia%20carbon.png`,
  Shanghai: `${F1_TRACKS}/China%20carbon.png`,
  Suzuka: `${F1_TRACKS}/Japan%20carbon.png`,
  Miami: `${F1_TRACKS}/Miami%20carbon.png`,
  Montreal: `${F1_TRACKS}/Canada%20carbon.png`,
  'Monte Carlo': `${F1_TRACKS}/Monaco%20carbon.png`,
  Catalunya: `${F1_TRACKS}/Spain%20carbon.png`,
  Madring: `${F1_TRACKS}/Spain%20carbon.png`,
  Spielberg: `${F1_TRACKS}/Austria%20carbon.png`,
  Silverstone: `${F1_TRACKS}/Great%20Britain%20carbon.png`,
  'Spa-Francorchamps': `${F1_TRACKS}/Belgium%20carbon.png`,
  Hungaroring: `${F1_TRACKS}/Hungary%20carbon.png`,
  Zandvoort: `${F1_TRACKS}/Netherlands%20carbon.png`,
  Monza: `${F1_TRACKS}/Italy%20carbon.png`,
  Baku: `${F1_TRACKS}/Azerbaijan%20carbon.png`,
  Singapore: `${F1_TRACKS}/Singapore%20carbon.png`,
  Austin: `${F1_TRACKS}/USA%20carbon.png`,
  'Mexico City': `${F1_TRACKS}/Mexico%20carbon.png`,
  Interlagos: `${F1_TRACKS}/Brazil%20carbon.png`,
  'Las Vegas': `${F1_TRACKS}/Las%20Vegas%20carbon.png`,
  Lusail: `${F1_TRACKS}/Qatar%20carbon.png`,
  'Yas Marina Circuit': `${F1_TRACKS}/Abu%20Dhabi%20carbon.png`,
  Sakhir: `${F1_TRACKS}/Bahrain%20carbon.png`,
  Jeddah: `${F1_TRACKS}/Saudi%20Arabia%20carbon.png`,
  Imola: `${F1_TRACKS}/Emilia%20Romagna%20carbon.png`,
}

function normalizeAcronym(acronym) {
  return acronym?.trim?.().toUpperCase() ?? ''
}

export function enrichF1Driver(driver) {
  if (!driver) return driver
  const acronym = normalizeAcronym(driver.name_acronym)
  const meta = acronym ? DRIVER_META_BY_ACRONYM[acronym] : null
  const teamName = meta?.team_name || driver.team_name || null
  const teamColour =
    meta?.team_colour ||
    driver.team_colour ||
    (teamName ? CONSTRUCTOR_COLOURS[teamName] : null) ||
    null

  return {
    ...driver,
    team_name: teamName,
    team_colour: teamColour,
    headshot_url: meta?.headshot_url || driver.headshot_url || null,
  }
}

export function enrichF1Race(race) {
  if (!race) return race
  const countryName = race.countryName || race.country_name || ''
  const circuitKey = race.circuit_short_name || race.circuitName || ''
  const flag = race.country_flag || race.countryFlag || COUNTRY_FLAG_URLS[countryName] || ''
  const circuitImage =
    race.circuit_image || race.circuitImage || CIRCUIT_IMAGE_URLS[circuitKey] || null

  return {
    ...race,
    country_flag: flag,
    countryFlag: flag,
    circuit_image: circuitImage,
    circuitImage,
  }
}
