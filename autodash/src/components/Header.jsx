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
import ThemeToggle from './ThemeToggle'
import {
  faCar,
  faCloudSun,
  faCalendar,
  faGaugeHigh,
  faHouse,
  faStopwatch,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons'
import {
  navLinkIdle,
  navActiveSidebar,
  navActiveOverlay,
  sidebarIconBox,
  surface,
} from '../utils/themeClasses'

const navLinks = [
  { path: '/', label: 'Home', icon: faHouse },
  { path: '/races', label: 'Racekalender', icon: faCalendar },
  { path: '/standings', label: 'Standen', icon: faTrophy },
  { path: '/weather', label: 'Weer', icon: faCloudSun },
  { path: '/vehicles', label: 'Voertuigen', icon: faCar },
  { path: '/lap-tracker', label: 'Karttijden', icon: faStopwatch },
]

const NAV_ROW_H_PX = 54
const SIDEBAR_EASE = 'ease-[cubic-bezier(0.4,0,0.2,1)]'

export function MenuToggleIcon({ open }) {
  return (
    <span className="theme-menu-toggle-icon relative block h-4 w-4">
      <span
        className={`absolute left-1/2 top-0 block h-[2px] w-4 rounded-full bg-current transition-transform duration-500 ${SIDEBAR_EASE} ${
          open ? '-translate-x-1/2 translate-y-[7px] rotate-45' : '-translate-x-1/2'
        }`}
      />
      <span
        className={`absolute left-1/2 top-[7px] block h-[2px] w-4 -translate-x-1/2 rounded-full bg-current transition-opacity duration-500 ${SIDEBAR_EASE} ${open ? 'opacity-0' : 'opacity-100'}`}
      />
      <span
        className={`absolute left-1/2 top-[14px] block h-[2px] w-4 rounded-full bg-current transition-transform duration-500 ${SIDEBAR_EASE} ${
          open ? '-translate-x-1/2 -translate-y-[7px] -rotate-45' : '-translate-x-1/2'
        }`}
      />
    </span>
  )
}

function activeLinkClasses(isActive, variant) {
  if (variant === 'overlay') {
    return isActive
      ? navActiveOverlay
      : `border-transparent active:theme-fill-row-open dark:active:bg-slate-800 ${navLinkIdle}`
  }
  return isActive ? navActiveSidebar : navLinkIdle
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
      <header className={`flex max-h-[100dvh] min-h-[100dvh] flex-col ${surface}`}>
        <div className="flex h-24 shrink-0 items-center justify-between gap-2 px-4">
          <ThemeToggle showLabel />
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`${sidebarIconBox} outline-none transition-colors duration-300 ${SIDEBAR_EASE} hover:bg-slate-300 dark:hover:bg-slate-600 focus-visible:ring-1 focus-visible:ring-red-500/45`}
            aria-label={menuOpen ? 'Menu sluiten' : 'Menu openen'}
            aria-expanded={menuOpen}
          >
            <MenuToggleIcon open={menuOpen} />
          </button>
        </div>

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
                    <span className={`${sidebarIconBox} text-xs`}>
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

  const sidebarRowClass = 'h-[54px]'
  const isExpandedLayout = menuOpen || !desktopSidebarCollapseSettled
  const collapsedSettled = !menuOpen && desktopSidebarCollapseSettled
  const showThemeToggle = menuOpen && desktopSidebarCollapseSettled

  return (
    <header className={`flex w-full flex-col ${surface}`}>
      <div className="flex min-w-0 flex-col overflow-hidden p-2">
        <div className={`flex ${sidebarRowClass} w-full shrink-0 items-center`}>
          {showThemeToggle && <ThemeToggle showLabel />}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`${sidebarIconBox} outline-none transition-colors duration-300 ${SIDEBAR_EASE} hover:bg-slate-300 dark:hover:bg-slate-600 focus-visible:ring-1 focus-visible:ring-red-500/45 ${
              isExpandedLayout ? 'ml-auto' : 'mx-auto'
            }`}
            aria-label={menuOpen ? 'Menu sluiten' : 'Menu openen'}
            aria-expanded={menuOpen}
          >
            <MenuToggleIcon open={menuOpen} />
          </button>
        </div>

        <nav className="mt-2 max-h-[min(26rem,calc(100dvh-16rem))] overflow-x-hidden overflow-y-auto">
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
                    <span className={`${sidebarIconBox} text-sm`}>
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
