'use client'

import { useEffect, useRef, useState } from 'react'
import { StarIcon, SpinnerIcon } from './icons.jsx'

const STATS = [
  { label: 'Shortlisted', target: 6, cls: 'text-slate-900 dark:text-slate-100' },
  { label: 'Pending', target: 2, cls: 'text-slate-900 dark:text-slate-100' },
  { label: 'Confirmed', target: 1, cls: 'text-emerald-600 dark:text-emerald-400' },
]

/**
 * The "your top match" mock isn't a static screenshot — the stat numbers
 * count up and the footer line flips from "verifying" to "verified" the
 * moment the card scrolls into view, so it shows the matching/verification
 * step actually happening instead of just asserting fixed numbers next to a
 * claim. Runs once, via the same IntersectionObserver pattern as Reveal
 * (kept separate since this also drives a rAF count-up, not just a CSS
 * transition — and it needs its own prefers-reduced-motion check because
 * that logic lives in JS, not in a CSS transition-duration).
 */
export default function HeroMatchCard() {
  const ref = useRef(null)
  const [counts, setCounts] = useState([0, 0, 0])
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        if (reduceMotion) {
          setCounts(STATS.map((s) => s.target))
          setVerified(true)
          return
        }

        const duration = 700
        const startTime = performance.now()
        let frame
        function tick(now) {
          const t = Math.min(1, (now - startTime) / duration)
          const eased = 1 - Math.pow(1 - t, 3)
          setCounts(STATS.map((s) => Math.round(s.target * eased)))
          if (t < 1) {
            frame = requestAnimationFrame(tick)
          } else {
            // Tied to the same rAF clock as the count-up (rather than an
            // independent setTimeout) so if the tab is backgrounded
            // mid-animation, "verified" can't appear before the numbers
            // actually finish — rAF pauses while hidden and resumes both
            // together, instead of a timer firing on its own schedule.
            setVerified(true)
          }
        }
        frame = requestAnimationFrame(tick)
        el._cleanup = () => cancelAnimationFrame(frame)
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      el._cleanup?.()
    }
  }, [])

  return (
    <div ref={ref} className="relative rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-black/5 dark:ring-white/10 shadow-card p-6 -rotate-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Your top match</span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-current" /> Both opted in
        </span>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-accent-gradient flex items-center justify-center text-white font-black text-lg shrink-0 shadow-glow">A</div>
        <div className="min-w-0">
          <p className="text-title text-slate-900 dark:text-slate-100 truncate">Accel Horizon Capital</p>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">Partner · FinTech, AI · $250K–$1.5M</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {STATS.map((s, i) => (
          <div key={s.label} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">{s.label}</p>
            <p className={`mt-1 text-lg font-black tabular-nums ${s.cls}`}>{counts[i]}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
        {verified ? (
          <>
            {[0, 1, 2, 3, 4].map((i) => (
              <StarIcon key={i} className="w-3.5 h-3.5 text-amber-400" />
            ))}
            <span className="ml-1.5 text-[11.5px] text-slate-500 dark:text-slate-400">Verified via live GitHub &amp; LinkedIn data</span>
          </>
        ) : (
          <>
            <SpinnerIcon className="w-3.5 h-3.5 text-brand dark:text-blue-400" />
            <span className="ml-1.5 text-[11.5px] text-slate-500 dark:text-slate-400">Verifying via live GitHub &amp; LinkedIn data…</span>
          </>
        )}
      </div>
    </div>
  )
}
