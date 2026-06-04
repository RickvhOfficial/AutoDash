import { useEffect, useState } from 'react'

const LG_MEDIA_QUERY = '(min-width: 1024px)'

export function useIsLgScreen() {
  const [isLg, setIsLg] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(LG_MEDIA_QUERY).matches
  )

  useEffect(() => {
    const media = window.matchMedia(LG_MEDIA_QUERY)
    function onChange(e) {
      setIsLg(e.matches)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return isLg
}
