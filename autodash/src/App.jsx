// -----------------------------------------------------------------------------
// Hoofdapplicatie-shell: Router, layout en gedeelde navigatiestate (menuOpen).
//
// Desktop-sidebar: zwevende kolom; `top` = `--sidebar-mid-y` (gemeten t.o.v. footer in viewport).
// Mobiel: LogoBanner + overlay-menu.

const LOGO_BOTTOM_PX = 96
// -----------------------------------------------------------------------------
import { lazy, Suspense, startTransition, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Header, { MenuToggleIcon } from './components/Header'
import LogoBanner from './components/LogoBanner'
import Footer from './components/Footer'
import ErrorMessage from './components/ErrorMessage'
import HomeHero from './components/HomeHero'
import LoadingSpinner from './components/LoadingSpinner'
import { pageShell, surface, sidebarIconBox } from './utils/themeClasses'
import { HOME_HERO_HEIGHT_PX } from './constants/layout'
import { fetchApiHealth } from './services/dashboardService'

const Home = lazy(() => import('./pages/Home'))
const RaceCalendar = lazy(() => import('./pages/RaceCalendar'))
const DriverStandings = lazy(() => import('./pages/DriverStandings'))
const CircuitWeather = lazy(() => import('./pages/CircuitWeather'))
const VehicleSearch = lazy(() => import('./pages/VehicleSearch'))
const LapTracker = lazy(() => import('./pages/LapTracker'))
const MotorsportNews = lazy(() => import('./pages/MotorsportNews'))
const NotFound = lazy(() => import('./pages/NotFound'))

function AppLayout() {
  const location = useLocation()

  // true = sidebar uitgeklapt (desktop) of mobiel menu zichtbaar
  const [menuOpen, setMenuOpen] = useState(false)
  const setMenuOpenDeferred = useCallback((value) => {
    startTransition(() => {
      setMenuOpen(value)
    })
  }, [])
  // Desktop: pas na width-transitie narrow-layout (gecentreerde iconen); tijdens animatie links voor soepelere beweging
  const [sidebarWidthAnimDone, setSidebarWidthAnimDone] = useState(true)
  const prevMenuOpenRef = useRef(menuOpen)
  const sidebarAnimFallbackRef = useRef(null)
  const [apiUnavailable, setApiUnavailable] = useState(false)

  // Centrale API health-check: bij backend-uitval tonen we een globale foutmelding.
  const checkApiHealth = useRef(async () => {
    try {
      const ok = await fetchApiHealth()
      setApiUnavailable(!ok)
    } catch {
      setApiUnavailable(true)
    }
  }).current

  // Scroll-lock alleen op smalle viewports als het mobiele menu open is (achtergrond scrollt niet mee)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    function syncBody() {
      if (mq.matches && menuOpen) document.body.style.overflow = 'hidden'
      else document.body.style.overflow = ''
    }
    syncBody()
    mq.addEventListener('change', syncBody)
    return () => {
      mq.removeEventListener('change', syncBody)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    let timer = null
    checkApiHealth()
    timer = setInterval(checkApiHealth, 30000)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [checkApiHealth])

  // Escape sluit alleen het mobiele fullscreen-menu (niet de desktop-sidebar)
  useEffect(() => {
    if (!menuOpen) return
    function onEscape(e) {
      if (
        e.key === 'Escape' &&
        window.matchMedia('(max-width: 1023px)').matches
      ) {
        setMenuOpenDeferred(false)
      }
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [menuOpen])

  const isHome = location.pathname === '/'
  const isRaceCalendar = location.pathname === '/races'
  const isDriverStandings = location.pathname === '/standings'
  const isCircuitWeather = location.pathname === '/weather'
  const isVehicleSearch = location.pathname === '/vehicles'
  const isLapTracker = location.pathname === '/lap-tracker'
  const isMotorsportNews = location.pathname === '/news'
  const usesTopHeroLayout =
    isHome ||
    isRaceCalendar ||
    isDriverStandings ||
    isCircuitWeather ||
    isVehicleSearch ||
    isLapTracker ||
    isMotorsportNews

  const footerRef = useRef(null)

  useLayoutEffect(() => {
    const isHomeRoute = location.pathname === '/'
    let rafId = 0

    function updateSidebarMid() {
      if (!window.matchMedia('(min-width: 1024px)').matches) {
        document.documentElement.style.removeProperty('--sidebar-mid-y')
        return
      }
      const footerEl = footerRef.current
      const vh = window.innerHeight
      const bandTop = isHomeRoute ? HOME_HERO_HEIGHT_PX : LOGO_BOTTOM_PX
      let bandBottom = vh
      if (footerEl) {
        const ft = footerEl.getBoundingClientRect().top
        bandBottom = Math.min(Math.max(ft, bandTop + 80), vh)
      }
      const span = bandBottom - bandTop
      const midY = bandTop + Math.max(span / 2, 48)
      document.documentElement.style.setProperty('--sidebar-mid-y', `${midY}px`)
    }

    function scheduleSidebarMid() {
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        updateSidebarMid()
      })
    }

    updateSidebarMid()
    const footerEl = footerRef.current
    const ro =
      footerEl && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(scheduleSidebarMid)
        : null
    if (footerEl && ro) ro.observe(footerEl)
    window.addEventListener('resize', scheduleSidebarMid, { passive: true })
    window.addEventListener('scroll', scheduleSidebarMid, { passive: true })

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      if (footerEl && ro) ro.unobserve(footerEl)
      ro?.disconnect()
      window.removeEventListener('resize', scheduleSidebarMid)
      window.removeEventListener('scroll', scheduleSidebarMid)
      document.documentElement.style.removeProperty('--sidebar-mid-y')
    }
  }, [location.pathname])

  useLayoutEffect(() => {
    if (prevMenuOpenRef.current === menuOpen) return
    prevMenuOpenRef.current = menuOpen
    setSidebarWidthAnimDone(false)
    if (sidebarAnimFallbackRef.current) {
      clearTimeout(sidebarAnimFallbackRef.current)
      sidebarAnimFallbackRef.current = null
    }
    sidebarAnimFallbackRef.current = setTimeout(() => {
      setSidebarWidthAnimDone(true)
      sidebarAnimFallbackRef.current = null
    }, 520)
    return () => {
      if (sidebarAnimFallbackRef.current) {
        clearTimeout(sidebarAnimFallbackRef.current)
        sidebarAnimFallbackRef.current = null
      }
    }
  }, [menuOpen])

  function handleDesktopAsideTransitionEnd(e) {
    if (e.target !== e.currentTarget) return
    if (e.propertyName !== 'width') return
    if (sidebarAnimFallbackRef.current) {
      clearTimeout(sidebarAnimFallbackRef.current)
      sidebarAnimFallbackRef.current = null
    }
    setSidebarWidthAnimDone(true)
  }

  return (
    <div className={`flex min-h-screen flex-col overflow-x-hidden ${pageShell}`}>
      <LogoBanner heroOverlay={usesTopHeroLayout} />

      {isHome && <HomeHero />}

      {/* Desktop: compacte staaf, verticaal gecentreerd in het venster onder de logo-balk */}
      <aside
        style={{
          top: 'var(--sidebar-mid-y, calc(6rem + (100dvh - 6rem) / 2))',
        }}
        onTransitionEnd={handleDesktopAsideTransitionEnd}
        className={`fixed left-0 z-50 hidden max-h-[min(calc(100dvh-5rem),56rem)] -translate-y-1/2 flex-col overflow-hidden rounded-r-2xl shadow-xl transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[width] lg:flex ${surface} ${
          menuOpen ? 'w-64' : 'w-[4.5rem]'
        }`}
      >
        <Header
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpenDeferred}
          desktopSidebarCollapseSettled={sidebarWidthAnimDone}
        />
      </aside>

      {/* Mobiel: compact vierkant rechtsboven in de hoek, niet half scherm */}
      {!menuOpen && (
        <button
          type="button"
          className={`fixed right-3 top-2 z-[70] ${sidebarIconBox} shadow-lg backdrop-blur-sm transition hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/45 dark:hover:bg-slate-600 lg:hidden sm:top-3`}
          onClick={() => setMenuOpenDeferred(true)}
          aria-label="Menu openen"
        >
          <MenuToggleIcon open={false} />
        </button>
      )}

      {menuOpen && (
        <div
          className={`fixed inset-0 z-[65] flex min-h-[100dvh] flex-col lg:hidden ${surface}`}
          role="dialog"
          aria-modal="true"
          aria-label="Hoofdnavigatie"
        >
          <Header
            variant="overlay"
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpenDeferred}
          />
        </div>
      )}

      {/* lg: inspring = smalle sidebar (4.5rem) + kleine lucht; aside left-0 */}
      <main
        className={`flex min-h-0 flex-1 flex-col pl-0 ${
          isRaceCalendar ||
          isDriverStandings ||
          isCircuitWeather ||
          isVehicleSearch ||
          isLapTracker ||
          isMotorsportNews
            ? 'lg:pl-0'
            : 'lg:pl-[5rem]'
        } ${
          usesTopHeroLayout ? 'pt-0' : 'pt-24'
        }`}
      >
        {apiUnavailable ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-10 md:px-10">
            <div className="w-full max-w-2xl">
              <ErrorMessage
                message="De API is momenteel niet beschikbaar. Controleer of de backend draait en probeer opnieuw."
                onRetry={checkApiHealth}
              />
            </div>
          </div>
        ) : (
          <div className="page-transition-enter flex min-h-0 flex-1 flex-col">
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center py-16">
                  <LoadingSpinner />
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/races" element={<RaceCalendar />} />
                <Route path="/standings" element={<DriverStandings />} />
                <Route path="/weather" element={<CircuitWeather />} />
                <Route path="/vehicles" element={<VehicleSearch />} />
                <Route path="/lap-tracker" element={<LapTracker />} />
                <Route path="/news" element={<MotorsportNews />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        )}
      </main>

      <Footer ref={footerRef} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
      <SpeedInsights />
    </BrowserRouter>
  )
}
