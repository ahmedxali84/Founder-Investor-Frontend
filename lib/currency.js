/**
 * Ticket-size currency support. min_ticket/max_ticket stay USD everywhere on
 * the backend — Agent 5's ticket_overlap_score does real numeric range
 * comparisons against an idea's estimated USD funding need, so storing a
 * mixed-currency raw number there would silently corrupt matching. These
 * rates exist purely to convert what an investor types (and what gets
 * displayed) between their chosen currency and that internal USD figure.
 *
 * Rates are static approximations, not a live feed — there's no FX API
 * wired into this app. Fine for "roughly how big a check is this," not
 * something to build an invoice off of.
 */
export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar', symbol: '$', perUsd: 1 },
  { code: 'GBP', label: 'British Pound', symbol: '£', perUsd: 0.79 },
  { code: 'EUR', label: 'Euro', symbol: '€', perUsd: 0.92 },
  { code: 'PKR', label: 'Pakistani Rupee', symbol: 'PKR ', perUsd: 278 },
  { code: 'AED', label: 'UAE Dirham', symbol: 'AED ', perUsd: 3.67 },
  { code: 'SAR', label: 'Saudi Riyal', symbol: 'SAR ', perUsd: 3.75 },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹', perUsd: 83.5 },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$', perUsd: 1.37 },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$', perUsd: 1.52 },
  { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$', perUsd: 1.34 },
]

const BY_CODE = Object.fromEntries(CURRENCIES.map((c) => [c.code, c]))

export function getCurrency(code) {
  return BY_CODE[code] || BY_CODE.USD
}

/** Amount typed in `code` -> USD, for sending to the backend. */
export function toUsd(amount, code) {
  const n = Number(amount) || 0
  return Math.round(n / getCurrency(code).perUsd)
}

/** USD amount from the backend -> `code`, for display. */
export function fromUsd(usdAmount, code) {
  const n = Number(usdAmount) || 0
  return n * getCurrency(code).perUsd
}
