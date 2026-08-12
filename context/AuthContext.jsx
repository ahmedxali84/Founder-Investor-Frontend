'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  supabase,
  isSupabaseConfigured,
  NOT_CONFIGURED_MESSAGE,
} from '../lib/supabaseClient.js'

const AuthContext = createContext(null)

const notConfigured = () => ({ error: new Error(NOT_CONFIGURED_MESSAGE) })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let active = true

    // 1. Restore the session that Supabase persisted (survives a page refresh).
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    // 2. Stay in sync with logins, logouts, token refreshes and OAuth returns.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => {
    return {
      session,
      user: session?.user ?? null,
      accessToken: session?.access_token ?? null,
      loading,
      isSupabaseConfigured,

      async signUp({ fullName, email, password, userType = 'founder' }) {
        if (!isSupabaseConfigured) return notConfigured()
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            // Stored on the auth user; a DB trigger copies this into profiles table.
            data: { full_name: fullName.trim(), user_type: userType },
            emailRedirectTo: `${window.location.origin}/`,
          },
        })
        return { data, error }
      },

      async signIn({ email, password }) {
        if (!isSupabaseConfigured) return notConfigured()
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        return { data, error }
      },

      async signInWithGoogle() {
        if (!isSupabaseConfigured) return notConfigured()
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/onboarding`,
            queryParams: { prompt: 'select_account' },
          },
        })
        return { data, error }
      },

      async signOut() {
        if (!isSupabaseConfigured) return notConfigured()
        const { error } = await supabase.auth.signOut()
        return { error }
      },

      async sendPasswordReset(email) {
        if (!isSupabaseConfigured) return notConfigured()
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        return { error }
      },

      async updatePassword(password) {
        if (!isSupabaseConfigured) return notConfigured()
        const { error } = await supabase.auth.updateUser({ password })
        return { error }
      },
    }
  }, [session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
