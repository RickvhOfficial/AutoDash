// Route: /vehicles — zoek voertuigmodellen via NHTSA + DB.VIN (gratis).

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { createPortal } from 'react-dom'

import ErrorMessage from '../components/ErrorMessage'

import LoadingSpinner from '../components/LoadingSpinner'

import PageMainContent from '../components/PageMainContent'

import {

  applyEnrichment,

  decodeVin,

  displayValue,

  enrichModelsByMake,

  getRowDetailEntries,

  searchVehicleModels,

  VEHICLE_BASE_COLUMNS,

} from '../services/vehicleService'

import { HOME_HERO_HEIGHT_CLASS } from '../constants/layout'
import { useIsLgScreen } from '../hooks/useMediaQuery'
import SafeImg from '../components/SafeImg'

import {
  heroOverlay,
  inputField,
  pageShell,
  textOnPhoto,
  borderSubtle,
  tableHeader,
  tableBody,
  tableRow,
  panel,
  dataTableShell,
  emptyStateBox,
  toolbarStrip,
  tooltipBox,
  secondaryButton,
  textFaint,
  cardText,
  cardTextMuted,
  cardTextSoft,
  fillRowOpen,
  fillCard,
  borderDefault,
} from '../utils/themeClasses'



const HERO_IMG =

  'https://images.unsplash.com/photo-1494976388531-d105849932e9?auto=format&fit=crop&w=1920&q=80'

const HERO_FALLBACK = '/placeholders/ph1.jpg'



const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => 2015 + i)

const PAGE_SIZE = 30



const inputClassName =
  `w-full rounded-lg px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/60 ${inputField}`



const TABLE_GRID_COLS = 'grid-cols-[repeat(5,minmax(0,1fr))_2rem]'

const TABLE_GRID_GAP = 'gap-x-6 sm:gap-x-10 lg:gap-x-12'

