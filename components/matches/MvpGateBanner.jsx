'use client'

import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { validateMvpUrl } from '../../lib/matchesApi.js'
import { SpinnerIcon, LockIcon } from '../icons.jsx'
import Notice from '../Notice.jsx'

/** Shown to founders until they've submitted a reachable MVP URL — this is the real gate the backend enforces on "Request Meeting". */
export default function MvpGateBanner({ onUnlocked }) {
  const { accessToken } = useAuth()
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState('info')

  async function handleValidate() {
    if (!url.trim()) {
      setTone('error')
      setMessage('Paste your working MVP/prototype URL first.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const data = await validateMvpUrl(url.trim(), accessToken)
      setTone(data.valid ? 'success' : 'error')
      setMessage(data.message)
      if (data.valid) onUnlocked?.()
    } catch (err) {
      setTone('error')
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-amber-200 dark:border-amber-500/30 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"><LockIcon /></span>
        <h3 className="text-title text-slate-800 dark:text-slate-100">Unlock investor meetings — add your MVP link</h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Investors only take meetings with founders who have something real to show. Paste a reachable URL to your
        working prototype and we'll verify it's live.
      </p>
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="https://your-prototype.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 h-10 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 transition-all duration-150"
        />
        <button
          onClick={handleValidate}
          disabled={busy}
          className="btn-accent flex items-center gap-2 shrink-0"
        >
          {busy && <SpinnerIcon className="w-3.5 h-3.5" />}
          Verify & Unlock
        </button>
      </div>
      {message && <Notice tone={tone}>{message}</Notice>}
    </div>
  )
}
