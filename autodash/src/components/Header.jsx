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
  faCalendar,
  faGaugeHigh,
  faHouse,
  faStopwatch,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons'

// Eén centrale definitie voor routes: label + Font Awesome icoon (fallback: faGaugeHigh)
const navLinks = [
  { path: '/', label: 'Home', icon: faHouse },
  { path: '/races', label: 'Racekalender', icon: faCalendar },
  { path: '/standings', label: 'Standen', icon: faTrophy },
  { path: '/weather', label: 'Weer', icon: faCloudSun },
  { path: '/vehicles', label: 'Voertuigen', icon: faCar },
  { path: '/lap-tracker', label: 'Karttijden', icon: faStopwatch },
]

// Vaste nav-rij (desktop sidebar + overlay): 54×54 px cel (hoogte = breedte).
const NAV_ROW_H_PX = 54

const SIDEBAR_ICON_BOX =
  'flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-700 text-slate-200'

const SIDEBAR_EASE = 'ease-[cubic-bezier(0.4,0,0.2,1)]'

/** Animated hamburger ↔ kruis; zelfde visuele maat als Font Awesome h-4 w-4 in size-9 box. */
export function MenuToggleIcon({ open }) {
  return (
    <span className="relative block h-4 w-4">
      <span
        className={`absolute left-1/2 top-0 block h-0.5 w-4 bg-slate-200 transition-transform duration-500 ${SIDEBAR_EASE} ${
          open ? '-translate-x-1/2 translate-y-1.5 rotate-45' : '-translate-x-1/2'
        }`}
      />
      <span
        className={`absolute left-1/2 top-1.5 block h-0.5 w-4 -translate-x-1/2 bg-slate-200 transition-opacity duration-500 ${SIDEBAR_EASE} ${open ? 'opacity-0' : 'opacity-100'}`}
      />
      <span
        className={`absolute left-1/2 top-3 block h-0.5 w-4 bg-slate-200 transition-transform duration-500 ${SIDEBAR_EASE} ${
          open ? '-translate-x-1/2 -translate-y-1.5 -rotate-45' : '-translate-x-1/2'
        }`}
      />
    </span>
  )
}

/** Gedeelde Tailwind-classes voor actieve vs. neutrale navigatielinks. */
function activeLinkClasses(isActive, variant) {
  if (variant === 'overlay') {
    return isActive
      ? 'border-red-600/95 bg-red-950/50 text-red-100 ring-1 ring-red-500/55'
      : 'border-transparent text-slate-300 active:bg-slate-800 hover:bg-slate-800 hover:text-white'
  }
  return isActive
    ? 'border-red-600/95 bg-red-950/50 text-red-100 shadow-[0_0_18px_rgba(220,38,38,0.42)] ring-1 ring-red-500/45'
    : 'border-transparent text-slate-300 hover:bg-slate-800 hover:text-white'
}

export default function Header({
  menuOpen,
  setMenuOpen,
  variant = 'sidebar',
  desktopSidebarCollapseSettled = true,
}) {
  const location = useLocation()
  const isOverlay = variant === 'overlay'

  if (isOverlay) {
    return (
      <header className="flex max-h-[100dvh] min-h-[100dvh] flex-col bg-slate-900 text-slate-100">
        {/* Zelfde visuele bandhoogte als de vaste LogoBanner/hamburger-regel op mobiel */}
        <div className="flex h-24 shrink-0 items-center justify-end border-b border-slate-800 px-4">
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
          Zelfde rijhoogte als desktop (NAV_ROW_H_PX): 54px.
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
                    className={`grid w-full grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-3 rounded-lg border px-3 text-left transition-[colors,box-shadow] duration-200 ease-out ${activeLinkClasses(isActive, 'overlay')}`}
                    style={{ minHeight: NAV_ROW_H_PX, height: NAV_ROW_H_PX }}
                  >
                    <span className={`${SIDEBAR_ICON_BOX} text-xs`}>
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

  // h-[54px] bewust gelijk aan NAV_ROW_H_PX (Tailwind JIT vangt geen template-class).
  const sidebarRowClass = 'h-[54px]'

  const isExpandedLayout = menuOpen || !desktopSidebarCollapseSettled
  const collapsedSettled = !menuOpen && desktopSidebarCollapseSettled

  return (
    <header className="flex w-full flex-col bg-slate-900 text-slate-100">
      <div className="flex min-w-0 flex-col overflow-hidden px-2 py-2.5">
        <div
          className={`flex ${sidebarRowClass} shrink-0 items-center border-b border-slate-800/90 px-2 ${
            isExpandedLayout ? 'justify-end' : 'justify-center'
          }`}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`${SIDEBAR_ICON_BOX} outline-none transition-colors duration-300 ${SIDEBAR_EASE} hover:bg-slate-600 focus-visible:ring-1 focus-visible:ring-red-500/45`}
            aria-label={menuOpen ? 'Menu sluiten' : 'Menu openen'}
            aria-expanded={menuOpen}
          >
            <MenuToggleIcon open={menuOpen} />
          </button>
        </div>

        <nav className="mt-3 max-h-[min(26rem,calc(100dvh-16rem))] overflow-x-hidden overflow-y-auto px-0 pb-1 pt-1">
          <ul className="space-y-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    title={collapsedSettled ? link.label : undefined}
                    className={`group flex ${sidebarRowClass} w-full min-w-0 items-center overflow-hidden rounded-lg border px-2 transition-[colors,box-shadow,gap] duration-500 ${SIDEBAR_EASE} ${
                      isExpandedLayout ? 'justify-start gap-2' : 'justify-center gap-0'
                    } ${activeLinkClasses(isActive, 'sidebar')}`}
                  >
                    <span className={`${SIDEBAR_ICON_BOX} text-sm`}>
                      <FontAwesomeIcon
                        icon={link.icon ?? faGaugeHigh}
                        className="h-4 w-4"
                      />
                    </span>
                    <span
                      aria-hidden={!menuOpen}
                      className={`min-w-0 flex-none overflow-hidden text-left text-sm font-medium whitespace-nowrap transition-[opacity,max-width] duration-500 ${SIDEBAR_EASE} ${
                        menuOpen
                          ? 'max-w-[11rem] opacity-100'
                          : 'max-w-0 opacity-0'
                      }`}
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
}
