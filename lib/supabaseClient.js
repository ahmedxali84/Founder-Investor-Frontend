import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * True once real Supabase credentials are present in .env.local.
 * Until then the UI stays fully usable and every auth action returns a
 * clear "credentials not configured yet" message instead of crashing.
 */
export const isSupabaseConfigured =
  Boolean(url && anonKey) &&
  !url.includes('YOUR-PROJECT-REF') &&
  !anonKey.includes('YOUR-ANON')

/**
 * ONE shared client for the whole app. Never call createClient() anywhere else.
 *
 * Guarded to the browser: `detectSessionInUrl: true` inspects window.location
 * during construction, and this module is imported (transitively) by every
 * page, so it would otherwise run during Next's server-render pass of each
 * "use client" tree. Every call site already null-checks via
 * isSupabaseConfigured, so `supabase` being null during that brief server
 * pass needs no other change.
 */
export const supabase = typeof window !== 'undefined' && isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const NOT_CONFIGURED_MESSAGE =
  'Supabase keys are not set yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.'
