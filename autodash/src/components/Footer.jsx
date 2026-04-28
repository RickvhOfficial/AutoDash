// Voet van elke pagina. `lg:pl-[4.5rem]` sluit aan bij de desktop-sidebar-layout; mobiel heeft minder inspring (`pl-4`).
const GITHUB_REPO = 'https://github.com/RickvhOfficial/AutoDash'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto min-h-32 border-t border-slate-800 bg-slate-950 pl-4 lg:pl-[4.5rem]">
      <div className="mx-auto flex min-h-[inherit] max-w-6xl flex-col justify-center px-6 py-10 text-center md:px-10">
        <p className="text-xl font-bold text-slate-100">AutoDash</p>
        <p className="mt-2 italic text-slate-400">
          Driven by Code. Addicted to Speed.
        </p>
        <p className="mt-4 text-slate-300">
          Gemaakt door RickvhOfficial{' '}
          <span className="text-slate-500">|</span>{' '}
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 font-medium text-red-500 underline-offset-2 transition hover:text-red-400 hover:underline"
          >
            GitHub
          </a>
        </p>
        <p className="mt-3 text-sm text-slate-500">© {year} AutoDash</p>
      </div>
    </footer>
  )
}