function ChevronIcon({ open }) {

  return (

    <svg

      xmlns="http://www.w3.org/2000/svg"

      viewBox="0 0 20 20"

      fill="currentColor"

      className={`h-5 w-5 text-red-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}

      aria-hidden

    >

      <path

        fillRule="evenodd"

        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"

        clipRule="evenodd"

      />

    </svg>

  )

}



function TrimCell({ value, rowId, isOpen, onOpen, interactive = true }) {

  const textRef = useRef(null)

  const [isOverflowing, setIsOverflowing] = useState(false)

  const text = value?.trim() ?? ''

  const showFull = isOverflowing || text.length > 32

  useLayoutEffect(() => {

    if (!interactive) return

    const el = textRef.current

    if (!el) return

    setIsOverflowing(el.scrollWidth > el.clientWidth)

  }, [text, interactive])

  function stopRowToggle(e) {

    e.stopPropagation()

  }

  function handleOpen(e) {

    stopRowToggle(e)

    if (!showFull) return

    onOpen(rowId, text)

  }

  if (!text) {

    return <span className={`min-w-0 truncate text-left ${textFaint}`}>—</span>

  }

  if (!interactive) {

    return (

      <span className={`block min-w-0 text-left text-sm leading-relaxed ${cardTextMuted}`}>

        {text}

      </span>

    )

  }

  return (

    <span

      className="relative block min-w-0"

      onClick={stopRowToggle}

      onPointerDown={stopRowToggle}

      onKeyDown={stopRowToggle}

    >

      <button

        type="button"

        data-trim-trigger

        data-trim-row-id={rowId}

        onClick={handleOpen}

        onPointerDown={stopRowToggle}

        className={`block w-full min-w-0 text-left ${cardTextMuted} ${

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



function TrimPopup({ openTrim, onClose }) {

  const [pos, setPos] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {

    if (!openTrim) return

    function findTrigger() {

      return document.querySelector(`[data-trim-row-id="${CSS.escape(openTrim.rowId)}"]`)

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

  }, [openTrim, onClose])

  useEffect(() => {

    if (!openTrim) return

    function onKeyDown(e) {

      if (e.key === 'Escape') onClose()

    }

    function onClick(e) {

      if (isTrimInteractionTarget(e.target)) return

      onClose()

    }

    document.addEventListener('keydown', onKeyDown)

    const timer = window.setTimeout(() => document.addEventListener('click', onClick), 0)

    return () => {

      document.removeEventListener('keydown', onKeyDown)

      window.clearTimeout(timer)

      document.removeEventListener('click', onClick)

    }

  }, [openTrim, onClose])

  if (!openTrim) return null

  return createPortal(

    <div

      role="tooltip"

      data-trim-popup

      className={tooltipBox}

      style={{ top: pos.top, left: pos.left }}

      onClick={onClose}

    >

      {openTrim.text}

    </div>,

    document.body

  )

}



function isTrimInteractionTarget(target) {

  return Boolean(target?.closest?.('[data-trim-trigger], [data-trim-popup]'))

}



function handleRowClick(e, rowId, onToggleRow) {

  if (isTrimInteractionTarget(e.target)) return

  onToggleRow(rowId)

}



function handleRowToggleKeyDown(e, onToggle) {

  if (e.key === 'Enter' || e.key === ' ') {

    e.preventDefault()

    onToggle()

  }

}



function renderCellValue(row, col, trimUi) {

  if (col.key === 'trim') {
    return (
      <TrimCell
        value={row.trim}
        rowId={row.id}
        isOpen={trimUi.openTrimRowId === row.id}
        onOpen={trimUi.onTrimOpen}
      />
    )
  }

  return displayValue(row[col.key])

}



function VehicleDetailPanel({ row }) {

  const entries = getRowDetailEntries(row)

  if (!entries.length) {

    return (

      <p className={`text-sm ${textFaint}`}>Geen extra specificaties beschikbaar voor dit model.</p>

    )

  }

  return (

    <dl className="flex flex-col">

      {entries.map((col) => (

        <div

          key={col.key}

          className={`grid grid-cols-1 gap-1 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-baseline sm:gap-x-6`}

        >

          <dt className={`text-xs font-semibold uppercase tracking-wide ${textFaint}`}>{col.label}</dt>

          <dd className={`text-sm leading-relaxed ${cardText}`}>{displayValue(row[col.key])}</dd>

        </div>

      ))}

    </dl>

  )

}



function cellClass(key, { header = false } = {}) {

  const base = 'min-w-0 truncate text-left'

  if (header) return `${base} text-xs font-semibold uppercase tracking-wide ${cardTextSoft}`

  if (key === 'make') return `${base} font-medium ${cardText}`

  if (key === 'year') return `${base} tabular-nums ${cardTextMuted}`

  return `${base} ${cardTextMuted}`

}



function VehicleDesktopTable({ rows, expandedRowId, onToggleRow, trimUi }) {

  const rowPadding = 'px-8 sm:px-10'

  return (

    <div className="hidden w-full space-y-2 p-3 sm:space-y-3 sm:p-4 lg:block">

      <div

        className={`grid w-full ${TABLE_GRID_COLS} items-center rounded-t-lg py-6 ${tableHeader} ${TABLE_GRID_GAP} ${rowPadding}`}

      >

        {VEHICLE_BASE_COLUMNS.map((col) => (

          <span key={col.key} className={cellClass(col.key, { header: true })}>

            {col.label}

          </span>

        ))}

        <span className="sr-only">Details</span>

      </div>



      {rows.map((row) => {

        const open = expandedRowId === row.id

        return (

          <div

            key={row.id}

            className={`${tableRow} transition-colors duration-200 ${

              open ? fillRowOpen : ''

            }`}

          >

            <div

              role="button"

              tabIndex={0}

              onClick={(e) => handleRowClick(e, row.id, onToggleRow)}

              onKeyDown={(e) => handleRowToggleKeyDown(e, () => onToggleRow(row.id))}

              aria-expanded={open}

              className={`group grid w-full ${TABLE_GRID_COLS} min-h-[5.25rem] cursor-pointer items-center py-5 text-left text-sm transition-colors ${TABLE_GRID_GAP} ${rowPadding}`}

            >

              {VEHICLE_BASE_COLUMNS.map((col) => (

                <span key={col.key} className={col.key === 'trim' ? 'min-w-0' : cellClass(col.key)}>

                  {renderCellValue(row, col, trimUi)}

                </span>

              ))}

              <span className="flex justify-end text-red-500">

                <ChevronIcon open={open} />

              </span>

            </div>



            {open && (

              <div className={`border-t py-1 ${borderSubtle} ${rowPadding}`}>

                <VehicleDetailPanel row={row} />

              </div>

            )}

          </div>

        )

      })}

    </div>

  )

}



function VehicleMobileRow({ row, expandedRowId, onToggleRow }) {

  const open = expandedRowId === row.id

  return (

    <article

      className={`text-sm transition-colors ${

        open ? `${tableRow} ${fillRowOpen}` : tableRow

      }`}

    >

      <div

        role="button"

        tabIndex={0}

        onClick={(e) => handleRowClick(e, row.id, onToggleRow)}

        onKeyDown={(e) => handleRowToggleKeyDown(e, () => onToggleRow(row.id))}

        aria-expanded={open}

        className="group flex w-full min-h-[5.25rem] cursor-pointer items-center justify-between gap-3 p-5 text-left"

      >

        <div className="min-w-0 flex-1">

          <h3 className={`font-bold ${cardText}`}>

            {displayValue(row.make)} {displayValue(row.model)}

          </h3>

          {row.trim && (

            <div className="mt-1">

              <TrimCell value={row.trim} interactive={false} />

            </div>

          )}

          <p className={`mt-1 ${textFaint}`}>

            {displayValue(row.year)}

            {row.fuel ? ` · ${displayValue(row.fuel)}` : ''}

          </p>

        </div>

        <span className="mt-0.5 shrink-0 text-red-500">

          <ChevronIcon open={open} />

        </span>

      </div>



      {open && (

        <div className={`border-t px-5 py-1 ${borderSubtle}`}>

          <VehicleDetailPanel row={row} />

        </div>

      )}

    </article>

  )

}



function TablePagination({ page, totalPages, totalResults, onPageChange, position = 'top' }) {

  if (totalPages <= 1) return null

  const borderClass = position === 'bottom' ? 'border-t' : 'border-b'

  return (

    <div

      className={`flex flex-wrap items-center justify-between gap-3 ${borderClass} ${toolbarStrip} px-4 py-3`}

    >

      <p className={`text-sm ${textFaint}`}>

        Pagina {page + 1} van {totalPages} ({totalResults} resultaten)

      </p>

      <div className="flex gap-2">

        <button

          type="button"

          disabled={page === 0}

          onClick={() => onPageChange(page - 1)}

          className={`rounded-lg px-4 py-1.5 ${secondaryButton} disabled:cursor-not-allowed disabled:opacity-40`}

        >

          Vorige

        </button>

        <button

          type="button"

          disabled={page >= totalPages - 1}

          onClick={() => onPageChange(page + 1)}

          className={`rounded-lg px-4 py-1.5 ${secondaryButton} disabled:cursor-not-allowed disabled:opacity-40`}

        >

          Volgende

        </button>

      </div>

    </div>

  )

}



export default function VehicleSearch() {

  const [searchQuery, setSearchQuery] = useState('')

  const [year, setYear] = useState('')

  const [rows, setRows] = useState([])

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState(null)

  const [hasSearched, setHasSearched] = useState(false)

  const [lastSubmittedQuery, setLastSubmittedQuery] = useState('')

  const [resultSource, setResultSource] = useState(null)

  const prevYearRef = useRef(year)



  const [vin, setVin] = useState('')

  const [vinLoading, setVinLoading] = useState(false)

  const [vinError, setVinError] = useState(null)

  const [enriching, setEnriching] = useState(false)

  const [page, setPage] = useState(0)

  const [expandedRowId, setExpandedRowId] = useState(null)

  const [openTrim, setOpenTrim] = useState(null)

  const openTrimRef = useRef(null)

  openTrimRef.current = openTrim

  const enrichedIdsRef = useRef(new Set())

  const isLgScreen = useIsLgScreen()



  const queryIsStale =

    resultSource === 'make' &&

    hasSearched &&

    lastSubmittedQuery &&

    searchQuery.trim() !== lastSubmittedQuery



  const showMakeResults = resultSource === 'make' && !queryIsStale

  const displayRows = useMemo(
    () => (showMakeResults || resultSource === 'vin' ? rows : []),
    [showMakeResults, resultSource, rows]
  )

  const totalPages = Math.max(1, Math.ceil(displayRows.length / PAGE_SIZE))

  const paginatedRows = useMemo(() => {
    if (resultSource === 'vin') return displayRows
    const start = page * PAGE_SIZE
    return displayRows.slice(start, start + PAGE_SIZE)
  }, [displayRows, page, resultSource])

  const closeTrimPopup = useCallback(() => {
    openTrimRef.current = null
    setOpenTrim(null)
  }, [])

  const handleTrimOpen = useCallback((rowId, text) => {
    setOpenTrim((prev) => {
      const next = prev?.rowId === rowId ? null : { rowId, text }
      openTrimRef.current = next
      return next
    })
  }, [])

  const toggleRow = useCallback((rowId) => {
    if (openTrimRef.current) {
      openTrimRef.current = null
      setOpenTrim(null)
      return
    }
    setExpandedRowId((prev) => (prev === rowId ? null : rowId))
  }, [])

  const trimUi = useMemo(
    () => ({
      openTrimRowId: openTrim?.rowId ?? null,
      onTrimOpen: handleTrimOpen,
    }),
    [openTrim?.rowId, handleTrimOpen]
  )

  useEffect(() => {
    if (!isLgScreen) closeTrimPopup()
  }, [isLgScreen, closeTrimPopup])

  const goToPage = useCallback((nextPage) => {
    closeTrimPopup()
    setExpandedRowId(null)
    setPage(Math.max(0, Math.min(totalPages - 1, nextPage)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [totalPages, closeTrimPopup])

  const enrichPageRows = useCallback(async (rowsToEnrich) => {
    const pending = rowsToEnrich.filter(
      (row) =>
        row.id &&
        !row._enriched &&
        !enrichedIdsRef.current.has(row.id) &&
        row.source !== 'vin'
    )
    if (!pending.length) return

    setEnriching(true)
    try {
      const enrichment = await enrichModelsByMake('', pending)
      const hasData =
        Object.keys(enrichment?.specsById ?? {}).length > 0 ||
        Object.keys(enrichment?.variantsById ?? {}).length > 0

      if (!hasData) return

      setRows((current) => {
        const updated = applyEnrichment(current, enrichment)
        updated.forEach((row) => {
          if (row._enriched) enrichedIdsRef.current.add(row.id)
        })
        for (const id of Object.keys(enrichment.variantsById ?? {})) {
          enrichedIdsRef.current.add(id)
        }
        return updated
      })
    } catch {
      // Specs zijn optioneel — tabel blijft bruikbaar zonder verrijking.
    } finally {
      setEnriching(false)
    }
  }, [])



  const fetchModels = useCallback(async (queryValue, yearValue) => {

    const trimmed = queryValue.trim()

    if (!trimmed) {

      setError('Voer een merk of model in, bijvoorbeeld Toyota, mustang of Citroën cactus.')

      return

    }



    setLoading(true)

    setEnriching(false)

    setError(null)

    setHasSearched(true)

    setVinError(null)

    setLastSubmittedQuery(trimmed)

    setResultSource('make')

    setPage(0)

    setExpandedRowId(null)

    openTrimRef.current = null

    setOpenTrim(null)

    enrichedIdsRef.current = new Set()

    prevYearRef.current = yearValue



    try {

      const tableRows = await searchVehicleModels(trimmed, yearValue || null)

      const baseRows = tableRows.map((row) => ({ ...row, source: row.source ?? 'make' }))

      baseRows.forEach((row) => {
        if (row._enriched && row.id) enrichedIdsRef.current.add(row.id)
      })

      setRows(baseRows)

      setLoading(false)

    } catch (err) {

      setError(err.message ?? 'Voertuigdata kon niet worden geladen.')

      setRows([])

      setLoading(false)

    }

  }, [])



  function handleSearch(e) {

    e.preventDefault()

    fetchModels(searchQuery, year)

  }



  useEffect(() => {

    if (!showMakeResults || resultSource !== 'make' || loading) return

    enrichPageRows(paginatedRows)

  }, [showMakeResults, resultSource, loading, page, paginatedRows, enrichPageRows])



  useEffect(() => {

    if (page >= totalPages) setPage(Math.max(0, totalPages - 1))

  }, [page, totalPages])



  useEffect(() => {

    if (!hasSearched || !lastSubmittedQuery || resultSource !== 'make') return

    if (prevYearRef.current === year) return

    prevYearRef.current = year

    fetchModels(lastSubmittedQuery, year)

  }, [year, hasSearched, lastSubmittedQuery, resultSource, fetchModels])



  async function runVinDecode() {

    setVinError(null)

    setVinLoading(true)

    try {

      const row = await decodeVin(vin)

      setRows([{ ...row, source: 'vin' }])

      setHasSearched(true)

      setError(null)

      setResultSource('vin')

    } catch (err) {

      setVinError(err.message ?? 'VIN kon niet worden gedecodeerd.')

    } finally {

      setVinLoading(false)

    }

  }



  function handleVinDecode(e) {

    e.preventDefault()

    runVinDecode()

  }



  return (

    <section className={`flex min-h-0 flex-1 flex-col ${pageShell}`}>

      <div

        className={`relative w-full shrink-0 border-b ${HOME_HERO_HEIGHT_CLASS} ${borderSubtle}`}

      >

        <SafeImg
          src={HERO_IMG}
          fallbackSrc={HERO_FALLBACK}
          alt="Auto op de weg — voertuig zoeker hero"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className={`absolute inset-0 ${heroOverlay}`} />



        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5 sm:px-6 md:px-10">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div className="pl-10 lg:pl-12">

              <h1 className={`text-3xl font-extrabold tracking-tight md:text-4xl ${textOnPhoto}`}>

                Voertuig Zoeker

              </h1>

              <p className={`mt-1 max-w-xl text-sm md:text-base ${textOnPhoto}`}>

                Zoek modellen op merk of decodeer een VIN — volledig gratis via open databronnen.

              </p>

            </div>



            <form

              onSubmit={handleVinDecode}

              className="flex w-full max-w-lg flex-col gap-2 sm:flex-row lg:shrink-0"

            >

              <label className="sr-only" htmlFor="vin-input">

                VIN-nummer

              </label>

              <input

                id="vin-input"

                type="text"

                value={vin}

                onChange={(e) => setVin(e.target.value.toUpperCase())}

                placeholder="Voer VIN in..."

                maxLength={17}

                className={inputClassName}

              />

              <button

                type="submit"

                disabled={vinLoading}

                className="shrink-0 rounded-lg bg-red-600 px-8 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"

              >

                Decode

              </button>

            </form>

          </div>

        </div>

      </div>



      <PageMainContent maxWidth="max-w-[92rem]">

        {vinError && (

          <div className="mb-4">

            <ErrorMessage message={vinError} onRetry={runVinDecode} />

          </div>

        )}



        <form

          onSubmit={handleSearch}

          className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center"

        >

          <label className="relative flex w-full flex-1 items-center">

            <span className="sr-only">Zoek merk of model</span>

            <input

              type="search"

              value={searchQuery}

              onChange={(e) => setSearchQuery(e.target.value)}

              placeholder="Zoek merk of model (bijv. Citroën cactus)..."

              className={inputClassName}

            />

          </label>



          <label className="flex w-full shrink-0 flex-col gap-1 sm:w-auto sm:min-w-[9rem]">

            <span className="sr-only">Jaar</span>

            <select

              value={year}

              onChange={(e) => setYear(e.target.value)}

              className={inputClassName}

            >

              <option value="">Alle jaren</option>

              {YEAR_OPTIONS.map((y) => (

                <option key={y} value={String(y)}>

                  {y}

                </option>

              ))}

            </select>

          </label>



          <button

            type="submit"

            disabled={loading}

            className="shrink-0 rounded-lg bg-red-600 px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"

          >

            Zoeken

          </button>

        </form>



        <p className={`${panel} mb-6 px-4 py-3 text-sm`}>

          Zoek op merk, model of beide (bijv. Citroën cactus). Na het zoeken worden specificaties

          automatisch aangevuld: brandstof, uitvoering, carrosserie, transmissie, verbruik, CO₂ en

          meer (via EPA voor VS-modellen). Klik op een rij voor alle specificaties. PK, kleur en land

          zijn alleen beschikbaar via VIN-decoder.

        </p>



        {queryIsStale && !loading && (

          <p className="mb-4 rounded-lg border border-amber-800/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200/90">

            Je zoekterm is gewijzigd. Druk op <strong className="font-semibold">Zoeken</strong> om

            resultaten te vernieuwen.

          </p>

        )}



        {!hasSearched && !loading && (

          <div className={`${panel} mb-6`}>

            <p className="text-base leading-relaxed">

              Voer een merk in (bijv. Toyota) of decodeer een VIN. 

            </p>

          </div>

        )}



        {loading && <LoadingSpinner message="Modellen en specificaties laden…" />}

        {!loading && enriching && (

          <p className={`mb-4 text-sm ${textFaint}`}>

            Specificaties (brandstof, uitvoering, transmissie, verbruik, CO₂…) worden aangevuld…

          </p>

        )}



        {!loading && error && (

          <ErrorMessage

            message={error}

            onRetry={() => fetchModels(lastSubmittedQuery || searchQuery, year)}

          />

        )}



        {!loading && !error && hasSearched && showMakeResults && (

          <div className={dataTableShell}>

            <div className="w-full min-w-0">

              {displayRows.length === 0 ? (

                <div className={emptyStateBox}>

                  {`Geen modellen gevonden voor '${lastSubmittedQuery}'${year ? ` (${year})` : ''}.`}

                </div>

              ) : (

                <>

                  <TablePagination

                    page={page}

                    totalPages={totalPages}

                    totalResults={displayRows.length}

                    onPageChange={goToPage}

                  />



                  <VehicleDesktopTable

                    rows={paginatedRows}

                    expandedRowId={expandedRowId}

                    onToggleRow={toggleRow}

                    trimUi={trimUi}

                  />



                  <div className={`grid gap-3 p-3 lg:hidden ${tableBody}`}>

                    {paginatedRows.map((row) => (

                      <VehicleMobileRow

                        key={row.id}

                        row={row}

                        expandedRowId={expandedRowId}

                        onToggleRow={toggleRow}

                      />

                    ))}

                  </div>



                  <TablePagination

                    page={page}

                    totalPages={totalPages}

                    totalResults={displayRows.length}

                    onPageChange={goToPage}

                    position="bottom"

                  />

                </>

              )}

            </div>

          </div>

        )}



        {!loading && !error && hasSearched && resultSource === 'vin' && displayRows.length > 0 && (

          <div className={dataTableShell}>

            <div className="w-full min-w-0">

              <VehicleDesktopTable

                rows={displayRows}

                expandedRowId={expandedRowId}

                onToggleRow={toggleRow}

                trimUi={trimUi}

              />

              <div className={`grid gap-3 p-3 lg:hidden ${tableBody}`}>

                {displayRows.map((row) => (

                  <VehicleMobileRow

                    key={row.id}

                    row={row}

                    expandedRowId={expandedRowId}

                    onToggleRow={toggleRow}

                  />

                ))}

              </div>

            </div>

          </div>

        )}



        {!loading && !error && hasSearched && displayRows.length > 0 && !queryIsStale && (

          <p className={`mt-4 text-sm ${textFaint}`}>

            {displayRows.length} resultaat{displayRows.length !== 1 ? 'en' : ''}

            {resultSource === 'vin'

              ? ' via VIN-decoder'

              : lastSubmittedQuery

                ? ` voor '${lastSubmittedQuery}'`

                : ''}

            {year && resultSource === 'make' ? ` (${year})` : ''}

            {(resultSource === 'vin' || resultSource === 'make') && (

              <span> · klik op een rij voor specificaties</span>

            )}

          </p>

        )}

      </PageMainContent>



      {isLgScreen && <TrimPopup openTrim={openTrim} onClose={closeTrimPopup} />}

    </section>

  )

}


