// Content-blok onder een hero: centreert inhoud horizontaal in de ruimte tussen
// hero-banner en footer. Op desktop reserveren we 4.5rem links voor de vaste sidebar.
export default function PageMainContent({
  children,
  className = '',
  maxWidth = 'max-w-6xl',
}) {
  return (
    <section
      className={`relative z-0 flex min-h-0 flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:py-14 ${className}`}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col lg:flex-row">
        <div className="hidden shrink-0 lg:block lg:w-[4.5rem]" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className={`mx-auto w-full ${maxWidth}`}>{children}</div>
        </div>
      </div>
    </section>
  )
}
