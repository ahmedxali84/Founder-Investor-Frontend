'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext.jsx'
import AuthSidePanel from '../../components/AuthSidePanel.jsx'
import LoginForm from '../../components/LoginForm.jsx'
import { Logo } from '../../components/icons.jsx'
import Notice from '../../components/Notice.jsx'

export default function LoginPage() {
  const { user, loading, isSupabaseConfigured } = useAuth()
  const router = useRouter()

  // Same reasoning as SignupPage — /onboarding decides the correct
  // destination based on actual profile-completion state.
  useEffect(() => {
    if (!loading && user) router.replace('/onboarding')
  }, [loading, user, router])

  if (!loading && user) return null

  return (
    <div className="min-h-screen lg:flex bg-white dark:bg-slate-950">
      {/* LEFT — full-bleed beige brand panel, fills the entire left half */}
      <div className="hidden lg:block lg:w-1/2">
        <AuthSidePanel />
      </div>

      {/* RIGHT — login form fills the entire right half */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center px-6 sm:px-12 xl:px-20 py-12">
        <div className="lg:hidden mb-8">
          <Logo size="lg" />
        </div>

        <div className="w-full max-w-[440px]">
          {!isSupabaseConfigured && (
            <Notice tone="info" className="mb-5">
              <strong className="font-semibold">Waiting on Supabase keys.</strong> Add them to{' '}
              <code className="font-mono">.env.local</code> to enable log in.
            </Notice>
          )}
          <LoginForm />

          <p className="mt-6 text-center text-[11.5px] text-slate-400 dark:text-slate-500">
            Protected by verified GitHub &amp; LinkedIn sign-in.
          </p>
        </div>
      </div>
    </div>
  )
}
