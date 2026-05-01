import { useCallback, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'

const boxBySize = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
}

const iconBySize = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
}

// Profielfoto met Font Awesome fallback als URL ontbreekt of de afbeelding niet laadt.
export default function DriverHeadshot({ src, alt = '', size = 'sm' }) {
  const trimmed = typeof src === 'string' ? src.trim() : ''
  const [failed, setFailed] = useState(!trimmed)

  const onError = useCallback(() => {
    setFailed(true)
  }, [])

  const box = boxBySize[size] ?? boxBySize.sm
  const iconClass = iconBySize[size] ?? iconBySize.sm

  if (failed) {
    return (
      <span
        className={`${box} inline-flex shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-800/90 text-slate-400`}
        role="img"
        aria-label={alt || 'Coureur'}
      >
        <FontAwesomeIcon icon={faUser} className={iconClass} aria-hidden />
      </span>
    )
  }

  return (
    <img
      src={trimmed}
      alt={alt}
      className={`${box} shrink-0 rounded-full border border-slate-700 object-cover`}
      loading="lazy"
      onError={onError}
    />
  )
}
