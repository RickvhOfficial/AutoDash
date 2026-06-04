import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ThemeToggle from './ThemeToggle'
import MenuToggleIcon from './MenuToggleIcon'
import { activeLinkClasses, faGaugeHigh, navLinks, SIDEBAR_EASE } from './headerNav'
import { sidebarIconBox, surface } from '../utils/themeClasses'

export default function HeaderSidebar({
  menuOpen,
  setMenuOpen,
  desktopSidebarCollapseSettled,
}) {
  const location = useLocation()
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
                      <FontAwesomeIcon icon={link.icon ?? faGaugeHigh} className="h-4 w-4" />
                    </span>
                    <span
                      aria-hidden={!menuOpen}
                      className={`min-w-0 flex-none overflow-hidden text-left text-sm font-medium whitespace-nowrap transition-[opacity,max-width] duration-500 ${SIDEBAR_EASE} ${
                        menuOpen ? 'max-w-[11rem] opacity-100' : 'max-w-0 opacity-0'
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
