// Vast logo linksboven (`z-[60]`). Op home (`heroOverlay`): transparante strip over de hero; elders volle breedte met donkere balk.
// `object-contain` + `items-center`: cutout/PNG schaalt binnen h24 zonder bij te snijden; `lg:w-64`-kolom blijft het plakgebied.
// Balkhoogte h-24 — gelijk met `top-24` / `pt-24` in App en de desktop-sidebar.
export default function LogoBanner({ heroOverlay = false }) {
  return (
    <div
      className={`logo-banner pointer-events-none fixed left-0 top-0 z-[60] flex h-24 w-full items-stretch pr-14 sm:pr-6 lg:pr-0 ${
        heroOverlay
          ? 'border-transparent bg-transparent'
          : 'border-b border-slate-800 bg-slate-950'
      }`}
    >
      <div className="logo-banner-inner pointer-events-auto box-border flex h-full min-w-0 flex-1 items-center py-2 pl-3 pr-2 sm:pl-4 sm:pr-3 lg:w-64 lg:flex-none lg:pl-3 lg:pr-2">
        <a
          href="/"
          className="block h-full w-full"
        >
        <img
          src="/Logo.png"
          alt="AutoDash logo"
          className="logo-banner-image box-border h-full max-h-full w-auto max-w-full object-contain object-left [mix-blend-mode:screen]"
        />
        </a>
      </div>
    </div>
  )
}
