import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ThemeToggle from './ThemeToggle'
import MenuToggleIcon from './MenuToggleIcon'
import { activeLinkClasses, faGaugeHigh, navLinks, SIDEBAR_EASE } from './headerNav'
import { sidebarIconBox, surface } from '../utils/themeClasses'

export default function HeaderOverlay({ menuOpen, setMenuOpen }) {
  const location = useLocation()

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

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 portrait:justify-center landscape:justify-start">
        <ul className="mx-auto flex w-full max-w-[15rem] flex-col gap-2 sm:max-w-[17rem]">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path
            return (
              <li key={link.path}>
                <Link
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`grid h-[54px] min-h-[54px] w-full grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-3 rounded-lg border px-3 text-left transition-[colors,box-shadow] duration-200 ease-out ${activeLinkClasses(isActive, 'overlay')}`}
                >
                  <span className={`${sidebarIconBox} text-xs`}>
                    <FontAwesomeIcon icon={link.icon ?? faGaugeHigh} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 text-xs font-medium sm:text-sm">{link.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
