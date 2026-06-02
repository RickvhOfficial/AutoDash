// Herbruikbaar foutblok met optionele retry-knop voor API widgets.
import { cardTextMuted } from '../utils/themeClasses'

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="rounded-lg border border-red-400 bg-red-50 p-6 text-center dark:border-red-500 dark:bg-red-900/20">
      <p className="mb-2 text-lg text-red-600 dark:text-red-400">
        ⚠️ Oeps! Er ging iets mis.
      </p>
      <p className={`mb-4 ${cardTextMuted}`}>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Probeer opnieuw
        </button>
      )}
    </div>
  )
}
