// Vast logo linksboven (`z-[60]`). Op home (`heroOverlay`): transparante strip over de hero; elders volle breedte met donkere balk.
// Desktop: zelfde logobreedte als voorheen (`lg:w-64` kolom) + `object-cover` zodat het logo die hele headerstrook vult.
// Balkhoogte h-24 — gelijk met `top-24` / `pt-24` in App en de desktop-sidebar.
export default function LogoBanner({ heroOverlay = false }) {
  return (
    <div
      className={`pointer-events-none fixed left-0 top-0 z-[60] flex h-24 w-full items-stretch pr-14 sm:pr-6 lg:pr-0 ${
        heroOverlay
          ? 'border-transparent bg-transparent'
          : 'border-b border-slate-800 bg-slate-950'
      }`}
    >
      <div className="pointer-events-auto box-border h-full min-w-0 flex-1 pl-3 sm:pl-4 lg:w-64 lg:flex-none lg:pl-0">
        <img
          src="/Logo.png"
          alt="AutoDash logo"
          className="box-border h-full w-full max-h-full object-contain object-left lg:object-cover lg:object-left"
        />
      </div>
    </div>
  )
}
