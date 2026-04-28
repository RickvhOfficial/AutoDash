// -----------------------------------------------------------------------------
// Hoofdapplicatie-shell: Router, layout en gedeelde navigatie-state (menuOpen).
//
// Responsive gedrag:
// - Vanaf breakpoint `lg` (1024px): vaste linker sidebar zoals ingesteld onder de LogoBanner.
// - Kleiner dan `lg`: sidebar verborgen; zwevend vierkant hamburger-icoon rechtsboven opent fullscreen-overlay.
//
// Route-wissels: lichte animatie via `.page-transition-enter` (key op wrapper rond Routes).
// -----------------------------------------------------------------------------
import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Header, { MenuToggleIcon } from './components/Header'
import LogoBanner from './components/LogoBanner'
import Footer from './components/Footer'
import Home from './pages/Home'
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <LogoBanner />

      {/* Desktop: zichtbaar vanaf lg */}
      <aside
        className={`hidden lg:flex fixed left-0 top-20 z-50 h-[calc(100vh-5rem)] flex-col overflow-hidden border-r border-slate-700 bg-slate-900 transition-all duration-500 ease-in-out ${
          menuOpen ? 'w-64' : 'w-[4.157rem]'
        }`}
      >
        <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      </aside>

      {/* Mobiel: compact vierkant rechtsboven in de hoek, niet half scherm */}
      {!menuOpen && (
        <button
          type="button"
          className="fixed right-3 top-4 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/95 text-slate-200 shadow-lg backdrop-blur-sm transition hover:bg-slate-800 lg:hidden"
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

      {/* key + location op Routes voor soepele overgang tussen pagina's */}
      <main className="flex-1 pt-20 pl-0 lg:pl-[4.5rem]">
        <div key={location.pathname} className="page-transition-enter">
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
      </main>

      <Footer />
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
