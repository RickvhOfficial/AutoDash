import { useCallback, useEffect, useRef, useState } from 'react'

// Afbeelding met onError: optioneel fallbackSrc (URL) of fallback (React-node).
export default function SafeImg({
  src,
  alt = '',
  className = '',
  loading,
  fallbackSrc,
  fallback = null,
  onError: onErrorProp,
  ...imgProps
}) {
  const trimmed = typeof src === 'string' ? src.trim() : ''
  const altSrc = typeof fallbackSrc === 'string' ? fallbackSrc.trim() : ''
  const [activeSrc, setActiveSrc] = useState(trimmed || altSrc)
  const [failed, setFailed] = useState(!trimmed && !altSrc)
  const fallbackTriedRef = useRef(false)

  useEffect(() => {
    fallbackTriedRef.current = false
    setActiveSrc(trimmed || altSrc)
    setFailed(!trimmed && !altSrc)
  }, [trimmed, altSrc])

  const handleError = useCallback(
    (e) => {
      if (altSrc && !fallbackTriedRef.current) {
        fallbackTriedRef.current = true
        setActiveSrc(altSrc)
        return
      }
      setFailed(true)
      onErrorProp?.(e)
    },
    [altSrc, onErrorProp]
  )

  if (failed) {
    return fallback
  }

  return (
    <img
      src={activeSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
      {...imgProps}
    />
  )
}
