import { apiFetch } from './apiClient.js'

/**
 * Supabase intentionally hides whether an email is registered — signUp()
 * returns a fake "success" for an existing email instead of an error, and
 * signInWithPassword() returns the same generic "Invalid login credentials"
 * for a wrong password as for a nonexistent account. Both anti-enumeration
 * by design. This asks the backend (which uses the service-role key) to
 * actually check, so the UI can say "email already exists" / "no account
 * found" instead of the misleading generic outcome.
 *
 * Returns true/false, or null if the lookup itself was unavailable — callers
 * should fall back to the generic message rather than assert something
 * unknown on a null.
 */
export async function checkAccountExists(email) {
  try {
    const data = await apiFetch(`/auth/check-email?email=${encodeURIComponent(email.trim())}`)
    return typeof data.exists === 'boolean' ? data.exists : null
  } catch {
    return null
  }
}

/**
 * Permanent account deletion — the backend clears the shared marketplace
 * pools/session state it holds, then deletes the real Supabase Auth user,
 * which cascades through every table keyed to it (profiles, messages,
 * conversations, etc). There is no undo past this call.
 */
export async function deleteAccount(token) {
  return apiFetch('/account', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}
