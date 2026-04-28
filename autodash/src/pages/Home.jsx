// Route: /. Hero tot boven aan het scherm; logo (fixed, transparant) ligt er visually overheen.
// `lg:-ml-[4.5rem] lg:w-[calc(100%+4.5rem)]`: full-bleed t.o.v. sidebar-padding op <main>.
const HERO_IMG =
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1920&q=80'

export default function Home() {
  return (
    <div className="flex flex-col bg-slate-950 text-slate-100">
      <section className="relative w-full border-b border-slate-800 lg:-ml-[4.5rem] lg:w-[calc(100%+4.5rem)]">
        <div className="relative h-[clamp(11rem,18svh,13.5rem)] w-full sm:h-[clamp(12rem,20svh,15rem)]">
          <img
            src={HERO_IMG}
            alt="Sportauto — hero"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Iets donkerder onder het logo zodat het PNG-blok leesbaar blijft */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/15 to-slate-950/70" />
          <div className="absolute inset-x-0 bottom-0 px-4 pb-5 pt-10 sm:px-6 md:px-10 md:pb-6">
            <h1 className="text-3xl font-semibold drop-shadow md:text-4xl">
              Welkom bij AutoDash
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200 drop-shadow md:text-base">
              Jouw dashboard voor races, tijden en weer op het circuit.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-10 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="flex min-h-36 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-center">
              <h2 className="text-sm font-medium">Are youself track it here</h2>
            </article>
            <article className="flex min-h-36 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-center">
              <h2 className="text-sm font-medium">Next race info</h2>
            </article>
            <article className="flex min-h-36 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-center">
              <h2 className="text-sm font-medium">Next track weather</h2>
            </article>
            <article className="flex min-h-36 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-center">
              <h2 className="text-sm font-medium">Leader board</h2>
            </article>
          </div>

          <article className="flex min-h-[304px] items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-center">
            <h2 className="text-sm font-medium">Top times info</h2>
          </article>
        </div>
      </section>
    </div>
  )
}
