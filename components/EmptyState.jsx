import { InboxIcon } from './icons.jsx'

/** The reusable "nothing here yet" well — icon + two-line message inside a soft card. */
export default function EmptyState({ icon, title, subtitle, action, pulse = false, className = '' }) {
  return (
    <div className={`min-h-44 flex flex-col items-center justify-center text-center px-6 py-8 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 ${className}`}>
      <span className={`grid place-items-center w-11 h-11 rounded-xl bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm mb-3 ${pulse ? 'animate-pulse' : ''}`}>
        {icon || <InboxIcon className="w-6 h-6" />}
      </span>
      {title && <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{title}</span>}
      {subtitle && <span className="text-[11.5px] mt-1 text-slate-400 dark:text-slate-400 max-w-xs leading-relaxed">{subtitle}</span>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
