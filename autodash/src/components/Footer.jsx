// Voet van elke pagina. Desktop: vaste inspring gelijk aan <main> (smalle sidebar).
// ref: voor verticale sidebar-positie (meet footer t.o.v. viewport).
import { forwardRef } from 'react'
import { borderSubtle, pageShell, textFaint, textMuted } from '../utils/themeClasses'

const GITHUB_REPO = 'https://github.com/RickvhOfficial/AutoDash'

const Footer = forwardRef(function Footer(_props, ref) {
  const year = new Date().getFullYear()

  return (
    <footer
      ref={ref}
      className={`mt-auto h-[250px] max-h-[250px] shrink-0 overflow-hidden border-t ${borderSubtle} ${pageShell}`}
    >
      <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col justify-center overflow-y-auto px-6 py-6 text-center md:px-10 md:py-8">
        <img
          src="/Logo.png"
          alt="AutoDash logo"
          className="mx-auto block h-auto max-h-16 w-auto max-w-[min(100%,12rem)] shrink-0 object-contain object-center pb-3 md:pb-4"
        />
        <p className={`shrink-0 text-sm italic md:text-base ${textFaint}`}>
          Driven <span className="text-red-600">by</span> Code. Addicted <span className="text-red-600">to</span> Speed.
        </p>
        <p className={`mt-2 shrink-0 text-sm md:text-base ${textMuted}`}>
          Gemaakt door RickvhOfficial{' '}
          <span className={textFaint}>|</span>{' '}
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 font-medium text-[#d50000] underline-offset-2 transition-colors duration-200 hover:text-red-400"
          >
            GitHub
          </a>
        </p>
        <p className={`mt-2 shrink-0 text-xs md:text-sm ${textFaint}`}>© {year} AutoDash</p>
      </div>
    </footer>
  )
})

export default Footer

Footer.displayName = 'Footer'
