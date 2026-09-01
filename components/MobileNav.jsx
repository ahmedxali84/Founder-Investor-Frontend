'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MenuIcon, CloseIcon } from './icons.jsx'

/**
 * Below `md` the navbar's section links have nowhere to live — hiding them
 * outright (as the desktop-only <nav> does) leaves phone visitors with no
 * way to reach "How it works" / "For Founders" / "For Investors" except by
 * scrolling past them. This gives that content a real, keyboard/ESC-friendly
 * home on small screens instead of just dropping it.
 */
export default function MobileNav({ links }) {
  const [open, setOpen] = useState(false)

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
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="mt-1 pt-3 border-t border-line/70 dark:border-slate-800 text-nav font-semibold text-ink dark:text-slate-100"
          >
            Log in
          </Link>
        </div>
      )}
    </div>
  )
}
