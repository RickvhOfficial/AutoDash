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
    <article className="flex min-w-[7.5rem] flex-1 flex-col gap-2 rounded-xl border border-slate-700/90 bg-slate-900/80 px-3 py-3 shadow-sm sm:min-w-[8.5rem]">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        {dayLabel}
      </p>
      <p className="text-center text-3xl leading-none" aria-hidden>
        {icon}
      </p>
      <p className="text-center text-sm font-bold text-white">
        {tempMax != null ? `${Math.round(tempMax)} °C` : '—'}{' '}
        <span className="font-medium text-slate-400">
          {tempMin != null ? `${Math.round(tempMin)} °C` : ''}
        </span>
      </p>
      <p className="text-center text-xs text-slate-300">
        {precipitationMm != null ? `${Number(precipitationMm).toFixed(1)} mm` : '—'}
      </p>
      <p className="text-center text-[0.7rem] leading-snug text-slate-400">{label}</p>
      <p className="mt-auto border-t border-slate-800 pt-2 text-center text-xs text-slate-400">
        Wind{' '}
        <span className="font-medium text-slate-200">
          {windKmh != null ? `${Math.round(windKmh)} km/u` : '—'}
        </span>
      </p>
    </article>
  )
}
