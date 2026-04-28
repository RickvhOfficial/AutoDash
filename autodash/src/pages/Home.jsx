// Route: /. Startpagina met hero-placeholder en teaser-grid (later echte content/API).
// min-h-[calc(100svh-13rem)]: ruimte voor vaste header + Footer; justify-center centrering op de pagina-as.
export default function Home() {
  return (
    <div className="flex min-h-[calc(100svh-13rem)] flex-col justify-center gap-10 bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-6xl rounded-xl border border-slate-700 bg-slate-900/60 p-10 text-center">
          {/* Plaats hier later je hero-afbeelding (bijv. background-image op deze div of <img>). */}
          <h1 className="text-3xl font-semibold md:text-4xl">Welkom bij AutoDash</h1>
          <p className="mt-3 text-sm text-slate-300 md:text-base">
            Hero placeholder voor hoofdafbeelding en introtekst.
          </p>
        </div>
      </section>

      <section className="px-6 py-10 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="flex min-h-36 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-center">
              <h2 className="text-sm font-medium">Are youself track it here</h2>
            </article>
            <article className="flex min-h-36 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-center">
              <h2 className="text-sm font-medium">Next race info</h2>
            </article>
            <article className="flex min-h-36 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-center">
              <h2 className="text-sm font-medium">Next track weather</h2>
            </article>
            <article className="flex min-h-36 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-center">
              <h2 className="text-sm font-medium">Leader board</h2>
            </article>
          </div>

          <article className="flex min-h-[304px] items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-center">
            <h2 className="text-sm font-medium">Top times info</h2>
          </article>
        </div>
      </section>
    </div>
  )
}
