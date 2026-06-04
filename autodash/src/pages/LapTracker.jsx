// Route: /lap-tracker — persoonlijke karttijden registreren en analyseren.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ErrorMessage from '../components/ErrorMessage'
import SafeImg from '../components/SafeImg'
import PageMainContent from '../components/PageMainContent'
import { useLapTimes } from '../hooks/useLapTimes'
import { HOME_HERO_HEIGHT_CLASS } from '../constants/layout'
import {
  borderDefault,
  borderSubtle,
  cardText,
  cardTextMuted,
  dropdownItem,
  dropdownMenu,
  filterChipActive,
  filterChipIdle,
  heroOverlay,
  inputField,
  lapPrBanner,
  lapPrDeletePanel,
  lapBestRowHighlight,
  lapBestRowHighlightMobile,
  modalBackdrop,
  modalBackdropStrong,
  modalPanel,
  pageShell,
  panel,
  panelMuted,
  secondaryButton,
  statCard,
  surface,
  fillCard,
  fillCardMobile,
  fillRowOpen,
  tableBody,
  tableHeader,
  tableWrap,
  textFaint,
  textMuted,
  textOnPhoto,
  toolbarStrip,
  tooltipBox,
} from '../utils/themeClasses'
import {
  computeLapStatsForFilter,
  enrichLaps,
  getBestTimeMs,
  isLapTrackPersonalBest,
  isValidLapTime,
  KART_TYPES,
  sortLaps,
  getTrackPrCelebrationInfo,
  formatLapTimeInput,
  completeLapTimeInput,
} from '../utils/lapStorage'

const PR_CELEBRATION_MS = 8000
const PR_EXIT_ANIMATION_MS = 500
const LAP_PAGE_SIZE = 12

const HERO_IMG =
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1920&q=80'
const HERO_FALLBACK = '/RaceKalender.jpg'

const ALL_TRACKS = ''

const inputClass =
  `w-full rounded-lg px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/60 ${inputField}`

function isNoteInteractionTarget(target) {
  return Boolean(target?.closest?.('[data-note-trigger], [data-note-popup]'))
}

function LapNoteCell({ value, rowId, isOpen, onOpen, textClassName = textFaint }) {
  const textRef = useRef(null)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const text = value?.trim() ?? ''
  const showFull = isOverflowing || text.length > 32

  useLayoutEffect(() => {
    const el = textRef.current
    if (!el) return
    setIsOverflowing(el.scrollWidth > el.clientWidth)
  }, [text])

  function stopPropagation(e) {
    e.stopPropagation()
  }

  function handleOpen(e) {
    stopPropagation(e)
    if (!showFull) return
    onOpen(rowId, text)
  }

  if (!text) {
    return <span className={`min-w-0 truncate text-left ${textClassName}`}>—</span>
  }

  return (
    <span
      className="relative block min-w-0"
      onClick={stopPropagation}
      onPointerDown={stopPropagation}
      onKeyDown={stopPropagation}
    >
      <button
        type="button"
        data-note-trigger
        data-note-row-id={rowId}
        onClick={handleOpen}
        onPointerDown={stopPropagation}
        className={`block w-full min-w-0 text-left ${textClassName} ${
          showFull
            ? `cursor-pointer hover:text-slate-900 focus:outline-none focus-visible:text-red-400 dark:hover:text-slate-100 ${isOpen ? 'text-red-400' : ''}`
            : 'cursor-default'
        }`}
      >
        <span ref={textRef} className="block truncate">
          {text}
        </span>
      </button>
    </span>
  )
}

function LapNotePopup({ openNote, onClose }) {
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    if (!openNote) return undefined

    function findTrigger() {
      return document.querySelector(`[data-note-row-id="${CSS.escape(openNote.rowId)}"]`)
    }

    function updatePosition() {
      const trigger = findTrigger()
      if (!trigger) {
        onClose()
        return
      }
      const rect = trigger.getBoundingClientRect()
      const offScreen =
        rect.bottom < 0 ||
        rect.top > window.innerHeight ||
        rect.right < 0 ||
        rect.left > window.innerWidth
      if (offScreen) {
        onClose()
        return
      }
      setPos({ top: rect.bottom + 8, left: rect.left })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [openNote, onClose])

  useEffect(() => {
    if (!openNote) return undefined

    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }

    function onClick(e) {
      if (isNoteInteractionTarget(e.target)) return
      onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    const timer = window.setTimeout(() => document.addEventListener('click', onClick), 0)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(timer)
      document.removeEventListener('click', onClick)
    }
  }, [openNote, onClose])

  if (!openNote) return null

  return createPortal(
    <div
      role="tooltip"
      data-note-popup
      className={`${tooltipBox} cursor-pointer`}
      style={{ top: pos.top, left: pos.left }}
      onClick={onClose}
    >
      {openNote.text}
    </div>,
    document.body
  )
}

