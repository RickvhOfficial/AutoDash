export default function LoadingSpinner({ message = 'Data laden...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div
        className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"
      />
      <p className="text-gray-400">{message}</p>
    </div>
  )
}
