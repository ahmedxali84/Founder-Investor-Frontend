'use client'

import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { raiseHand, completeDeal } from '../../lib/matchesApi.js'
import CurrentIdeaSpotlight from './CurrentIdeaSpotlight.jsx'
import RealtimeChatPanel from './RealtimeChatPanel.jsx'
import ChatAndAgreementBar from './ChatAndAgreementBar.jsx'
import TermSheetModal from './TermSheetModal.jsx'
import EmptyState from '../EmptyState.jsx'
import InfoPill from '../InfoPill.jsx'
import Notice from '../Notice.jsx'
import { HandshakeIcon, HandRaiseIcon, SpinnerIcon } from '../icons.jsx'

/**
 * Mirror of FounderMatchesView's PendingInterestCard: a founder can request
 * a meeting on any investor in their own shortlist — that doesn't require
 * this investor's `current_match` (a snapshot from their last onboarding/
 * refresh) to already point at that same founder. Without this, an investor
 * gets the "a founder requested a meeting" notification but /matches shows
 * nothing actionable, because CurrentIdeaSpotlight only ever renders for
 * current_match's own idea. Surface it directly from meeting_requests
 * instead, independent of current_match.
 */
function PendingIdeaCard({ slot, onActionDone }) {
  const { accessToken } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const idea = slot.idea || {}
  const founder = idea.founder || {}

  async function handleRaise() {
    setBusy(true)
    setError('')
    try {
      await raiseHand(idea.id, accessToken)
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
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-accent-gradient flex items-center justify-center text-white font-black text-base shrink-0 shadow-glow">
            {founder.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest inline-flex items-center gap-1">
              <HandRaiseIcon className="w-3 h-3" /> Founder Requested a Meeting
            </span>
            <h2 className="text-title text-slate-900 dark:text-slate-100 mt-0.5 leading-tight">{idea.title || 'A startup'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{founder.name || 'A founder'} · {founder.specialization || idea.domain}</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Requested a meeting on their live idea — outside your current algorithmic top match, but real interest all the same.
        </p>

        {error && <Notice tone="error">{error}</Notice>}

        {slot.both_opted_in ? (
          <InfoPill tone="emerald" dot>Meeting confirmed — chat and agreement options below</InfoPill>
        ) : slot.investor_raised ? (
          <InfoPill tone="blue" dot>Waiting on {founder.name || 'the founder'}</InfoPill>
        ) : (
          <button
            onClick={handleRaise}
            disabled={busy}
            className="btn-accent flex items-center gap-2"
          >
            {busy && <SpinnerIcon className="w-3.5 h-3.5" />}
            Raise Hand
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Investor mainly sees their single exclusive startup match (Agent 4/5's #1
 * pick), but that's a snapshot — not live-synced with meeting_requests — so
 * a real founder-initiated request that falls outside it is still surfaced
 * below via PendingIdeaCard rather than silently dropped.
 */
export default function InvestorMatchesView({ currentMatch, meetingRequests, onRefetch }) {
  const { user, accessToken } = useAuth()
  const [termSheetOpen, setTermSheetOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [markingDone, setMarkingDone] = useState(false)
  const [markDoneError, setMarkDoneError] = useState('')
  const slotsById = Object.fromEntries((meetingRequests || []).map((s) => [s.id, s]))
  const spotlightSlot = currentMatch?.idea ? slotsById[currentMatch.idea.id] : null
  // Mirror of the same fix in FounderMatchesView.jsx: a completed deal
  // frees this idea up to be matched again, but current_match is never
  // reset when that happens — without this, the spotlight kept showing the
  // finished deal forever and hid any real new founder-initiated request
  // underneath it, since the fallback search only ran when there was no
  // current_match at all.
  const currentMatchCompleted = Boolean(spotlightSlot?.completed)

  // Filtering by !s.completed directly is what actually matters here — an
  // earlier version of this tried to exclude current_match's own slot by
  // comparing ids instead, but current_match's snapshot id didn't reliably
  // line up with the live meetingRequests entry, so .find() kept returning
  // the already-completed deal (it still satisfies both_opted_in) instead
  // of skipping past it to genuinely new interest.
  const otherInterest = (meetingRequests || []).find((s) =>
    !s.completed && (s.founder_requested || s.both_opted_in))

  // Whichever idea is actually actionable right now — the algorithmic top
  // match if there is one and it isn't already finished, otherwise a real
  // founder-initiated request that current_match's stale snapshot hasn't
  // caught up to (including a brand-new founder after the last deal
  // completed).
  const activeIdea = (currentMatch?.idea && !currentMatchCompleted) ? currentMatch.idea : otherInterest?.idea
  const activeSlot = (spotlightSlot && !currentMatchCompleted) ? spotlightSlot : otherInterest

  async function handleMarkDone() {
    if (!activeIdea?.id) return
    setMarkingDone(true)
    setMarkDoneError('')
    try {
      await completeDeal(activeIdea.id, accessToken)
      onRefetch?.()
    } catch (err) {
      setMarkDoneError(err.message)
    } finally {
      setMarkingDone(false)
    }
  }

  return (
    <div className="space-y-6">
      {currentMatch?.idea && !currentMatchCompleted ? (
        <CurrentIdeaSpotlight currentMatch={currentMatch} meetingSlot={spotlightSlot} onActionDone={onRefetch} />
      ) : otherInterest ? (
        <PendingIdeaCard slot={otherInterest} onActionDone={onRefetch} />
      ) : (
        <EmptyState icon={<HandshakeIcon className="w-6 h-6" />} title="No active match right now" subtitle="Pass on a match, or check back once a founder posts a live idea, to see your next best startup here." />
      )}

      {activeSlot?.both_opted_in && activeIdea?.owner_user_id && (
        <>
          <ChatAndAgreementBar
            chatOpen={chatOpen}
            onToggleChat={() => setChatOpen((v) => !v)}
            onOpenAgreement={() => setTermSheetOpen(true)}
            completed={activeSlot?.completed}
            markingDone={markingDone}
            onMarkDone={handleMarkDone}
          />
          {markDoneError && <Notice tone="error">{markDoneError}</Notice>}
          {chatOpen && (
            <RealtimeChatPanel
              selfUserId={user?.id}
              counterpartUserId={activeIdea.owner_user_id}
              counterpartName={activeIdea.founder?.name || 'Founder'}
              ideaRef={activeIdea.id}
              isFounder={false}
            />
          )}
        </>
      )}

      {termSheetOpen && (
        <TermSheetModal
          slotId={activeIdea?.id}
          selfUserId={user?.id}
          counterpartUserId={activeIdea?.owner_user_id}
          isFounder={false}
          onClose={() => setTermSheetOpen(false)}
        />
      )}
    </div>
  )
}
