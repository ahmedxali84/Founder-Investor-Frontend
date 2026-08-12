'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext.jsx'
import { EMAIL_RE, humanizeAuthError } from '../../lib/validation.js'
import Field from '../../components/Field.jsx'
import Notice from '../../components/Notice.jsx'
import { Logo, MailIcon, SpinnerIcon } from '../../components/icons.jsx'

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!EMAIL_RE.test(email.trim())) {
      setFieldError('Enter a valid email address.')
      return
    }
    setFieldError('')
    setBusy(true)
    const { error } = await sendPasswordReset(email)
    setBusy(false)
    if (error) setFormError(humanizeAuthError(error))
    else setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-slate-950 grid place-items-center px-5 py-12">
      <div className="w-full max-w-[420px]">
        <Logo className="justify-center" />
        <div className="mt-7 rounded-[22px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.28),0_2px_8px_-2px_rgba(15,23,42,0.06)] px-7 py-8">
          <h1 className="text-page tracking-[-0.01em] text-ink dark:text-slate-100">Reset your password</h1>
          <p className="mt-1.5 text-[13px] text-muted dark:text-slate-400">
            Enter your email and we&apos;ll send a link to set a new password.
          </p>

          {formError && <Notice tone="error" className="mt-4">{formError}</Notice>}
          {sent && (
            <Notice tone="success" className="mt-4">
              Link sent to {email}. Open it on this device to continue.
            </Notice>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6">
            <Field
              id="reset-email"
              label="Email address"
              type="email"
              icon={<MailIcon />}
              placeholder="you@company.com"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              error={fieldError}
              disabled={busy}
            />
            <button type="submit" disabled={busy} className="btn-primary mt-5 flex items-center justify-center gap-2">
              {busy && <SpinnerIcon />}
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-6 text-center text-[12.5px] text-muted dark:text-slate-400">
            <Link href="/" className="font-semibold text-brand hover:underline">
              Back to log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
