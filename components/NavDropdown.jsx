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
 * Landing-page navbar dropdown ("Why Kavan" -> What is Kavan / Benefits /
 * Why it's different). Two-panel layout — a short intro blurb on the left,
 * the items on the right — same dismissable-on-outside-click-or-Escape
 * pattern as the in-app Notifications/Help dropdowns (AppShell.jsx), but
 * kept as its own small client component (like ThemeToggle/MobileNav)
 * since app/page.jsx exports `metadata` and can't itself carry a
 * 'use client' directive.
 *
 * Deliberately built from this site's own tokens (cream/brand-soft panel,
 * rounded-2xl, the same shadow-lg/ring-1 combo every other card on this page
 * already uses) rather than skinning a generic mega-menu template — a
 * borrowed white/green layout would read as a different product's nav
 * bolted onto this one.
 */
export default function NavDropdown({ label, intro, items }) {
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
        <div className="absolute left-0 top-[calc(100%+14px)] w-[calc(100vw-2rem)] max-w-[520px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-700 ring-1 ring-black/5 dark:ring-white/10 shadow-card overflow-hidden animate-card-in z-40">
          {/* Small triangle pointing back at the trigger button — sits over
              the seam between the two panels below, so it reads as
              connected to the button no matter which panel it visually
              overlaps. */}
          <div className="absolute -top-1.5 left-7 w-3 h-3 rotate-45 bg-white dark:bg-slate-900 border-t border-l border-slate-200/70 dark:border-slate-700" />

          <div className="relative grid grid-cols-[168px_1fr]">
            {/* Left — intro panel, same warm cream/dot-pattern language as
                the Hero/AuthSidePanel rather than a plain gray sidebar. */}
            <div className="relative hidden sm:flex flex-col justify-center gap-2 bg-cream dark:bg-slate-800/60 border-r border-slate-100 dark:border-slate-800 p-5 overflow-hidden">
              <div className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.08]" style={{
                backgroundImage: 'radial-gradient(#E5DAC5 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }} />
              <span className="relative text-[10.5px] font-bold text-brand-hover dark:text-blue-400 uppercase tracking-wider">Learn about Kavan</span>
              {intro && <p className="relative text-[12px] leading-relaxed text-muted dark:text-slate-400">{intro}</p>}
            </div>

            {/* Right — the actual links, each with an icon + one-line
                description (a title alone reads as a plain nav list; this
                keeps it scannable without needing to click through). */}
            <div className="p-1.5">
              {items.map((item, i) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 rounded-xl px-3.5 py-3 hover:bg-brand-soft/60 dark:hover:bg-blue-500/10 transition-colors ${
                    i !== items.length - 1 ? 'mb-0.5' : ''
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
        </div>
      )}
    </div>
  )
}
