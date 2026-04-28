// Voet van elke pagina. `lg:pl-20` sluit aan bij de desktop-sidebar-layout; mobiel heeft minder inspring (`pl-4`).
export default function Footer() {
  return (
    <footer className="min-h-32 border-t border-slate-800 bg-slate-950 pl-4 lg:pl-20">
      <div className="flex min-h-[inherit] flex-col justify-center px-6 py-12 md:px-10">
        <p className="text-center text-sm text-slate-300">Footer</p>
      </div>
    </footer>
  )
}
