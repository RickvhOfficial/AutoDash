// -----------------------------------------------------------------------------
// Hoofdapplicatie-shell: Router, layout en gedeelde navigatiestate (menuOpen).
//
// Desktop-sidebar: zwevende kolom; `top` = `--sidebar-mid-y` (gemeten t.o.v. footer in viewport).
// Mobiel: LogoBanner + overlay-menu.

const LOGO_BOTTOM_PX = 96
// -----------------------------------------------------------------------------
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Header, { MenuToggleIcon } from './components/Header'
import LogoBanner from './components/LogoBanner'
import Footer from './components/Footer'
import ErrorMessage from './components/ErrorMessage'
import Home, { HomeHero, HOME_HERO_HEIGHT_PX } from './pages/Home'
import RaceCalendar from './pages/RaceCalendar'
import DriverStandings from './pages/DriverStandings'
import CircuitWeather from './pages/CircuitWeather'
import VehicleSearch from './pages/VehicleSearch'
import LapTracker from './pages/LapTracker'
import NotFound from './pages/NotFound'

function AppLayout() {
  const location = useLocation()

  // true = sidebar uitgeklapt (desktop) of mobiel menu zichtbaar
  const [menuOpen, setMenuOpen] = useState(false)
  // Desktop: pas na width-transitie narrow-layout (gecentreerde iconen); tijdens animatie links voor soepelere beweging
  const [sidebarWidthAnimDone, setSidebarWidthAnimDone] = useState(true)
  const prevMenuOpenRef = useRef(menuOpen)
  const sidebarAnimFallbackRef = useRef(null)
  const [apiUnavailable, setApiUnavailable] = useState(false)

  // Centrale API health-check: bij backend-uitval tonen we een globale foutmelding.
  const checkApiHealth = useRef(async () => {
    try {
      const res = await fetch('/health')
      setApiUnavailable(!res.ok)
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
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [menuOpen])

  const isHome = location.pathname === '/'
  const isRaceCalendar = location.pathname === '/races'
  const isDriverStandings = location.pathname === '/standings'
  const usesTopHeroLayout = isHome || isRaceCalendar || isDriverStandings

  const footerRef = useRef(null)

  useLayoutEffect(() => {
    const isHomeRoute = location.pathname === '/'
    function updateSidebarMid() {
      if (!window.matchMedia('(min-width: 1024px)').matches) {
        document.documentElement.style.removeProperty('--sidebar-mid-y')
        return
      }
      const footerEl = footerRef.current
      const vh = window.innerHeight
      // Op home loopt de hero 250px over de bovenkant; sidebar verticaal centreren tussen hero-onderkant en footer, niet tussen logo en footer (anders overlapte de hero).
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

    updateSidebarMid()
    const footerEl = footerRef.current
    const ro =
      footerEl && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateSidebarMid)
        : null
    if (footerEl && ro) ro.observe(footerEl)
    window.addEventListener('resize', updateSidebarMid)
    window.addEventListener('scroll', updateSidebarMid, { passive: true })

    return () => {
      if (footerEl && ro) ro.unobserve(footerEl)
      ro?.disconnect()
      window.removeEventListener('resize', updateSidebarMid)
      window.removeEventListener('scroll', updateSidebarMid)
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
    }, 600)
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
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-950 text-slate-100">
      <LogoBanner heroOverlay={usesTopHeroLayout} />

      {isHome && <HomeHero />}

      {/* Desktop: compacte staaf, verticaal gecentreerd in het venster onder de logo-balk */}
      <aside
        style={{
          top: 'var(--sidebar-mid-y, calc(6rem + (100dvh - 6rem) / 2))',
        }}
        onTransitionEnd={handleDesktopAsideTransitionEnd}
        className={`fixed left-0 z-50 hidden max-h-[min(calc(100dvh-7rem),52rem)] -translate-y-1/2 flex-col overflow-hidden rounded-r-2xl border border-slate-800 bg-slate-900 shadow-xl transition-[width] duration-500 ease-in-out lg:flex ${
          menuOpen ? 'w-64' : 'w-[4.5rem]'
        }`}
      >
        <Header
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          desktopSidebarCollapseSettled={sidebarWidthAnimDone}
        />
      </aside>

      {/* Mobiel: compact vierkant rechtsboven in de hoek, niet half scherm */}
      {!menuOpen && (
        <button
          type="button"
          className="fixed right-3 top-2 z-[70] inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/95 text-slate-200 shadow-lg backdrop-blur-sm transition hover:bg-slate-800 sm:top-3 lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Menu openen"
        >
          <MenuToggleIcon open={false} />
        </button>
      )}

      {menuOpen && (
        <div
          className="fixed inset-0 z-[65] flex min-h-[100dvh] flex-col bg-slate-900 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Hoofdnavigatie"
        >
          <Header
            variant="overlay"
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />
        </div>
      )}

      {/* lg: inspring = smalle sidebar (4.5rem) + kleine lucht; aside left-0 */}
      <main
        className={`flex min-h-0 flex-1 flex-col pl-0 ${
          isRaceCalendar || isDriverStandings ? 'lg:pl-0' : 'lg:pl-[5rem]'
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
          <div
            key={location.pathname}
            className="page-transition-enter flex min-h-0 flex-1 flex-col"
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/races" element={<RaceCalendar />} />
              <Route path="/standings" element={<DriverStandings />} />
              <Route path="/weather" element={<CircuitWeather />} />
              <Route path="/vehicles" element={<VehicleSearch />} />
              <Route path="/lap-tracker" element={<LapTracker />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
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
    </BrowserRouter>
  )
}
