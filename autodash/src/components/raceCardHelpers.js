import {
  raceNextRow,
  raceNextRowBadge,
  tableRow,
  statusUpcomingBadge,
  cardTextMuted,
} from '../utils/themeClasses'

export function getStatusStyle(status, isNextRace = false) {
  if (isNextRace) {
    return {
      card: raceNextRow,
      badge: `min-w-[8rem] rounded-md px-4 py-2 text-center text-sm font-extrabold ${raceNextRowBadge}`,
    }
  }
  if (status === 'Voorbij') {
    return {
      card: `${tableRow} theme-fill-row-open`,
      badge: `min-w-[6.5rem] rounded-md border theme-border theme-fill-row-open px-3 py-1.5 text-center text-xs font-semibold ${cardTextMuted}`,
    }
  }
  if (status === 'Dit weekend') {
    return {
      card: `${tableRow} border-red-400/80 theme-fill-muted ring-1 ring-red-400/25 dark:border-red-600/80 dark:ring-red-500/25`,
      badge:
        'min-w-[6.5rem] rounded-md border border-red-600 bg-red-600 px-3 py-1.5 text-center text-xs font-semibold text-white dark:border-red-500/90 dark:bg-red-900/70',
    }
  }
  return {
    card: tableRow,
    badge: `min-w-[6.5rem] rounded-md border px-3 py-1.5 text-center text-xs font-semibold ${statusUpcomingBadge}`,
  }
}

function parseDateOnly(isoDateString) {
  if (!isoDateString || typeof isoDateString !== 'string') return null
  const datePart = isoDateString.split('T')[0]
  if (!datePart) return null
  return new Date(`${datePart}T00:00:00Z`)
}

export function formatDateRange(dateStart, dateEnd) {
  const start = parseDateOnly(dateStart)
  const end = parseDateOnly(dateEnd || dateStart)
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Datum onbekend'
  }
  const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' }
  const startLabel = start.toLocaleDateString('nl-NL', dateOptions)
  const endLabel = end.toLocaleDateString('nl-NL', dateOptions)
  return `${startLabel} t/m ${endLabel}`
}
