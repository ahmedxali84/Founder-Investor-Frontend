'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext.jsx'
import BrandLoader from './BrandLoader.jsx'

/**
 * Blocks a page until Supabase confirms there is a session.
 * Redirects unauthenticated users to /login.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // PREVIEW MODE: set NEXT_PUBLIC_PREVIEW_NO_AUTH=true in .env.local to view
  // every page without logging in (UI/design preview only — no real user data).
  // Remove or set to false to restore normal login protection.
  // Gated on NODE_ENV !== 'production' (inlined at build time, same as the
  // flag itself) so a stray/misconfigured env var can never disable auth on
  // a real deployed build — only a local dev server can ever honor it.
  const previewNoAuth = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_PREVIEW_NO_AUTH === 'true'

  useEffect(() => {
    if (previewNoAuth) return
    if (!loading && !user) router.replace('/login')
  }, [previewNoAuth, loading, user, router])

  if (previewNoAuth) {
    return children
  }

  if (loading) {
    return <BrandLoader message="Loading Kavan…" />
  }

  if (!user) {
    return null
  }

  return children
}
