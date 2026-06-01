import { useCallback, useEffect, useState } from 'react'
import {
  deleteLapTime as deleteLapFromStorage,
  getLapData,
  LAP_DATA_EVENT,
  saveLapTime as saveLapToStorage,
} from '../utils/lapStorage'

export function useLapTimes() {
  const [data, setData] = useState(() => getLapData())

  const reload = useCallback(() => {
    setData(getLapData())
  }, [])

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'autodash_lap_times' || e.key === null) reload()
    }
    function onCustom() {
      reload()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(LAP_DATA_EVENT, onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(LAP_DATA_EVENT, onCustom)
    }
  }, [reload])

  const saveLap = useCallback((payload) => {
    const result = saveLapToStorage(payload)
    setData(result.data)
    return result
  }, [])

  const deleteLap = useCallback((lapId) => {
    const next = deleteLapFromStorage(lapId)
    setData(next)
    return next
  }, [])

  return { data, reload, saveLap, deleteLap }
}
