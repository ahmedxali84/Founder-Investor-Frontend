/** Formats a dollar amount as compact text: 500000 -> "$500K", 2500000 -> "$2.5M". */
function formatMoney(n) {
  if (n >= 1_000_000) {
    const millions = n / 1_000_000
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`
  }
  if (n >= 1_000) return `$${Math.round(n / 1000)}K`
  return `$${n}`
}

/** "$500K – $2.5M checks" — the standard ticket-size line used on investor cards. */
export function formatTicket(min, max) {
  if (!min && !max) return 'Ticket size not specified'
  if (min === max) return `${formatMoney(min)} checks`
  return `${formatMoney(min)} – ${formatMoney(max)} checks`
}

/** Consistent emerald/blue/amber/slate banding for any 0-100 match/quality score. */
export function scoreBadgeTone(score) {
  const n = Number(score) || 0
  if (n >= 85) return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Excellent Fit' }
  if (n >= 70) return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Strong Fit' }
  if (n >= 50) return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Fair Fit' }
  return { bg: 'bg-slate-200', text: 'text-slate-600', label: 'Early Fit' }
}

/** Relative-ish, human label for MVP readiness percentage. */
export function mvpStatusTone(status) {
  if (!status) return { bg: 'bg-slate-200', text: 'text-slate-600' }
  if (status.startsWith('MVP Ready')) return { bg: 'bg-emerald-100', text: 'text-emerald-700' }
  if (status.startsWith('Near-Ready')) return { bg: 'bg-blue-100', text: 'text-blue-700' }
  return { bg: 'bg-amber-100', text: 'text-amber-700' }
}

/** "3m ago" / "5h ago" / "2d ago" — short relative time for notification-style timestamps. */
export function timeAgo(isoString) {
  if (!isoString) return ''
  const then = new Date(isoString).getTime()
  if (Number.isNaN(then)) return ''
  const seconds = Math.floor((Date.now() - then) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return new Date(isoString).toLocaleDateString()
}
