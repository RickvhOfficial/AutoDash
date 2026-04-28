// -----------------------------------------------------------------------------
// Navigatie + hamburger-icoon.
//
// variant "sidebar" (standaard): gebruikt in de vaste desktop-aside naast content.
// variant "overlay": fullscreen mobiel menu; kleinere rijen, klik op link sluit menu.
//
// MenuToggleIcon is geëxporteerd voor de losse zwevende hamburger-knop in App.jsx.
// -----------------------------------------------------------------------------
import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCar,
  faCloudSun,
  faFlagCheckered,
  faGaugeHigh,
  faHouse,
  faStopwatch,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons'

// Eén centrale definitie voor routes: label + Font Awesome icoon (fallback: faGaugeHigh)
const navLinks = [
  { path: '/', label: 'Home', icon: faHouse },
  { path: '/races', label: 'Races', icon: faFlagCheckered },
  { path: '/standings', label: 'Standen', icon: faTrophy },
  { path: '/weather', label: 'Weer', icon: faCloudSun },
  { path: '/vehicles', label: 'Voertuigen', icon: faCar },
  { path: '/lap-tracker', label: 'Karttijden', icon: faStopwatch },
]

/** Animated hamburger ↔ kruis; `open=true` betekent “menu staat open” (icoon wordt X). */
export function MenuToggleIcon({ open }) {
  return (
    <span className="relative block h-5 w-6">
      <span
        className={`absolute left-0 top-0 block h-0.5 w-6 bg-slate-200 transition-transform duration-300 ${open ? 'translate-y-2 rotate-45' : ''}`}
      />
      <span
        className={`absolute left-0 top-2 block h-0.5 w-6 bg-slate-200 transition-opacity duration-200 ${open ? 'opacity-0' : 'opacity-100'}`}
      />
      <span
        className={`absolute left-0 top-4 block h-0.5 w-6 bg-slate-200 transition-transform duration-300 ${open ? '-translate-y-2 -rotate-45' : ''}`}
      />
    </span>
  )
}

/** Gedeelde Tailwind-classes voor actieve vs. neutrale navigatielinks. */
function activeLinkClasses(isActive, variant) {
  if (variant === 'overlay') {
    return isActive
      ? 'border-red-500/90 bg-red-500/10 text-red-300 ring-1 ring-red-500/50'
      : 'border-transparent text-slate-300 active:bg-slate-800 hover:bg-slate-800 hover:text-white'
  }
  return isActive
    ? 'border-red-500/90 bg-red-500/10 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.35)] ring-1 ring-red-500/40'
    : 'border-transparent text-slate-300 hover:bg-slate-800 hover:text-white'
}

export default function Header({ menuOpen, setMenuOpen, variant = 'sidebar' }) {
  const location = useLocation()
  const isOverlay = variant === 'overlay'

  if (isOverlay) {
    return (
      <header className="flex max-h-[100dvh] min-h-[100dvh] flex-col bg-slate-900 text-slate-100">
        {/* Zelfde visuele bandhoogte als de vaste LogoBanner/hamburger-regel op mobiel */}
        <div className="flex h-20 shrink-0 items-center justify-end border-b border-slate-700 px-4">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-transparent text-slate-200 transition hover:bg-slate-800"
            aria-label={menuOpen ? 'Menu sluiten' : 'Menu openen'}
            aria-expanded={menuOpen}
          >
            <MenuToggleIcon open={menuOpen} />
          </button>
        </div>

        {/*
          smalle,max brede kolom + vaste eerst kolom voor iconen ⇒ verticaal rechte icoon-lijn.
          Elke Link is een 2-koloms grid (icoon | label); w-full binnen max-w houdt rijen gelijk breed.
        */}
        <nav className="flex min-h-0 flex-1 flex-col portrait:justify-center landscape:justify-start overflow-y-auto px-4 py-6">
          <ul className="mx-auto flex w-full max-w-[15rem] flex-col gap-2 sm:max-w-[17rem]">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    onClick={() => setMenuOpen(false)}
                    className={`grid w-full grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-3 rounded-lg border px-3 py-2 text-left transition-[colors,box-shadow] duration-200 ease-out ${activeLinkClasses(isActive, 'overlay')}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center justify-self-start rounded-md bg-slate-700 text-xs text-slate-200">
                      <FontAwesomeIcon icon={link.icon ?? faGaugeHigh} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 text-xs font-medium sm:text-sm">
                      {link.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </header>
    )
  }

  return (
    <header className="flex flex-1 flex-col bg-slate-900 text-slate-100">
      <div className="flex justify-end border-b border-slate-700 px-2 py-3">
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-transparent text-slate-200 transition hover:bg-slate-800"
          aria-label={menuOpen ? 'Menu sluiten' : 'Menu openen'}
          aria-expanded={menuOpen}
        >
          <MenuToggleIcon open={menuOpen} />
        </button>
      </div>

      {/* overflow-hidden: tekst knipt mee als de aside smaller wordt (geen losse width-animatie op labels) */}
      <nav className="flex-1 overflow-hidden px-2 py-3">
        <ul className="space-y-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path
            return (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`group flex h-[3.094rem] w-full min-w-0 items-center gap-2 rounded-lg border px-2 transition-[colors,box-shadow] duration-200 ease-out ${activeLinkClasses(isActive, 'sidebar')}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-700 text-sm text-slate-200">
                    <FontAwesomeIcon icon={link.icon ?? faGaugeHigh} />
                  </span>
                  <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left text-sm font-medium">
                    {link.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
