'use client'

import { useEffect, useRef, useState } from 'react'

function ChevronDownIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/**
 * Landing-page navbar dropdown (e.g. "Why Kavan" -> What is Kavan / Benefits).
 * Same dismissable-on-outside-click-or-Escape pattern as the in-app
 * Notifications/Help dropdowns (AppShell.jsx) for consistency, but kept as
 * its own small client component (like ThemeToggle/MobileNav) since
 * app/page.jsx exports `metadata` and can't itself carry a 'use client'
 * directive.
 */
export default function NavDropdown({ label, items }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-nav text-ink/70 dark:text-slate-300 hover:text-ink dark:hover:text-white transition-colors inline-flex items-center gap-1"
      >
        {label}
        <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+12px)] w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-700 ring-1 ring-black/5 dark:ring-white/10 shadow-lg overflow-hidden animate-card-in z-40">
          {/* Small triangle pointing back at the trigger button — a floating
              panel with no visible link to what opened it reads as
              disconnected, especially now that it's centered rather than
              left-aligned under the button. */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white dark:bg-slate-900 border-t border-l border-slate-200/70 dark:border-slate-700" />
          <div className="relative">
            {items.map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                  i !== items.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''
                }`}
              >
                {item.icon && (
                  <span className="shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-brand-soft text-brand dark:bg-blue-500/10 dark:text-blue-400">
                    {item.icon}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-ink dark:text-slate-100">{item.label}</span>
                  {item.description && (
                    <span className="block mt-0.5 text-[11.5px] leading-snug text-muted dark:text-slate-400">{item.description}</span>
                  )}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
