'use client'

import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatTicket, scoreBadgeTone } from '../../lib/format.js'
import { requestMeeting, rejectMatch } from '../../lib/matchesApi.js'
import InfoPill from '../InfoPill.jsx'
import Notice from '../Notice.jsx'
import { SpinnerIcon, TicketIcon, LockIcon } from '../icons.jsx'

/**
 * Founder-facing spotlight: the single best current investor match, with the
 * real Agent 4/5 score/reason, and the two real actions the backend supports
 * on it — Request Meeting (Agent 2/3 gate via mvp_url_valid) and Pass (Agent 6).
 */
export default function CurrentMatchSpotlight({ currentMatch, mvpUrlValid, meetingSlot, founderDomain, onActionDone }) {
  const { accessToken } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!currentMatch || !currentMatch.investor) return null
  const investor = currentMatch.investor
  const tone = scoreBadgeTone(currentMatch.score)
  const sectors = investor.focus_sectors || []
  const requested = meetingSlot?.founder_requested
  const confirmed = meetingSlot?.both_opted_in

  async function handleRequest() {
    setBusy(true)
    setError('')
    try {
      await requestMeeting(investor.id, accessToken)
      onActionDone?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handlePass() {
    setBusy(true)
    setError('')
    try {
      await rejectMatch(accessToken)
      onActionDone?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden animate-card-in">
      <div className="h-1.5 bg-accent-gradient" />
      <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-accent-gradient flex items-center justify-center text-white font-black text-base shrink-0 shadow-glow">
            {confirmed ? (investor.name?.[0]?.toUpperCase() || '?') : <LockIcon />}
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Your Top Match</span>
            <h2 className="text-title text-slate-900 dark:text-slate-100 mt-0.5 leading-tight">
              {confirmed ? investor.name : 'Confidential Investor Match'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {confirmed ? `${investor.designation} at ${investor.firm}` : 'Identity unlocks once the meeting is confirmed'}
            </p>
          </div>
        </div>
        <InfoPill tone={tone.bg.includes('emerald') ? 'emerald' : tone.bg.includes('blue') ? 'blue' : 'amber'}>
          {tone.label} · {Math.round(currentMatch.score)}
        </InfoPill>
      </div>

      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {confirmed ? investor.bio : "This investor's bio stays confidential until the meeting is confirmed."}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {sectors.map((s) => (
          <InfoPill key={s} tone={s === founderDomain ? 'highlight' : 'slate'}>{s}</InfoPill>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="inline-flex items-center gap-1.5"><TicketIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" /> {formatTicket(investor.min_ticket, investor.max_ticket, investor.ticket_currency)}</span>
        {currentMatch.reason && <span className="text-slate-400 dark:text-slate-500 font-normal italic">"{currentMatch.reason}"</span>}
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-wrap gap-3 pt-2">
        {confirmed ? (
          <InfoPill tone="emerald" dot>Meeting confirmed — live chat is open below</InfoPill>
        ) : requested ? (
          <InfoPill tone="blue" dot>Requested — waiting on the investor to confirm</InfoPill>
        ) : (
          <button
            onClick={handleRequest}
            disabled={busy || !mvpUrlValid}
            title={!mvpUrlValid ? 'Add a verified MVP URL above to unlock meeting requests' : ''}
            className="btn-accent flex items-center gap-2"
          >
            {busy && <SpinnerIcon className="w-3.5 h-3.5" />}
            Request Meeting
          </button>
        )}
        <button
          onClick={handlePass}
          disabled={busy}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-150 active:scale-[0.98]"
        >
          Pass — show next best match
        </button>
      </div>
      </div>
    </div>
  )
}
