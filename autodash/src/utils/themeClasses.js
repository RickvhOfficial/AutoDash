/** Theme-tokens via CSS-variabelen (index.css) — wisselt automatisch met html.dark. */

export const pageShell = 'theme-page'
export const surface = 'theme-surface'
export const surfaceMuted = 'theme-surface-muted'

export const borderDefault = 'theme-border border'
export const borderSubtle = 'theme-border-subtle border'

export const textMuted = 'theme-text-muted'
export const textFaint = 'theme-text-faint'
export const cardText = 'theme-text-primary'
export const cardTextMuted = 'theme-text-muted'
export const cardTextSoft = 'theme-text-soft'

export const heroOverlay = 'theme-hero-overlay'
export const heroOverlayHome = 'theme-hero-overlay-home'
export const textOnPhoto = 'text-white [text-shadow:0_5px_18px_rgba(0,0,0,0.95)]'

export const cardContent = 'theme-card-content'
export const homeCardClass =
  'theme-home-card group relative overflow-hidden rounded-lg p-5 text-left'

export const cardInteractive = 'theme-card-interactive'
export const newsCard = 'theme-news-card'
export const cardPhoto = 'theme-card-photo'
export const cardPhotoWrap = 'theme-card-photo-wrap absolute inset-0 h-full w-full object-cover'
export const cardSurface = 'theme-card-surface'

export const weatherHeroPanel = 'theme-weather-hero-panel'
export const weatherDropdownTrigger = 'theme-weather-dropdown-trigger'
export const weatherDropdownMenu = 'theme-weather-dropdown-menu'
export const weatherCurrentCard = 'theme-weather-current-card'
export const weatherMetricCard = 'theme-weather-metric-card'
export const weatherForecastCard = 'theme-weather-forecast-card'
export const weatherChartBg = 'theme-weather-chart-bg'

export const driverCardClass =
  'theme-driver-card flex items-center gap-4 rounded-2xl p-5 shadow-md'

export const cardOverlay = 'theme-card-overlay absolute inset-0'
export const homeCardOverlay = 'theme-home-card-overlay absolute inset-0'
export const homeCardFill = 'theme-home-card-fill absolute inset-0'

export const inputField = 'theme-input'

export const navLinkIdle = 'theme-nav-idle border-transparent'
export const navActiveSidebar = 'theme-nav-active border'
export const navActiveOverlay = 'theme-nav-active border'
export const navActive = navActiveSidebar

export const sidebarIconBox =
  'theme-sidebar-icon flex size-9 shrink-0 items-center justify-center rounded-md'

export const panel = 'theme-panel p-6'
export const panelMuted = 'theme-panel-muted p-6 text-center'

export const tableWrap = 'theme-table-wrap'
export const tableHeader =
  'theme-table-header border-b text-xs font-semibold uppercase tracking-wide'
export const tableHeaderLg =
  'theme-table-header border-b text-sm font-semibold uppercase tracking-wide'
export const tableBody = 'theme-table-body space-y-3 px-2 py-3'
export const tableRow =
  'theme-table-row rounded-xl text-sm transition-colors duration-200 ease-out'

export const raceNextHighlight = 'theme-race-next-highlight rounded-xl border'
export const raceNextRow = 'theme-race-next-row rounded-xl'
export const raceNextRowBadge =
  'inline-flex min-w-[8rem] items-center justify-center rounded-md border border-red-600 bg-red-600 px-4 py-2 text-sm font-extrabold text-white ring-1 ring-red-500/40 shadow-[0_0_16px_rgba(255,30,0,0.22)] dark:border-red-500/85 dark:bg-red-950/50 dark:text-red-100 dark:ring-red-500/30'
export const lapPrBanner = 'theme-lap-pr-banner'
export const lapPrDeletePanel = 'theme-lap-pr-delete-panel'
export const homeCardPhotoContent = 'theme-home-card-photo-content theme-card-content'
export const statusUpcomingBadge = 'theme-status-upcoming'
export const lapBestRowHighlight = 'lap-best-row-highlight'
export const lapBestRowHighlightMobile = 'lap-best-row-highlight-mobile'

