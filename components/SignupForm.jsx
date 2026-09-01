'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../context/AuthContext.jsx'
import { validateSignup, passwordStrength, humanizeAuthError } from '../lib/validation.js'
import { checkAccountExists } from '../lib/authApi.js'
import Field from './Field.jsx'
import Notice from './Notice.jsx'
import PasswordStrengthMeter from './PasswordStrengthMeter.jsx'
import { MailIcon, LockIcon, UserIcon, GoogleIcon, SpinnerIcon, RocketIcon, BriefcaseIcon } from './icons.jsx'

export default function SignupForm() {
  const { signUp, signInWithGoogle, isSupabaseConfigured } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Lets the landing page's "For Founders"/"For Investors" cards link
  // straight to /signup?role=founder or ?role=investor and land on the
  // matching tab already selected, instead of everyone landing on the
  // founder tab regardless of which card they clicked.
  const [role, setRole] = useState(() => (searchParams.get('role') === 'investor' ? 'investor' : 'founder'))
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [confirmSent, setConfirmSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  const strength = passwordStrength(password)

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setConfirmSent(false)

    const found = validateSignup({ fullName, email, password })
    setErrors(found)
    if (Object.keys(found).length) return

    setBusy(true)

    // Supabase's signUp() returns a fake "success" (no error, no session) for
    // an email that's already registered — a deliberate anti-enumeration
    // measure — which used to surface here as a misleading "check your email"
    // message even though nothing was actually sent. Check first so a real
    // duplicate gets a real answer instead.
    if (isSupabaseConfigured) {
      const exists = await checkAccountExists(email)
      if (exists === true) {
        setBusy(false)
        setFormError('An account already exists with this email. Log in instead.')
        return
      }
    }

    const { data, error } = await signUp({ fullName, email, password, userType: role })
    setBusy(false)

    if (error) {
      if (isSupabaseConfigured) setFormError(humanizeAuthError(error))
      return
    }

    if (data?.session) {
      router.replace('/onboarding')
    } else {
      setConfirmSent(true)
    }
  }

  async function handleGoogle() {
    setFormError('')
    setGoogleBusy(true)
    const { error } = await signInWithGoogle()
    if (error) {
      if (isSupabaseConfigured) setFormError(humanizeAuthError(error))
      setGoogleBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col">
      <h2 className="text-page tracking-[-0.01em] text-ink dark:text-slate-100">Create your account</h2>
      <p className="mt-1 text-[12.5px] text-muted dark:text-slate-400">Select your role & get started with Kavan</p>

      {/* Dual Role Selector Tabs */}
      <div className="mt-4 grid grid-cols-2 gap-2 p-1 bg-[#F5F2EC] dark:bg-slate-800 rounded-xl border border-line dark:border-slate-700">
        <button
          type="button"
          onClick={() => setRole('founder')}
          className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
            role === 'founder'
              ? 'bg-brand text-white shadow-sm'
              : 'text-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-100'
          }`}
        >
          <span className="inline-flex items-center justify-center gap-1.5"><RocketIcon className="w-4 h-4" /> Sign up as startup</span>
        </button>
        <button
          type="button"
          onClick={() => setRole('investor')}
          className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
            role === 'investor'
              ? 'bg-brand text-white shadow-sm'
              : 'text-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-100'
          }`}
        >
          <span className="inline-flex items-center justify-center gap-1.5"><BriefcaseIcon className="w-4 h-4" /> Sign up as investor</span>
        </button>
      </div>

      {formError && <Notice tone="error" className="mt-4">{formError}</Notice>}
      {confirmSent && (
        <Notice tone="success" className="mt-4">
          Check {email} for a confirmation link, then come back and log in.
        </Notice>
      )}

      <div className="mt-4 space-y-3">
        <Field
          id="signup-name"
          label={role === 'founder' ? 'Founder Full Name' : 'Investor / Partner Name'}
          icon={<UserIcon />}
          placeholder="Enter your full name"
          autoComplete="name"
          value={fullName}
          onChange={(v) => setFullName(v)}
          error={errors.fullName}
          disabled={busy}
        />
        <Field
          id="signup-email"
          label="Work Email"
          type="email"
          icon={<MailIcon />}
          placeholder={role === 'founder' ? 'founder@startup.com' : 'investor@fund.com'}
          autoComplete="email"
          value={email}
          onChange={(v) => setEmail(v)}
          error={errors.email}
          disabled={busy}
        />
        <div>
          <Field
            id="signup-password"
            label="Password"
            type="password"
            icon={<LockIcon />}
            placeholder="Create a strong password"
            autoComplete="new-password"
            value={password}
            onChange={(v) => setPassword(v)}
            error={errors.password}
            disabled={busy}
          />
          {password && !errors.password && <PasswordStrengthMeter strength={strength} />}
        </div>
      </div>

      <button type="submit" disabled={busy} className="btn-primary mt-4 flex items-center justify-center gap-2">
        {busy && <SpinnerIcon />}
        {busy ? 'Creating account…' : `Sign up as ${role === 'founder' ? 'Startup' : 'Investor'}`}
      </button>

      <div className="my-3.5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line dark:bg-slate-700" />
        <span className="text-[11.5px] text-muted dark:text-slate-400">or continue with</span>
        <span className="h-px flex-1 bg-line dark:bg-slate-700" />
      </div>

      <button type="button" onClick={handleGoogle} disabled={googleBusy} className="btn-oauth">
        {googleBusy ? <SpinnerIcon /> : <GoogleIcon />}
        Continue with Google
      </button>

      <p className="mt-4 text-center text-[12px] text-muted dark:text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Log in
        </Link>
      </p>
    </form>
  )
}
