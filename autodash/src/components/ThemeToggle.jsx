import { useTheme } from '../hooks/useTheme'



export default function ThemeToggle({ className = '', showLabel = false }) {

  const { isDark, toggleTheme } = useTheme()

  const label = isDark ? 'Licht' : 'Donker'



  return (

    <button

      type="button"

      onClick={toggleTheme}

      className={`inline-flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 transition-colors theme-hover-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/45 dark:hover:bg-slate-800 ${

        showLabel ? 'min-w-[3.25rem]' : 'size-9'

      } ${className}`}

      aria-label={isDark ? 'Schakel naar licht thema' : 'Schakel naar donker thema'}

      title={isDark ? 'Licht thema' : 'Donker thema'}

    >

      <span className="text-lg leading-none" aria-hidden>

        {isDark ? '☀️' : '🌙'}

      </span>

      {showLabel ? (

        <span className="text-[0.625rem] font-semibold uppercase leading-none tracking-wide theme-text-muted">

          {label}

        </span>

      ) : (

        <span className="sr-only">{label}</span>

      )}

    </button>

  )

}

