import { CheckIcon, WarningIcon, InfoIcon } from './icons.jsx'

const TONES = {
  error: { classes: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400', Icon: WarningIcon },
  success: { classes: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400', Icon: CheckIcon },
  info: { classes: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300', Icon: InfoIcon },
}

export default function Notice({ tone = 'info', children, className = '' }) {
  const { classes, Icon } = TONES[tone] || TONES.info
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[12.5px] leading-snug shadow-sm animate-notice-in ${classes} ${className}`}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}
