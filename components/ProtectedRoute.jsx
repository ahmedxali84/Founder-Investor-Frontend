'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext.jsx'

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
  const previewNoAuth = process.env.NEXT_PUBLIC_PREVIEW_NO_AUTH === 'true'

  useEffect(() => {
    if (previewNoAuth) return
    if (!loading && !user) router.replace('/login')
  }, [previewNoAuth, loading, user, router])

  if (previewNoAuth) {
    return children
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        color: '#fff',
        gap: '16px',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          width: '48px', height: '48px',
          border: '4px solid rgba(255,255,255,0.2)',
          borderTopColor: '#7c6fff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Loading TechFlixx…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return children
}
