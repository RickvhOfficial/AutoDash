import SafeImg from './SafeImg'
import { cardText, cardTextMuted, cardTextSoft, textFaint } from '../utils/themeClasses'

const MILJOEN = 1_000_000
const MILJARD = 1_000_000_000

function formatCompactAmount(value, maxDecimals = 1) {
  const rounded = Number(value.toFixed(maxDecimals))
  return rounded.toLocaleString('nl-NL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })
}

function formatPopulation(population) {
  if (!population) return 'Onbekend'

  if (population >= MILJARD) {
    return `${formatCompactAmount(population / MILJARD)} miljard inwoners`
  }

  if (population >= MILJOEN) {
    return `${formatCompactAmount(population / MILJOEN)} miljoen inwoners`
  }

  return `${population.toLocaleString('nl-NL')} inwoners`
}

function formatCurrencies(currencies) {
  if (!currencies || typeof currencies !== 'object') return 'Onbekend'
  return Object.entries(currencies)
    .map(([code, info]) => {
      const label = info?.name || code
      return info?.symbol ? `${label} (${info.symbol})` : label
    })
    .join(', ')
}

function formatLanguages(languages) {
  if (!languages || typeof languages !== 'object') return 'Onbekend'
  return Object.values(languages).join(', ')
}

function formatTimezones(timezones) {
  if (!Array.isArray(timezones) || timezones.length === 0) return 'Onbekend'
  if (timezones.length <= 4) return timezones.join(', ')
  return `${timezones.slice(0, 4).join(', ')} +${timezones.length - 4}`
}

export default function CountryInfoCard({ country }) {
  if (!country) return null

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
      {country.flags?.png ? (
        <SafeImg
          src={country.flags.png}
          alt={`Vlag van ${country.name?.common || 'land'}`}
          className="h-10 w-16 shrink-0 rounded object-cover shadow"
          loading="lazy"
        />
      ) : null}
      <div className={`min-w-0 flex-1 space-y-2 text-sm ${cardTextSoft}`}>
        <h3 className={`text-lg font-bold ${cardText}`}>{country.name?.common}</h3>
        {country.name?.official ? (
          <p className={textFaint}>{country.name.official}</p>
        ) : null}
        <p>
          <span className={textFaint}>Hoofdstad:</span> {country.capital?.[0] || 'Onbekend'}
        </p>
        <p>
          <span className={textFaint}>Bevolking:</span> {formatPopulation(country.population)}
        </p>
        <p>
          <span className={textFaint}>Valuta:</span> {formatCurrencies(country.currencies)}
        </p>
        <p>
          <span className={textFaint}>Talen:</span> {formatLanguages(country.languages)}
        </p>
        <p>
          <span className={textFaint}>Regio:</span> {country.region || 'Onbekend'}
        </p>
        <p>
          <span className={textFaint}>Tijdzone:</span> {formatTimezones(country.timezones)}
        </p>
      </div>
    </div>
  )
}
