export default function LoadingSpinner({ message = 'Data laden...' }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="loading-spinner-disc mb-4 shrink-0" aria-hidden="true" />
      <p className="text-gray-400">{message}</p>
    </div>
  )
}
