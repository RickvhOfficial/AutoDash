// Navigatie-shell: sidebar (desktop) of overlay (mobiel). MenuToggleIcon voor App.jsx.
import HeaderOverlay from './HeaderOverlay'
import HeaderSidebar from './HeaderSidebar'

export { default as MenuToggleIcon } from './MenuToggleIcon'

export default function Header({
  menuOpen,
  setMenuOpen,
  variant = 'sidebar',
  desktopSidebarCollapseSettled = true,
}) {
  if (variant === 'overlay') {
    return <HeaderOverlay menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
  }

  return (
    <HeaderSidebar
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
      desktopSidebarCollapseSettled={desktopSidebarCollapseSettled}
    />
  )
}