function LapTablePagination({ page, totalPages, totalResults, onPageChange, position = 'top' }) {
  if (totalPages <= 1) return null

  const borderClass = position === 'bottom' ? 'border-t' : 'border-b'

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 ${borderClass} ${borderSubtle} ${toolbarStrip} px-4 py-3`}
    >
      <p className={`text-sm ${textFaint}`}>
        Pagina {page + 1} van {totalPages} ({totalResults} rondes)
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className={`${secondaryButton} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          Vorige
        </button>
        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className={`${secondaryButton} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          Volgende
        </button>
      </div>
    </div>
  )
}

function formatDateNl(isoDate) {
  const d = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function LapTracker() {
  const { data, saveLap, deleteLap } = useLapTimes()

  const [trackName, setTrackName] = useState('')
  const [trackSuggestOpen, setTrackSuggestOpen] = useState(false)
  const trackFieldRef = useRef(null)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('')
  const [kartType, setKartType] = useState(KART_TYPES[0])
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState('')
  const [storageError, setStorageError] = useState('')

  const [selectedTrackId, setSelectedTrackId] = useState(ALL_TRACKS)
  const [sortMode, setSortMode] = useState('date')
  const [prCelebration, setPrCelebration] = useState(null)
  const [prCelebrationExiting, setPrCelebrationExiting] = useState(false)
  const [highlightLapId, setHighlightLapId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [lapPage, setLapPage] = useState(0)
  const [openNote, setOpenNote] = useState(null)

  const trackFilter = selectedTrackId || null

  const enrichedLaps = useMemo(
    () => enrichLaps(data, trackFilter),
    [data, trackFilter]
  )

  const displayLaps = useMemo(
    () => sortLaps(enrichedLaps, sortMode),
    [enrichedLaps, sortMode]
  )

  const lapTotalPages = Math.max(1, Math.ceil(displayLaps.length / LAP_PAGE_SIZE))
  const safeLapPage = Math.min(lapPage, lapTotalPages - 1)

  const paginatedLaps = useMemo(() => {
    const start = safeLapPage * LAP_PAGE_SIZE
    return displayLaps.slice(start, start + LAP_PAGE_SIZE)
  }, [displayLaps, safeLapPage])

  const closeNotePopup = useCallback(() => setOpenNote(null), [])

  const handleNoteOpen = useCallback((rowId, text) => {
    setOpenNote({ rowId, text })
  }, [])

  const goToLapPage = useCallback(
    (nextPage) => {
      closeNotePopup()
      setLapPage(Math.max(0, Math.min(lapTotalPages - 1, nextPage)))
    },
    [lapTotalPages, closeNotePopup]
  )

  const allTracksView = selectedTrackId === ALL_TRACKS
  const globalBestMs = useMemo(() => {
    if (!allTracksView) return null
    return getBestTimeMs(enrichLaps(data, null))
  }, [data, allTracksView])

  const stats = useMemo(
    () => computeLapStatsForFilter(data, trackFilter),
    [data, trackFilter]
  )

  const sortedTracks = useMemo(
    () => [...data.tracks].sort((a, b) => a.name.localeCompare(b.name, 'nl')),
    [data.tracks]
  )

  const filteredTracks = useMemo(() => {
    const term = trackName.trim().toLowerCase()
    if (!term) return sortedTracks
    return sortedTracks.filter((t) => t.name.toLowerCase().includes(term))
  }, [sortedTracks, trackName])

  const statsScopeHint = stats.scopedTrackName
    ? `Statistieken: ${stats.scopedTrackName}`
    : null

  useEffect(() => {
    if (!trackSuggestOpen) return undefined
    function handlePointerDown(e) {
      if (trackFieldRef.current && !trackFieldRef.current.contains(e.target)) {
        setTrackSuggestOpen(false)
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setTrackSuggestOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [trackSuggestOpen])

  useEffect(() => {
    if (!prCelebration) return undefined
    const hideTimer = setTimeout(
      () => setPrCelebrationExiting(true),
      PR_CELEBRATION_MS - PR_EXIT_ANIMATION_MS
    )
    const clearTimer = setTimeout(() => {
      setPrCelebration(null)
      setPrCelebrationExiting(false)
      setHighlightLapId(null)
    }, PR_CELEBRATION_MS)
    return () => {
      clearTimeout(hideTimer)
      clearTimeout(clearTimer)
    }
  }, [prCelebration])

  useEffect(() => {
    if (!deleteConfirm) return undefined
    function handleKeyDown(e) {
      if (e.key === 'Escape') setDeleteConfirm(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [deleteConfirm])

  function selectTrackSuggestion(name) {
    setTrackName(name)
    setTrackSuggestOpen(false)
  }

  function handleTimeChange(raw) {
    setTime(formatLapTimeInput(raw))
  }

  function handleTimeBlur() {
    setTime((prev) => completeLapTimeInput(prev))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setStorageError('')
    const trimmedTime = completeLapTimeInput(time.trim())
    if (!isValidLapTime(trimmedTime)) {
      setFormError('Ongeldige tijd. Typ bijv. 123456 voor 1:23.456 (min : sec . ms).')
      return
    }
    try {
      const trimmedName = trackName.trim()
      const prInfo = getTrackPrCelebrationInfo(data, trimmedName, trimmedTime)
      const result = saveLap({ trackName: trimmedName, date, time: trimmedTime, kartType, note })
      if (prInfo) {
        setPrCelebrationExiting(false)
        setPrCelebration({
          trackName: result.track.name,
          time: trimmedTime,
          ...prInfo,
        })
        setHighlightLapId(result.lap.id)
      }
      setTime('')
      setNote('')
      setLapPage(0)
    } catch (err) {
      const msg = err?.message ?? 'Opslaan mislukt.'
      if (msg.includes('localStorage')) setStorageError(msg)
      else setFormError(msg)
    }
  }

  function requestDelete(lap) {
    const isTrackPr = isLapTrackPersonalBest(data, lap.id)
    setDeleteConfirm({
      lapId: lap.id,
      trackName: lap.trackName,
      time: lap.time,
      date: lap.date,
      isTrackPr,
    })
  }

  function handleDelete(lapId) {
    setStorageError('')
    try {
      deleteLap(lapId)
      setDeleteConfirm(null)
      closeNotePopup()
      setLapPage(0)
    } catch (err) {
      setStorageError(err?.message ?? 'Verwijderen mislukt.')
    }
  }

  return (
    <section className={`flex min-h-0 flex-1 flex-col ${pageShell}`}>
      <div
        className={`relative w-full shrink-0 border-b ${HOME_HERO_HEIGHT_CLASS} ${borderSubtle}`}
      >
        <SafeImg
          src={HERO_IMG}
          fallbackSrc={HERO_FALLBACK}
          alt="Karting op het circuit — hero"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className={`absolute inset-0 ${heroOverlay}`} />
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="w-full px-6 py-7 md:px-10">
            <h1 className={`pl-12 text-3xl font-extrabold tracking-tight md:text-4xl ${textOnPhoto}`}>
              Mijn Karttijden Tracker
            </h1>
          </div>
        </div>
      </div>

      <PageMainContent>
        {storageError && (
          <div className="mb-6">
            <ErrorMessage message={storageError} onRetry={() => setStorageError('')} />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`relative mb-6 overflow-visible rounded-xl ${panel}`}
        >
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end lg:gap-y-1">
            <div className="relative block min-w-0 lg:col-start-1" ref={trackFieldRef}>
              <span className={`mb-1 block text-xs font-medium uppercase tracking-wide ${textFaint}`}>
                Track naam
              </span>
              <input
                type="text"
                value={trackName}
                onChange={(e) => {
                  setTrackName(e.target.value)
                  setTrackSuggestOpen(true)
                }}
                onFocus={() => setTrackSuggestOpen(true)}
                onClick={() => setTrackSuggestOpen(true)}
                placeholder="Kies of typ baannaam"
                className={inputClass}
                required
                autoComplete="off"
                role="combobox"
                aria-expanded={trackSuggestOpen}
                aria-controls="track-suggest-listbox"
                aria-autocomplete="list"
              />
              {trackSuggestOpen && (
                <ul
                  id="track-suggest-listbox"
                  role="listbox"
                  className={`absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto ${dropdownMenu}`}
                >
                  {sortedTracks.length === 0 ? (
                    <li className={`px-3 py-2.5 text-sm ${textFaint}`}>Nog geen locaties.</li>
                  ) : filteredTracks.length === 0 ? (
                    <li className={`px-3 py-2.5 text-sm ${textFaint}`}>
                      Geen banen gevonden voor &quot;{trackName.trim()}&quot;
                    </li>
                  ) : (
                    filteredTracks.map((t) => (
                      <li key={t.id} role="option">
                        <button
                          type="button"
                          className={dropdownItem}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectTrackSuggestion(t.name)}
                        >
                          {t.name}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            <label className="block min-w-0 lg:col-start-2">
              <span className={`mb-1 block text-xs font-medium uppercase tracking-wide ${textFaint}`}>
                Datum
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputClass} h-[42px]`}
                required
              />
            </label>

            <label className="block min-w-0 lg:col-start-3 lg:row-start-1">
              <span className={`mb-1 block text-xs font-medium uppercase tracking-wide ${textFaint}`}>
                Tijd
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                onBlur={handleTimeBlur}
                placeholder="01:23.456"
                maxLength={10}
                aria-describedby="lap-time-hint"
                className={`${inputClass} h-[42px] font-mono tracking-wide`}
                required
              />
            </label>

            <p
              id="lap-time-hint"
              className={`min-w-0 text-[11px] leading-snug ${textFaint} lg:col-start-3 lg:row-start-2 lg:pt-0.5`}
            >
              Typ alleen cijfers. Geen tekens.
            </p>

            <label className="block min-w-0 lg:col-start-4 lg:row-start-1">
              <span className={`mb-1 block text-xs font-medium uppercase tracking-wide ${textFaint}`}>
                Kart type
              </span>
              <select
                value={kartType}
                onChange={(e) => setKartType(e.target.value)}
                className={`${inputClass} h-[42px]`}
              >
                {KART_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="h-[42px] shrink-0 rounded-lg bg-[#d50000] px-6 text-sm font-bold text-white transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/80 lg:col-start-5 lg:row-start-1 lg:self-end"
            >
              + Toevoegen
            </button>
          </div>

          <label className="mt-4 block min-w-0">
            <span className={`mb-1 block text-xs font-medium uppercase tracking-wide ${textFaint}`}>
              Notitie (optioneel)
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={1}
              className={`${inputClass} h-[42px] min-h-[42px] resize-y overflow-hidden py-2 leading-normal`}
              placeholder="Bijv. droog weer"
            />
          </label>

          {formError && (
            <p className="mt-3 text-sm text-red-400" role="alert">
              {formError}
            </p>
          )}
        </form>

        {prCelebration && (
          <LapPrCelebration
            celebration={prCelebration}
            exiting={prCelebrationExiting}
          />
        )}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-w-0 flex-col gap-1 sm:max-w-xs">
            <span className={`text-xs font-medium uppercase tracking-wide ${textFaint}`}>
              Selecteer track
            </span>
            <select
              value={selectedTrackId}
              onChange={(e) => {
                setSelectedTrackId(e.target.value)
                setLapPage(0)
                closeNotePopup()
              }}
              className={inputClass}
            >
              <option value={ALL_TRACKS}>Alle banen</option>
              {sortedTracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSortMode('date')}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                sortMode === 'date' ? filterChipActive : filterChipIdle
              }`}
            >
              Datum (nieuwste)
            </button>
            <button
              type="button"
              onClick={() => {
                setSortMode('best')
                setLapPage(0)
                closeNotePopup()
              }}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                sortMode === 'best' ? filterChipActive : filterChipIdle
              }`}
            >
              Beste tijd
            </button>
          </div>
        </div>

        <div className={`overflow-hidden ${tableWrap}`}>
          <div className={`hidden py-3 md:grid md:grid-cols-[1.4fr_0.9fr_0.8fr_0.8fr_1.2fr_0.5fr] md:gap-3 md:px-6 ${tableHeader}`}>
            <span>Track</span>
            <span>Datum</span>
            <span>Tijd</span>
            <span>Kart type</span>
            <span>Notitie</span>
            <span className="text-center">Actie</span>
          </div>

          {displayLaps.length === 0 ? (
            <p className={`px-6 py-10 text-center ${panelMuted}`}>
              Nog geen rondetijden. Voeg je eerste tijd toe met het formulier hierboven.
            </p>
          ) : (
            <>
              <LapTablePagination
                page={safeLapPage}
                totalPages={lapTotalPages}
                totalResults={displayLaps.length}
                onPageChange={goToLapPage}
                position="top"
              />
              <div className={`space-y-2 p-2 md:space-y-0 md:divide-y md:p-0 ${tableBody} md:divide-slate-200 dark:md:divide-slate-800`}>
              {paginatedLaps.map((lap) => {
                const showAsBest = allTracksView
                  ? globalBestMs !== null && lap.timeMs === globalBestMs
                  : isLapTrackPersonalBest(data, lap.id)
                const isNewPrRow = lap.id === highlightLapId
                const isHighlighted = showAsBest || isNewPrRow
                const rowHighlight = isNewPrRow
                  ? 'lap-pr-row-celebrate'
                  : showAsBest
                    ? lapBestRowHighlight
                    : ''
                const mobileCardBg = isHighlighted
                  ? `${lapBestRowHighlightMobile} max-md:border-l-4`
                  : fillCardMobile
                return (
                  <article
                    key={lap.id}
                    className={`rounded-xl border p-3.5 shadow-sm md:rounded-none md:border-0 md:p-0 md:shadow-none md:grid md:grid-cols-[1.4fr_0.9fr_0.8fr_0.8fr_1.2fr_0.5fr] md:items-center md:gap-3 md:px-6 md:py-4 ${borderDefault} ${mobileCardBg} ${rowHighlight}`}
                  >
                    {/* Mobiel: compacte kaart */}
                    <div className="md:hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-semibold ${cardText}`}>
                            {lap.trackName}
                            {showAsBest && (
                              <span
                                className="ml-1.5 inline"
                                title={
                                  allTracksView
                                    ? 'Snelste tijd over alle banen'
                                    : 'Persoonlijk record op deze baan'
                                }
                              >
                                🏆
                              </span>
                            )}
                          </p>
                          <p className="mt-1 font-mono text-2xl font-bold leading-none text-[#d50000] dark:text-red-300">
                            {lap.time}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => requestDelete(lap)}
                          className={`shrink-0 ${secondaryButton} px-2.5 py-1.5 text-[11px] hover:border-red-500 hover:bg-red-50 hover:text-red-800 dark:hover:bg-red-950/50 dark:hover:text-red-100`}
                        >
                          Verwijder
                        </button>
                      </div>
                      <p className={`mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs ${textFaint}`}>
                        <span>{formatDateNl(lap.date)}</span>
                        <span className="text-slate-400 dark:text-slate-600" aria-hidden>
                          ·
                        </span>
                        <span>{lap.kartType}</span>
                        {lap.note ? (
                          <>
                            <span className="shrink-0 text-slate-400 dark:text-slate-600" aria-hidden>
                              ·
                            </span>
                            <span className="min-w-0 max-w-[50%] flex-1">
                              <LapNoteCell
                                value={lap.note}
                                rowId={`${lap.id}-note-mobile`}
                                isOpen={openNote?.rowId === `${lap.id}-note-mobile`}
                                onOpen={handleNoteOpen}
                                textClassName={cardTextMuted}
                              />
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>

                    {/* Desktop: tabelrij */}
                    <div className="hidden md:contents">
                      <div>
                        <p className={`font-medium ${cardText}`}>
                          {lap.trackName}
                          {showAsBest && (
                            <span
                              className="ml-2"
                              title={
                                allTracksView
                                  ? 'Snelste tijd over alle banen'
                                  : 'Persoonlijk record op deze baan'
                              }
                            >
                              🏆
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p>{formatDateNl(lap.date)}</p>
                      </div>
                      <div>
                        <p className="font-mono font-semibold text-[#d50000] dark:text-red-300">{lap.time}</p>
                      </div>
                      <div>
                        <p>{lap.kartType}</p>
                      </div>
                      <div className="min-w-0">
                        <LapNoteCell
                          value={lap.note}
                          rowId={`${lap.id}-note`}
                          isOpen={openNote?.rowId === `${lap.id}-note`}
                          onOpen={handleNoteOpen}
                          textClassName={textFaint}
                        />
                      </div>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => requestDelete(lap)}
                          className={`${secondaryButton} px-3 py-1.5 text-xs hover:border-red-500 hover:bg-red-50 hover:text-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-200`}
                        >
                          Verwijderen
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
              </div>
              <LapTablePagination
                page={safeLapPage}
                totalPages={lapTotalPages}
                totalResults={displayLaps.length}
                onPageChange={goToLapPage}
                position="bottom"
              />
            </>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Beste rondetijd"
            value={stats.bestTime ?? '—'}
            hint={statsScopeHint}
            icon="🥇"
          />
          <StatCard
            label="Gemiddelde"
            value={stats.averageTime ?? '—'}
            hint={statsScopeHint}
            icon="📊"
          />
          <StatCard
            label="Verbetering"
            value={
              stats.improvement
                ? stats.improvement.formatted
                : '—'
            }
            hint={
              statsScopeHint ??
              (stats.improvement
                ? `Vorige PR ${stats.improvement.previousBestTime} → nu ${stats.improvement.newBestTime}`
                : null)
            }
            icon="📈"
          />
          {selectedTrackId === ALL_TRACKS ? (
            <StatCard
              label="Meest gereden baan"
              value={stats.mostDrivenTrack?.name ?? '—'}
              hint={
                stats.mostDrivenTrack
                  ? `${stats.mostDrivenTrack.count} rondes`
                  : null
              }
              icon="🏟️"
            />
          ) : (
            <StatCard
              label="Rondes op deze baan"
              value={stats.scopedTrackName ?? '—'}
              hint={stats.lapCount > 0 ? `${stats.lapCount} rondes` : null}
              icon="🏁"
            />
          )}
        </div>
      </PageMainContent>

      {deleteConfirm && (
        <LapDeleteConfirm
          lap={deleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm.lapId)}
        />
      )}

      <LapNotePopup openNote={openNote} onClose={closeNotePopup} />
    </section>
  )
}

function DeleteWarningIcon({ intense }) {
  return (
    <span
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 ${
        intense
          ? 'border-red-500/60 bg-amber-50 shadow-[0_0_24px_rgba(213,0,0,0.2)] dark:bg-red-950/80 dark:shadow-[0_0_24px_rgba(213,0,0,0.35)]'
          : 'border-amber-500/40 bg-amber-50/90 dark:bg-slate-800/90'
      }`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="block h-7 w-7"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 4.25 4.75 19h14.5L12 4.25z"
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        <path
          d="M12 9.25v4.75"
          stroke="#0f172a"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle cx="12" cy="16.75" r="1.1" fill="#0f172a" />
      </svg>
    </span>
  )
}

function LapDeleteConfirm({ lap, onCancel, onConfirm }) {
  const { trackName, time, date, isTrackPr } = lap

  if (isTrackPr) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="lap-delete-title"
        aria-describedby="lap-delete-desc"
      >
        <button
          type="button"
          className={`lap-modal-backdrop-enter ${modalBackdropStrong}`}
          onClick={onCancel}
          aria-label="Annuleren"
        />
        <div className={`lap-modal-panel-enter lap-delete-panel-pulse relative w-full max-w-lg overflow-hidden rounded-2xl ${lapPrDeletePanel}`}>
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(213,0,0,0.18),transparent_55%)]"
            aria-hidden
          />
          <div className="lap-pr-checkered-edge h-2 w-full opacity-80" aria-hidden />
          <div className="relative px-6 py-6 md:px-8 md:py-8">
            <div className="flex items-center gap-4">
              <DeleteWarningIcon intense />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Persoonlijk record
                </p>
                <h2
                  id="lap-delete-title"
                  className={`mt-1 text-2xl font-extrabold leading-tight tracking-tight md:text-[1.65rem] ${cardText}`}
                >
                  Beste tijd op {trackName} verwijderen?
                </h2>
              </div>
            </div>

            <p
              id="lap-delete-desc"
              className={`mt-5 text-base leading-relaxed md:text-lg ${textMuted}`}
            >
              Weet je zeker dat je je{' '}
              <span className="font-bold italic text-red-600 dark:bg-gradient-to-r dark:from-red-200 dark:via-white dark:to-red-200 dark:bg-clip-text dark:text-transparent">
                persoonlijke record
              </span>{' '}
              op deze baan definitief wilt verwijderen?
            </p>

            <div className="mt-4 flex gap-3 rounded-xl border-2 border-amber-500/50 bg-amber-50 px-4 py-3.5 shadow-[inset_0_0_24px_rgba(245,158,11,0.08)] dark:bg-amber-950/50">
              <span className="text-2xl" aria-hidden>
                🏆
              </span>
              <p className="text-sm font-semibold leading-snug text-amber-900 md:text-base dark:text-amber-100">
                Dit is je snelste rondetijd op <strong className="text-amber-950 dark:text-amber-50">{trackName}</strong>
                . Na verwijderen verandert je beste tijd op deze baan — dit kan niet ongedaan
                worden gemaakt.
              </p>
            </div>

            <LapDeleteSummary trackName={trackName} time={time} date={date} intense />

            <LapDeleteActions onCancel={onCancel} onConfirm={onConfirm} intense />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lap-delete-title"
      aria-describedby="lap-delete-desc"
    >
      <button
        type="button"
        className={`lap-modal-backdrop-enter ${modalBackdrop}`}
        onClick={onCancel}
        aria-label="Annuleren"
      />
      <div className={`lap-modal-panel-enter w-full max-w-md ${modalPanel}`}>
        <div className="h-0.5 bg-red-600/80" aria-hidden />
        <div className="relative px-5 py-5 md:px-6 md:py-6">
          <div className="flex items-center gap-3">
            <DeleteWarningIcon intense={false} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
                Bevestigen
              </p>
              <h2
                id="lap-delete-title"
                className={`mt-1 text-xl font-bold leading-tight ${cardText}`}
              >
                Deze rondetijd verwijderen?
              </h2>
            </div>
          </div>

          <p id="lap-delete-desc" className={`mt-4 text-base leading-relaxed ${cardTextMuted}`}>
            Weet je zeker dat je deze rondetijd wilt verwijderen? Dit is niet je persoonlijke
            record op <span className={`font-semibold ${cardText}`}>{trackName}</span>.
          </p>

          <LapDeleteSummary trackName={trackName} time={time} date={date} intense={false} />

          <LapDeleteActions onCancel={onCancel} onConfirm={onConfirm} intense={false} />
        </div>
      </div>
    </div>
  )
}

function LapDeleteSummary({ trackName, time, date, intense }) {
  return (
    <div
      className={
        intense
          ? `mt-5 rounded-xl border ${borderDefault} ${surface} px-5 py-4 shadow-inner`
          : `mt-4 rounded-lg border ${borderDefault} ${surface} px-4 py-3.5`
      }
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.2em] ${textFaint}`}
      >
        Te verwijderen ronde
      </p>
      <p
        className={`mt-1 font-bold ${cardText} ${intense ? 'text-xl md:text-2xl' : 'text-lg'}`}
      >
        {trackName}
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-5">
        <div>
          <p
            className={`text-[10px] font-semibold uppercase tracking-wider ${textFaint}`}
          >
            Tijd
          </p>
          <p
            className={`font-mono font-bold ${
              intense ? 'text-2xl text-red-500 md:text-3xl dark:text-red-300' : `text-xl ${cardText}`
            }`}
          >
            {time}
          </p>
        </div>
        <div>
          <p
            className={`text-[10px] font-semibold uppercase tracking-wider ${textFaint}`}
          >
            Datum
          </p>
          <p className={`font-medium ${cardTextMuted} ${intense ? 'text-base' : 'text-sm'}`}>
            {formatDateNl(date)}
          </p>
        </div>
      </div>
    </div>
  )
}

function LapDeleteActions({ onCancel, onConfirm, intense }) {
  return (
    <div
      className={`flex flex-col-reverse gap-2 sm:flex-row sm:justify-end ${
        intense ? 'mt-6 gap-3' : 'mt-5'
      }`}
    >
      <button
        type="button"
        onClick={onCancel}
        className={`font-bold transition-colors ${
          intense
            ? `rounded-xl border-2 px-5 py-3 text-sm ${secondaryButton} hover:border-slate-400`
            : secondaryButton
        }`}
      >
        Nee, behouden
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className={`font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/80 ${
          intense
            ? 'rounded-xl bg-[#d50000] px-5 py-3 text-sm shadow-[0_4px_24px_rgba(213,0,0,0.45)] hover:bg-red-600 hover:shadow-[0_6px_28px_rgba(213,0,0,0.55)]'
            : 'rounded-lg bg-[#d50000] px-4 py-2.5 text-sm hover:bg-red-600'
        }`}
      >
        Ja, verwijderen
      </button>
    </div>
  )
}

function LapPrCelebration({ celebration, exiting }) {
  const {
    trackName,
    time,
    isFirstOnTrack,
    previousBestTime,
    improvementFormatted,
  } = celebration

  const ariaMessage = isFirstOnTrack
    ? `Eerste ronde geregistreerd op ${trackName}: ${time}`
    : `Nieuw persoonlijk record op ${trackName}: ${time}, ${improvementFormatted} sneller dan ${previousBestTime}`

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaMessage}
      className={`relative mb-6 overflow-hidden rounded-xl ${lapPrBanner} ${
        exiting ? 'lap-pr-banner-exit' : 'lap-pr-banner-enter lap-pr-glow-active'
      }`}
    >
      <div className="lap-pr-banner-radial" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-95"
        style={{
          background:
            'linear-gradient(90deg, #d50000, #a855f7, #f8fafc, #d50000, #a855f7)',
          backgroundSize: '200% 100%',
          animation: 'lap-pr-stripe-shimmer 1.8s linear infinite',
        }}
        aria-hidden
      />
      <div className="relative flex min-h-0">
        <div className="lap-pr-checkered-edge w-3 shrink-0 opacity-95" aria-hidden />
        <div className="min-w-0 flex-1 px-4 py-3 md:px-5 md:py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-400/60 bg-purple-500/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-purple-800 dark:bg-purple-500/20 dark:text-purple-100">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-300" aria-hidden />
              Fastest Lap
            </span>
            <span className="text-xl leading-none" aria-hidden>
              🏁
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-600/90 dark:text-red-300/90">
              {isFirstOnTrack ? 'Eerste ronde' : 'Nieuw PR'}
            </p>
            <h2 className={`break-words text-xl font-extrabold leading-tight tracking-tight md:text-2xl ${cardText}`}>
              {trackName}
            </h2>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
            <div className={`rounded-lg border border-red-500/30 px-3 py-1.5 ${surface}`}>
              <p className={`text-[9px] font-bold uppercase tracking-wider ${textFaint}`}>
                Nieuwe tijd
              </p>
              <p className="font-mono text-xl font-bold leading-none text-red-600 md:text-2xl dark:text-red-300">
                {time}
              </p>
            </div>
            {!isFirstOnTrack && improvementFormatted && previousBestTime && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-50 px-3 py-1.5 dark:bg-emerald-950/50">
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400/90">
                  Sneller
                </p>
                <p className="font-mono text-lg font-bold leading-none text-emerald-700 md:text-xl dark:text-emerald-300">
                  −{improvementFormatted}
                </p>
                <p className={`mt-0.5 text-[11px] ${textFaint}`}>
                  was <span className={`font-mono ${textMuted}`}>{previousBestTime}</span>
                </p>
              </div>
            )}
            {isFirstOnTrack && (
              <p className={`text-xs ${textFaint}`}>Baseline op deze baan vastgelegd.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, hint, icon }) {
  return (
    <div className={`flex min-h-[7.5rem] flex-col p-5 ${statCard}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${textFaint}`}>
        {icon} {label}
      </p>
      <p className={`mt-2 font-mono text-xl font-bold ${cardText}`}>{value}</p>
      {hint && (
        <p className={`mt-auto pt-3 text-sm font-medium ${cardTextMuted}`}>
          {hint}
        </p>
      )}
    </div>
  )
}
