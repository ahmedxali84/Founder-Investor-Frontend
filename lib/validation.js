export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const LINKEDIN_RE = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9\-_%.]+\/?$/i
export const GITHUB_RE = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9\-]+\/?$/i

export function validateLinkedInUrl(url) {
  const value = url.trim()
  if (!value) return 'Paste your LinkedIn profile URL to continue.'
  if (!LINKEDIN_RE.test(value)) return 'That doesn’t look like a LinkedIn profile URL (e.g. linkedin.com/in/yourname).'
  return ''
}

export function validateGitHubUrl(url) {
  const value = url.trim()
  if (!value) return 'Paste your GitHub profile URL to continue.'
  if (!GITHUB_RE.test(value)) return 'That doesn’t look like a GitHub profile URL (e.g. github.com/yourname).'
  return ''
}

export function validateLogin({ email, password }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Enter your email address.'
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'That email address is not valid.'

  if (!password) errors.password = 'Enter your password.'
  return errors
}

export function validateSignup({ fullName, email, password }) {
  const errors = {}
  if (!fullName.trim()) errors.fullName = 'Enter your full name.'
  else if (fullName.trim().length < 2) errors.fullName = 'Name must be at least 2 characters.'

  if (!email.trim()) errors.email = 'Enter your work email.'
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'That email address is not valid.'

  if (!password) errors.password = 'Create a password.'
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.'
  return errors
}

/** Returns { score, label, color, bars } — drives the strength meter under the signup password. */
export function passwordStrength(password) {
  if (!password) return { score: 0, label: '', color: '', bars: 0 }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: 'Weak', color: 'text-red-500', bars: 1 }
  if (score === 3) return { score, label: 'Medium', color: 'text-amber-500', bars: 2 }
  if (score === 4) return { score, label: 'Strong', color: 'text-emerald-600', bars: 3 }
  return { score, label: 'Very strong', color: 'text-emerald-600', bars: 4 }
}

/** Turns Supabase auth errors into wording a person can act on. */
export function humanizeAuthError(error) {
  const msg = (error?.message || '').toLowerCase()
  if (msg.includes('invalid login credentials')) return 'That email and password do not match an account.'
  if (msg.includes('email not confirmed')) return 'Confirm your email first — check your inbox for the link.'
  if (msg.includes('already registered') || msg.includes('already been registered'))
    return 'An account already uses this email. Log in instead.'
  if (msg.includes('user already exists')) return 'An account already uses this email. Log in instead.'
  if (msg.includes('password should be at least')) return 'Password must be at least 8 characters.'
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'Too many attempts. Wait a minute and try again.'
  if (msg.includes('failed to fetch') || msg.includes('network'))
    return 'Cannot reach the server. Check your connection and try again.'
  // Supabase server-side failures (e.g. a broken DB trigger) surface as a 500 /
  // AuthRetryableFetchError whose `message` is often a useless serialized value
  // like "{}" rather than real text — catch the error class, not just that string.
  if (error?.status >= 500 || error?.name === 'AuthRetryableFetchError')
    return "Something went wrong on our end. Please try again shortly — if it keeps happening, let us know."
  const raw = error?.message?.trim()
  const isUsable = raw && raw !== '{}' && raw !== '[object Object]'
  return isUsable ? raw : 'Something went wrong. Try again.'
}
