'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'techflix_theme'

function loadInitialTheme() {
  // Next still runs an initial server-render pass for "use client" trees,
  // where window/localStorage don't exist — the pre-paint inline script in
  // app/layout.jsx already applies the right class before hydration, so this
  // fallback value is never actually visible, just needs to not crash.
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage unavailable — fall through to system preference
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * App-wide light/dark theme, persisted in localStorage and applied via a
 * `dark` class on <html> (Tailwind's `darkMode: 'class'` strategy) so every
 * page's `dark:` variants respond to one shared toggle instead of each page
 * tracking its own preference.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(loadInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // not persisted this session — theme still applies, just won't survive a reload
    }
  }, [theme])

  const setTheme = (next) => setThemeState(next === 'dark' ? 'dark' : 'light')
  const toggleTheme = () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
