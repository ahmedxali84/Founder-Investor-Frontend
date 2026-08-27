'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext.jsx'
import { humanizeAuthError, passwordStrength } from '../../lib/validation.js'
import Field from '../../components/Field.jsx'
import Notice from '../../components/Notice.jsx'
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter.jsx'
import { Logo, LockIcon, SpinnerIcon } from '../../components/icons.jsx'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const strength = passwordStrength(password)

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (password.length < 8) {
      setFieldError('Password must be at least 8 characters.')
      return
    }
    setFieldError('')
    setBusy(true)
    const { error } = await updatePassword(password)
    setBusy(false)
    if (error) setFormError(humanizeAuthError(error))
    else router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-slate-950 grid place-items-center px-5 py-12">
      <div className="w-full max-w-[420px]">
        <Logo className="items-center" size="lg" />
        <div className="mt-7 rounded-[22px] border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.28),0_2px_8px_-2px_rgba(15,23,42,0.06)] px-7 py-8">
          <h1 className="text-page tracking-[-0.01em] text-ink dark:text-slate-100">Choose a new password</h1>
          <p className="mt-1.5 text-[13px] text-muted dark:text-slate-400">You&apos;ll be logged in once it&apos;s saved.</p>

          {formError && <Notice tone="error" className="mt-4">{formError}</Notice>}

          <form onSubmit={handleSubmit} noValidate className="mt-6">
            <Field
              id="new-password"
              label="New password"
              type="password"
              icon={<LockIcon />}
              placeholder="Create a strong password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              error={fieldError}
              disabled={busy}
            />
            {password && !fieldError && <PasswordStrengthMeter strength={strength} />}
            <button type="submit" disabled={busy} className="btn-primary mt-5 flex items-center justify-center gap-2">
              {busy && <SpinnerIcon />}
              {busy ? 'Saving…' : 'Save password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
