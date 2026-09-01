'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MenuIcon, CloseIcon, SunIcon, MoonIcon } from './icons.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

/**
 * Below `md` the navbar's section links have nowhere to live — hiding them
 * outright (as the desktop-only <nav> does) leaves phone visitors with no
 * way to reach "How it works" / "For Founders" / "For Investors" except by
 * scrolling past them. This gives that content a real, keyboard/ESC-friendly
 * home on small screens instead of just dropping it.
 */
export default function MobileNav({ links }) {
  const [open, setOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="grid place-items-center w-7 h-7 shrink-0 rounded-lg text-ink dark:text-slate-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        {open ? <CloseIcon className="w-[18px] h-[18px]" /> : <MenuIcon className="w-[18px] h-[18px]" />}
      </button>

      {open && (
        <div className="absolute top-16 inset-x-0 z-40 bg-cream dark:bg-slate-950 border-b border-line/70 dark:border-slate-800 shadow-soft px-6 py-5 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-nav font-semibold text-ink dark:text-slate-100"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-1 pt-3 border-t border-line/70 dark:border-slate-800 flex items-center gap-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex-1 text-center h-10 grid place-items-center rounded-xl border border-line dark:border-slate-700 text-nav font-semibold text-ink dark:text-slate-100"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="flex-1 text-center h-10 grid place-items-center rounded-xl bg-brand hover:bg-brand-hover text-white text-nav font-semibold shadow-glow"
            >
              Sign up
            </Link>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-between pt-3 border-t border-line/70 dark:border-slate-800 text-nav font-semibold text-ink dark:text-slate-100"
          >
            <span>Theme</span>
            <span className="inline-flex items-center gap-1.5 text-[13px] text-ink/60 dark:text-slate-400">
              {theme === 'dark' ? <MoonIcon className="w-4 h-4 text-slate-300" /> : <SunIcon className="w-4 h-4 text-amber-500" />}
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
