/** Zet dark/light op <html> — gedeeld door index.html (inline) en ThemeProvider. */
export function applyTheme(isDark) {
  const root = document.documentElement
  if (isDark) {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
    localStorage.setItem('theme', 'dark')
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
    localStorage.setItem('theme', 'light')
  }
}

/** Standaard: donker (past bij huidige AutoDash-stijl). */
export function readStoredIsDark() {
  return localStorage.getItem('theme') !== 'light'
}
