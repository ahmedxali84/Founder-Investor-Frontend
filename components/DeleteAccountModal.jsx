'use client'

import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { deleteAccount } from '../lib/authApi.js'
import Notice from './Notice.jsx'
import { WarningIcon, CloseIcon, SpinnerIcon, TrashIcon } from './icons.jsx'

const CONFIRM_PHRASE = 'YES I WANT TO DELETE MY ACCOUNT'

/**
 * GitHub-style destructive-action gate: the delete button stays disabled
 * until the exact phrase is typed, so an account can't be deleted by a
 * stray click. On success, the Supabase session is torn down locally too —
 * the account (and its ability to refresh that session) no longer exists.
 */
export default function DeleteAccountModal({ onClose }) {
  const { accessToken, signOut } = useAuth()
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const canDelete = confirmText === CONFIRM_PHRASE && !deleting

  async function handleDelete() {
    if (!canDelete) return
    setDeleting(true)
    setError('')
    try {
      await deleteAccount(accessToken)
      // The account is already gone server-side at this point, so this must
      // not be a silent no-op on failure: signOut() never throws, it just
      // returns { error }, and a swallowed failure here would leave the
      // now-orphaned session sitting in localStorage for AuthContext to
      // rehydrate on the next load — the UI would look logged in for an
      // account that no longer exists. A full page navigation (not React
      // Router's navigate) guarantees every in-memory/cached bit of session
      // state is gone regardless of whether the local sign-out itself
      // actually succeeded.
      const { error: signOutError } = await signOut()
      if (signOutError) console.error('Post-delete sign-out failed:', signOutError.message)
      window.location.href = '/login'
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card w-full max-w-md animate-card-in border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-title text-slate-800 dark:text-slate-100 inline-flex items-center gap-2">
            <WarningIcon className="w-4 h-4 text-rose-600" /> Delete account
          </h3>
          <button
            onClick={onClose}
            disabled={deleting}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs leading-relaxed">
            This permanently deletes your account, profile, posted ideas or shortlist, matches,
            meeting requests, and every message/conversation you're part of. <strong>This cannot be undone.</strong>
          </div>

          {error && <Notice tone="error">{error}</Notice>}

          <div>
            <label htmlFor="delete-confirm" className="block text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Type <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{CONFIRM_PHRASE}</span> to confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              autoComplete="off"
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={deleting}
              placeholder={CONFIRM_PHRASE}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-sm font-mono focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!canDelete}
            className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5"
          >
            {deleting ? <SpinnerIcon className="w-3.5 h-3.5" /> : <TrashIcon className="w-3.5 h-3.5" />}
            {deleting ? 'Deleting…' : 'Delete my account'}
          </button>
        </div>
      </div>
    </div>
  )
}
