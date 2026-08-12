const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// A plain fetch() has no default timeout — if the backend ever hangs (a slow
// dependency, or a stuck DB/LLM call), this would just hang forever with no
// way for the caller to recover (this is exactly what happened to the
// founder "Refresh matches" poll and the term sheet modal before AbortController
// timeouts were added there). Every call here gets one too, so a stuck
// backend always surfaces as a clear error instead of an infinite spinner.
async function post(path, token, body, timeoutMs = 15000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body || {}),
      signal: controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out — please try again.')
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || `Request to ${path} failed.`)
  return data
}

export const validateMvpUrl = (url, token) => post('/validate-mvp-url', token, { url })
export const requestMeeting = (investorId, token) => post('/request-meeting', token, { investor_id: investorId })
export const raiseHand = (ideaId, token) => post('/raise-hand', token, { idea_id: ideaId })
export const rejectMatch = (token) => post('/reject', token, {})
// messages: the real Supabase chat transcript, formatted as [{sender: 'Founder'|'Investor', text}]
// equityPercent/amountUsd: the deal terms as entered by whoever opened the
// modal — asked directly rather than left for Agent 7 to guess at from the
// chat transcript, which used to misread ambiguous back-and-forth.
// Agent 7 is a real Groq LLM call (up to ~45s per attempt, plus 429 retry
// backoff) — the default 15s timeout above would abort a legitimately slow
// but still-succeeding draft, so this one gets a longer allowance instead.
export const generateAgreement = (slotId, messages, token, { equityPercent, amountUsd } = {}) =>
  post('/agreement', token, { slot_id: slotId, messages, equity_percent: equityPercent, amount_usd: amountUsd }, 60000)
