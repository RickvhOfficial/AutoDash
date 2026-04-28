// Vaste logo-strip linksboven (h-20). Hoofdcontent begint daaronder (`pt-20` in App); sidebar start op `top-20`.
// Mobiel: volle breedte voor een groter logo; `pr-14` houdt ruimte vrij voor het vierkante hamburger-knopje rechts.
// Desktop: `lg:w-64` zoals de grid-layout.
export default function LogoBanner() {
  return (
    <div className="fixed left-0 top-0 z-[60] h-20 w-full max-lg:pr-14 border-b border-slate-700 bg-slate-950 lg:w-64 lg:border-r lg:pr-0">
      <img
        src="/Logo.png"
        alt="AutoDash logo"
        className="box-border h-full w-full object-contain object-left lg:object-cover"
      />
    </div>
  )
}
