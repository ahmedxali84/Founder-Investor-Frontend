'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext.jsx'
import { SunIcon, MoonIcon } from './icons.jsx'

/**
 * Landing-page theme switch. The app already picks a sensible default with
 * no action needed (app/layout.jsx's pre-paint script follows the OS's
 * prefers-color-scheme the first time a visitor shows up, same as
 * ThemeContext's loadInitialTheme), but that default had no visible control
 * to override it before signing in — a dark-mode-by-default visitor who
 * preferred light had no way to switch without an account. This reuses the
 * exact same useTheme()/localStorage mechanism as the in-app settings menu,
 * so a choice made here carries into the signed-in app too.
 */
export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()

  // The server has no access to localStorage, so `theme` always starts as
  // ThemeContext's 'light' SSR fallback — rendering the real icon/label on
  // the very first client render (before this mounted flag flips) would
  // mismatch whatever the server actually sent whenever the visitor's real
  // theme is dark, which is exactly what was happening (confirmed via a
  // hydration-mismatch error naming this component). Staying on the SSR
  // fallback for one extra render, then correcting after mount, avoids the
  // mismatch instead of letting hydration discover it.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`grid place-items-center w-9 h-9 rounded-lg text-ink dark:text-slate-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${className}`}
    >
      {isDark ? <MoonIcon className="w-[18px] h-[18px] text-slate-300" /> : <SunIcon className="w-[18px] h-[18px] text-amber-500" />}
    </button>
  )
}
