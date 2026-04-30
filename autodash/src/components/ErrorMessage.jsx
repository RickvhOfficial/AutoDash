// Herbruikbaar foutblok met optionele retry-knop voor API widgets.
export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="rounded-lg border border-red-500 bg-red-900/20 p-6 text-center">
      <p className="mb-2 text-lg text-red-400">
        ⚠️ Oeps! Er ging iets mis.
      </p>
      <p className="mb-4 text-gray-300">{message}</p>
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
