import { SIDEBAR_EASE } from './headerNav'

export default function MenuToggleIcon({ open }) {
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