export const statCard = 'theme-stat-card flex min-h-[7.5rem] flex-col p-5'

export const dropdownMenu = 'theme-dropdown-menu py-1 shadow-xl'
export const dropdownItem =
  'theme-dropdown-item w-full px-3 py-2.5 text-left text-sm transition-colors focus:outline-none'

export const tooltipBox =
  'fixed z-[100] max-w-sm cursor-pointer rounded-lg border border-red-500/50 theme-modal-panel px-3 py-2.5 text-left text-xs leading-relaxed shadow-2xl'

export const toolbarStrip = 'theme-toolbar border'
export const modalBackdrop = 'theme-modal-backdrop absolute inset-0 backdrop-blur-sm'
export const modalBackdropStrong = 'theme-modal-backdrop-strong absolute inset-0 backdrop-blur-md'
export const modalPanel = 'theme-modal-panel relative overflow-hidden shadow-2xl'

export const secondaryButton = 'theme-secondary-btn rounded-md px-4 py-2 text-sm font-medium transition'

export const filterChipIdle = 'theme-chip-idle'
export const filterChipActive = 'theme-chip-active'

export const dataTableShell = 'theme-data-table-shell overflow-x-auto overflow-y-hidden'
export const emptyStateBox = 'theme-empty-state p-8 text-center'

export const fillCardMobile = 'theme-mobile-card-bg'
export const fillPage = 'theme-fill-page'
export const fillCard = 'theme-fill-card'
export const fillRowAlt = 'theme-fill-row-alt'
export const fillMuted = 'theme-fill-muted'
export const fillSubtle = 'theme-fill-subtle'
export const fillRowOpen = 'theme-fill-row-open'
export const fillRowHover = 'theme-fill-row-hover'

/** Voor Tailwind safelist (overige utility-klassen in componenten). */
export const THEME_CLASS_SAFELIST = [
  'hidden',
  'dark:block',
  'focus:border-red-500',
  'focus:outline-none',
  'focus:ring-1',
  'focus:ring-red-500/60',
  'focus:ring-2',
  'focus:ring-red-500/30',
  'focus:ring-red-500/45',
  'focus:ring-red-500/80',
  'hover:border-slate-400',
  'dark:hover:border-slate-500',
  'dark:hover:bg-slate-700/80',
  'dark:hover:bg-slate-800',
  'dark:hover:bg-slate-800/30',
  'dark:hover:bg-slate-800/90',
  'dark:hover:bg-slate-800/95',
  'dark:bg-slate-600/70',
  'dark:bg-slate-700',
  'dark:bg-slate-800/40',
  'dark:bg-slate-900/35',
  'dark:bg-slate-900/60',
  'dark:bg-slate-900/65',
  'dark:bg-slate-900/70',
  'dark:bg-slate-900/75',
  'dark:bg-slate-900/80',
  'dark:bg-slate-950/80',
  'dark:bg-slate-950/90',
  'dark:bg-[#181922]',
  'dark:bg-[#23151a]',
  'dark:bg-red-500/20',
  'dark:bg-red-950/20',
  'dark:bg-red-950/40',
  'dark:bg-red-950/50',
  'dark:bg-emerald-900/10',
  'dark:bg-gray-900/20',
  'dark:border-slate-600',
  'dark:border-slate-700',
  'dark:border-slate-800',
  'dark:text-slate-100',
  'dark:text-slate-200',
  'dark:text-slate-300',
  'dark:text-slate-400',
  'dark:text-slate-500',
  'dark:text-white',
  'dark:text-red-100',
  'dark:text-red-200',
  'dark:text-red-300',
  'dark:from-slate-950',
  'dark:to-transparent',
  'dark:opacity-75',
  'dark:ring-red-500/45',
  'dark:ring-red-500/55',
  'dark:shadow-black/20',
  'dark:shadow-black/25',
  'dark:shadow-black/50',
  textOnPhoto,
]
