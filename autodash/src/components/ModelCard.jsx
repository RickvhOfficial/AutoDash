import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCar } from '@fortawesome/free-solid-svg-icons'

export default function ModelCard({ model, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(model)}
      className="flex w-full flex-col gap-2 rounded-xl border border-slate-700/90 bg-slate-900/80 px-4 py-4 text-left shadow-sm transition-transform duration-200 ease-out hover:scale-[1.015] hover:border-slate-600 hover:bg-slate-800/90 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/60"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {model.Make_Name}
        </p>
        <FontAwesomeIcon icon={faCar} className="mt-0.5 shrink-0 text-sm text-red-500/80" />
      </div>
      <h3 className="text-lg font-bold text-white">{model.Model_Name}</h3>
    </button>
  )
}
