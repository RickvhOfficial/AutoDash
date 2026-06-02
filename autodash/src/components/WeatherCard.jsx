import { weatherCodeToIcon, weatherCodeToLabelNl } from '../services/weatherService'

import { weatherForecastCard, textFaint, cardText, cardTextMuted, cardTextSoft } from '../utils/themeClasses'

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
    <article className={`flex w-full min-h-[10.75rem] flex-col gap-2 rounded-xl px-3 py-3 shadow-sm ${weatherForecastCard}`}>
      <p className={`text-center text-[0.65rem] font-semibold uppercase tracking-wide ${textFaint}`}>
        {dayLabel}
      </p>
      <p className="text-center text-2xl leading-none" aria-hidden>
        {icon}
      </p>
      <p className={`text-center text-sm font-bold ${cardText}`}>
        {tempMax != null ? `${Math.round(tempMax)} °C` : '—'}{' '}
        <span className={`text-[0.7rem] font-medium ${textFaint}`}>
          {tempMin != null ? `${Math.round(tempMin)} °C` : ''}
        </span>
      </p>
      <p className={`text-center text-xs ${cardTextMuted}`}>
        {precipitationMm != null ? `${Number(precipitationMm).toFixed(1)} mm` : '—'}
      </p>
      <p className={`text-center text-[0.68rem] leading-snug ${textFaint}`}>{label}</p>
      <p className={`mt-auto pt-2 text-center text-[0.68rem] ${textFaint}`}>
        Wind{' '}
        <span className={`font-medium ${cardTextSoft}`}>
          {windKmh != null ? `${Math.round(windKmh)} km/u` : '—'}
        </span>
      </p>
    </article>
  )
}
