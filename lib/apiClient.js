/**
 * Shared fetch helper for all backend (/api) calls.
 *
 * Several pages did `const data = await res.json()` directly. When the FastAPI
 * backend isn't running (or the dev proxy can't reach it), the response is an
 * HTML error page — not JSON — so `res.json()` throws "Unexpected token '<' …
 * is not valid JSON", which is confusing. This helper parses JSON safely and
 * turns network/backend failures into clear messages.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/api\/?$/, '')

const OFFLINE_MESSAGE =
  'Can’t reach the server. Make sure the backend is running (python main_app.py on port 8000), then try again.'

async function readJsonSafe(res) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { detail: null, _nonJson: true, _raw: text.slice(0, 200) }
  }
}

/**
 * Resumes (and anything else behind an auth-gated download route) can't just
 * be a plain <a href> anymore now that /api/resume/* requires a Bearer token
 * — a normal browser navigation never attaches custom headers. Fetch the
 * file with the token instead and trigger the download from the blob.
 *
 * `path` here (e.g. a backend-returned resume_url of "/api/resume/{id}") is
 * relative to the BACKEND, not the current page — calling fetch(path, ...)
 * directly resolved it against the frontend's own origin instead in
 * production (no dev-only rewrite there), so the request 404'd against
 * Vercel and never reached the backend at all. A 404 HTML page then got
 * saved with a .docx filename on any call site whose error handling didn't
 * check res.ok. API_BASE is the bare backend origin (NEXT_PUBLIC_API_URL
 * with any trailing /api stripped) — exactly what a "/api/..." path needs
 * prepended. Leaves an already-absolute URL untouched.
 */
export async function downloadAuthenticated(path, token, filename) {
  const fetchUrl = /^https?:\/\//i.test(path) ? path : `${API_BASE}${path}`
  const res = await fetch(fetchUrl, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error("Couldn't download the file. Please try again.")
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  // Attach to the DOM before clicking, and defer the revoke instead of
  // calling it immediately after click() — some browsers can cancel or
  // truncate the download if the blob URL is invalidated before they've
  // actually started streaming it.
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function apiFetch(path, opts = {}) {
  const { absolute, ...fetchOpts } = opts
  const url = absolute ? path : `${API_URL}${path}`

  let res
  try {
    res = await fetch(url, fetchOpts)
  } catch {
    throw new Error(OFFLINE_MESSAGE)
  }

  const data = await readJsonSafe(res)

  if (!res.ok) {
    if (data._nonJson || res.status === 502 || res.status === 504) {
      throw new Error(OFFLINE_MESSAGE)
    }
    throw new Error(data.detail || `Request failed (${res.status}).`)
  }

  if (data._nonJson) {
    throw new Error(OFFLINE_MESSAGE)
  }

  return data
}
