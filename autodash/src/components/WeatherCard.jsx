import { weatherCodeToIcon, weatherCodeToLabelNl } from '../services/weatherService'

export default function WeatherCard({
  dayLabel,
  weathercode,
  tempMax,
  tempMin,
  precipitationMm,
  windKmh,
}) {
  const code = Number(weathercode)
  const icon = weatherCodeToIcon(code)
  const label = weatherCodeToLabelNl(code)

  return (
    <article className="flex w-full min-h-[10.75rem] flex-col gap-2 rounded-xl border border-slate-700/90 bg-slate-900/80 px-3 py-3 shadow-sm">
      <p className="text-center text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
        {dayLabel}
      </p>
      <p className="text-center text-2xl leading-none" aria-hidden>
        {icon}
      </p>
      <p className="text-center text-sm font-bold text-white">
        {tempMax != null ? `${Math.round(tempMax)} °C` : '—'}{' '}
        <span className="text-[0.7rem] font-medium text-slate-400">
          {tempMin != null ? `${Math.round(tempMin)} °C` : ''}
        </span>
      </p>
      <p className="text-center text-xs text-slate-300">
        {precipitationMm != null ? `${Number(precipitationMm).toFixed(1)} mm` : '—'}
      </p>
      <p className="text-center text-[0.68rem] leading-snug text-slate-400">{label}</p>
      <p className="mt-auto border-t border-slate-800 pt-2 text-center text-[0.68rem] text-slate-400">
        Wind{' '}
        <span className="font-medium text-slate-200">
          {windKmh != null ? `${Math.round(windKmh)} km/u` : '—'}
        </span>
      </p>
    </article>
  )
}
