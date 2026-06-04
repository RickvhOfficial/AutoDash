import CountryInfoCard from './CountryInfoCard'
import LoadingSpinner from './LoadingSpinner'
import { textFaint } from '../utils/themeClasses'

export default function RaceCardCountryPanel({ loading, error, country }) {
  if (loading) {
    return <LoadingSpinner message="Landinfo laden..." compact />
  }
  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
  }
  if (country) {
    return <CountryInfoCard country={country} />
  }
  return <p className={`text-sm ${textFaint}`}>Geen landinfo beschikbaar.</p>
}
