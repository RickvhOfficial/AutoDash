export default function LoadingSpinner({ message = 'Data laden...', compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${compact ? 'py-4' : 'py-16'}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="loading-spinner-disc mb-4 shrink-0" aria-hidden="true" />
      {message ? <p className="text-gray-400">{message}</p> : null}
    </div>
  )
}
