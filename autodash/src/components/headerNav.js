import {
  faCar,
  faCloudSun,
  faCalendar,
  faGaugeHigh,
  faHouse,
  faNewspaper,
  faStopwatch,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons'
import { navLinkIdle, navActiveSidebar, navActiveOverlay } from '../utils/themeClasses'

export const navLinks = [
  { path: '/', label: 'Home', icon: faHouse },
  { path: '/races', label: 'Racekalender', icon: faCalendar },
  { path: '/standings', label: 'Standen', icon: faTrophy },
  { path: '/news', label: 'Motorsport nieuws', icon: faNewspaper },
  { path: '/weather', label: 'Weer', icon: faCloudSun },
  { path: '/vehicles', label: 'Voertuigen', icon: faCar },
  { path: '/lap-tracker', label: 'Karttijden', icon: faStopwatch },
]

export const SIDEBAR_EASE = 'ease-[cubic-bezier(0.4,0,0.2,1)]'

export function activeLinkClasses(isActive, variant) {
  if (variant === 'overlay') {
    return isActive
      ? navActiveOverlay
      : `border-transparent active:theme-fill-row-open dark:active:bg-slate-800 ${navLinkIdle}`
  }
  return isActive ? navActiveSidebar : navLinkIdle
}

export { faGaugeHigh }
