const TONE = {
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' },
  blue: { text: 'text-blue-600 dark:text-blue-400', chip: 'bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20' },
  amber: { text: 'text-amber-600 dark:text-amber-400', chip: 'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20' },
  slate: { text: 'text-slate-400 dark:text-slate-400', chip: 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700' },
  rose: { text: 'text-rose-600 dark:text-rose-400', chip: 'bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20' },
}

/**
 * The reusable "label -> big number -> colored delta" stat card used across
 * every in-app page. `icon` accepts a React node (SVG icon component) — a
 * bare string still renders, for backward compatibility.
 */
export default function StatTile({ icon, label, value, delta, deltaMuted, tone = 'blue', className = '' }) {
  const t = TONE[tone] || TONE.blue
  return (
    <div className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm hover-lift ${className}`}>
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className={`grid place-items-center w-8 h-8 rounded-lg ring-1 ${t.chip} shrink-0`}>
            {icon}
          </span>
        )}
        <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-tight">{label}</span>
      </div>
      <div className="mt-3 text-[26px] leading-none font-black text-slate-900 dark:text-slate-100 tabular-nums">{value}</div>
      {delta && (
        <div className={`mt-1.5 text-[11px] font-semibold flex items-center gap-1 ${t.text}`}>
          <span>{delta}</span>
          {deltaMuted && <span className="text-slate-400 dark:text-slate-400 font-normal">· {deltaMuted}</span>}
        </div>
      )}
    </div>
  )
}
