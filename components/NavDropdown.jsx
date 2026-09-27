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
        <div className="absolute left-0 top-[calc(100%+10px)] w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden animate-card-in z-40">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-[13px] font-semibold text-ink/80 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-ink dark:hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
