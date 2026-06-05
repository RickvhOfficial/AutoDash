import { useLayoutEffect, useState } from 'react'
import { applyTheme, readStoredIsDark } from '../utils/applyTheme'
import { ThemeContext } from './themeContext'

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => readStoredIsDark())

  useLayoutEffect(() => {
    applyTheme(isDark)
  }, [isDark])

  const toggleTheme = () => {
    setIsDark((prev) => !prev)
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  )
}
