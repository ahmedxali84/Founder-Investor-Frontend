'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext.jsx'
import AuthSidePanel from '../../components/AuthSidePanel.jsx'
import SignupForm from '../../components/SignupForm.jsx'
import { Logo } from '../../components/icons.jsx'
import Notice from '../../components/Notice.jsx'

export default function SignupPage() {
  const { user, loading, isSupabaseConfigured } = useAuth()
  const router = useRouter()

  // Send to /onboarding, not /dashboard directly — Onboarding.jsx already
  // checks whether this user has actually completed profile setup and
  // routes onward correctly. Landing on /dashboard first raced against
  // SignupForm's own post-signup router.replace() and skipped onboarding entirely.
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

      {/* RIGHT — signup form fills the entire right half */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center px-6 sm:px-12 xl:px-20 py-12">
        <div className="lg:hidden mb-8">
          <Logo
            size="lg"
            className="items-center"
            iconHeight="clamp(50px, 16vw, 90px)"
            wordmarkHeight="clamp(28px, 9vw, 50px)"
            taglineHeight="clamp(15px, 4.7vw, 26px)"
          />
        </div>

        <div className="w-full max-w-[440px]">
          {!isSupabaseConfigured && (
            <Notice tone="info" className="mb-5">
              <strong className="font-semibold">Waiting on Supabase keys.</strong> Add them to{' '}
              <code className="font-mono">.env.local</code> to enable sign-up.
            </Notice>
          )}
          {/* useSearchParams() (for the ?role= pre-select) requires a
              Suspense boundary, or Next.js can't prerender this route as
              static HTML at build time. */}
          <Suspense fallback={<div className="h-[520px]" />}>
            <SignupForm />
          </Suspense>

          <p className="mt-6 text-center text-[11.5px] text-slate-400 dark:text-slate-400">
            Free to join. Verified profiles only.
          </p>
          {/* Desktop already shows this via AuthSidePanel's own footer —
              only needed here for the lg:hidden mobile view above. */}
          <p className="lg:hidden mt-2 text-center text-[11px] text-muted dark:text-slate-400">
            © {new Date().getFullYear()} Kavan — a Techflix company.
          </p>
        </div>
      </div>
    </div>
  )
}
