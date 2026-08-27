'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext.jsx'
import { validateLogin, humanizeAuthError } from '../lib/validation.js'
import { checkAccountExists } from '../lib/authApi.js'
import Field from './Field.jsx'
import Notice from './Notice.jsx'
import { MailIcon, LockIcon, GoogleIcon, SpinnerIcon, RocketIcon, BriefcaseIcon } from './icons.jsx'

export default function LoginForm() {
  const { signIn, signInWithGoogle, isSupabaseConfigured } = useAuth()
  const router = useRouter()

  const [role, setRole] = useState('founder') // 'founder' (Startup) or 'investor'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const found = validateLogin({ email, password })
    setErrors(found)
    if (Object.keys(found).length) return

    setBusy(true)
    const { error } = await signIn({ email, password })

    if (error) {
      if (isSupabaseConfigured) {
        if ((error.message || '').toLowerCase().includes('invalid login credentials')) {
          const exists = await checkAccountExists(email)
          setFormError(
            exists === false
              ? 'No account found with this email. Check the address, or sign up.'
              : 'That email and password do not match an account.',
          )
        } else {
          setFormError(humanizeAuthError(error))
        }
      }
      setBusy(false)
      return
    }
    setBusy(false)
    router.replace('/onboarding')
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
      <h2 className="text-page tracking-[-0.01em] text-ink dark:text-slate-100">Welcome back</h2>
      <p className="mt-1 text-[12.5px] text-muted dark:text-slate-400">Select your role & log in to Kavan</p>

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
          <span className="inline-flex items-center justify-center gap-1.5"><RocketIcon className="w-4 h-4" /> Log in as startup</span>
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
          <span className="inline-flex items-center justify-center gap-1.5"><BriefcaseIcon className="w-4 h-4" /> Log in as investor</span>
        </button>
      </div>

      {formError && <Notice tone="error" className="mt-4">{formError}</Notice>}

      <div className="mt-4 space-y-3">
        <Field
          id="login-email"
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
        <Field
          id="login-password"
          label="Password"
          type="password"
          icon={<LockIcon />}
          placeholder="Enter your password"
          autoComplete="current-password"
          value={password}
          onChange={(v) => setPassword(v)}
          error={errors.password}
          disabled={busy}
        />
      </div>

      <Link
        href="/forgot-password"
        className="mt-2.5 self-start text-[12px] font-semibold text-brand hover:underline"
      >
        Forgot password?
      </Link>

      <button type="submit" disabled={busy} className="btn-primary mt-4 flex items-center justify-center gap-2">
        {busy && <SpinnerIcon />}
        {busy ? 'Logging in…' : `Log in as ${role === 'founder' ? 'Startup' : 'Investor'}`}
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
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold text-brand hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  )
}
