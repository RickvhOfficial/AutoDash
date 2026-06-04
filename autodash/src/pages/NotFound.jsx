// Route: * — onbekende URL. Banner met finishvlag; 404-tekst in hetzelfde card als eerder.
import { Link } from 'react-router-dom'
import SafeImg from '../components/SafeImg'
import { cardSurface, cardText, cardTextMuted, borderSubtle } from '../utils/themeClasses'

// Geblokte vlag (Unsplash — standaardlicentie).
const FLAG_BANNER_IMG =
  'https://images.unsplash.com/photo-1689974288558-c393a05cb59e?auto=format&fit=crop&w=1800&q=88'

export default function NotFound() {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8 sm:py-12 md:py-16">
      <div className={`w-full max-w-xl overflow-hidden rounded-xl shadow-lg backdrop-blur-sm ${cardSurface}`}>
        <div className={`relative h-[clamp(6.5rem,20vw,10.5rem)] w-full shrink-0 border-b ${borderSubtle}`}>
          <SafeImg
            src={FLAG_BANNER_IMG}
            alt="Geblokte finishvlag"
            className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/40 dark:to-slate-900/35" />
        </div>
        <div className="px-8 py-8 text-center sm:px-10 sm:py-10 md:px-12 md:py-12">
          <h1 className={`text-[clamp(3.5rem,14vw,7.5rem)] font-bold leading-none tracking-tight ${cardText}`}>
            404
          </h1>
          <p className={`mt-8 text-base leading-relaxed md:text-lg ${cardTextMuted}`}>
            Oh! Oh! Pagina niet gevonden. Klik{' '}
            <Link
              to="/"
              className="font-bold text-red-500 underline underline-offset-2 transition hover:text-red-400"
            >
              Hier
            </Link>{' '}
            om weer naar de home pagina te gaan.
          </p>
        </div>
      </div>
    </div>
  )
}
