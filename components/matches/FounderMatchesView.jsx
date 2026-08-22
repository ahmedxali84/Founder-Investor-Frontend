'use client'

import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { requestMeeting, completeDeal } from '../../lib/matchesApi.js'
import MvpGateBanner from './MvpGateBanner.jsx'
import CurrentMatchSpotlight from './CurrentMatchSpotlight.jsx'
import RealtimeChatPanel from './RealtimeChatPanel.jsx'
import ChatAndAgreementBar from './ChatAndAgreementBar.jsx'
import TermSheetModal from './TermSheetModal.jsx'
import EmptyState from '../EmptyState.jsx'
import InfoPill from '../InfoPill.jsx'
import Notice from '../Notice.jsx'
import { HandshakeIcon, HandRaiseIcon, SpinnerIcon, LockIcon } from '../icons.jsx'

/**
 * An investor can raise their hand on any idea in their own Startup
 * Shortlist — that doesn't require this founder's `current_match` (a
 * snapshot taken at this founder's last idea activation/"Refresh matches")
 * to already point at that same investor. Without this card, a founder gets
 * the "investor raised their hand" notification but /matches shows nothing
 * actionable at all, because CurrentMatchSpotlight only ever renders for
 * current_match's own investor. Surface it directly from meeting_requests
 * instead, independent of current_match, so real interest is never silently
 * dropped just because Agent 5's snapshot hasn't caught up.
 */
function PendingInterestCard({ slot, mvpUrlValid, onActionDone }) {
  const { accessToken } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const investor = slot.investor || {}
  const confirmed = slot.both_opted_in

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

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden animate-card-in">
      <div className="h-1.5 bg-accent-gradient" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-accent-gradient flex items-center justify-center text-white font-black text-base shrink-0 shadow-glow">
            {confirmed ? (investor.name?.[0]?.toUpperCase() || '?') : <LockIcon />}
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest inline-flex items-center gap-1">
              <HandRaiseIcon className="w-3 h-3" /> Interested Investor
            </span>
            <h2 className="text-title text-slate-900 dark:text-slate-100 mt-0.5 leading-tight">
              {confirmed ? (investor.name || 'An investor') : 'Confidential Investor'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {confirmed
                ? `${investor.designation}${investor.designation && investor.firm ? ' at ' : ''}${investor.firm}`
                : 'Identity unlocks once the meeting is confirmed'}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Raised their hand on your live idea — outside your current algorithmic top match, but real interest all the same.
        </p>

        {error && <Notice tone="error">{error}</Notice>}

        {slot.both_opted_in ? (
          <InfoPill tone="emerald" dot>Meeting confirmed — chat and agreement options below</InfoPill>
        ) : slot.founder_requested ? (
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
      </div>
    </div>
  )
}

/**
 * Founder mainly sees their single exclusive match (Agent 4/5's #1 pick),
 * but that's a snapshot — not live-synced with meeting_requests — so real
 * raised-hand interest that falls outside it is still surfaced below via
 * PendingInterestCard rather than silently dropped.
 */
export default function FounderMatchesView({ mvpUrlValid, currentMatch, meetingRequests, founderDomain, myIdeaId, onRefetch }) {
  const { user, accessToken } = useAuth()
  const [termSheetOpen, setTermSheetOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [markingDone, setMarkingDone] = useState(false)
  const [markDoneError, setMarkDoneError] = useState('')
  const slotsById = Object.fromEntries((meetingRequests || []).map((s) => [s.id, s]))
  const spotlightSlot = currentMatch?.investor ? slotsById[currentMatch.investor.id] : null
  // A completed deal frees this investor up to be matched again (see
  // /api/complete-deal), but current_match itself is never reset when that
  // happens — without this, the spotlight kept showing the finished deal
  // forever, and worse, real new raised-hand interest from a different
  // investor stayed completely hidden below, because the fallback search
  // only ever ran when there was no current_match at all.
  const currentMatchCompleted = Boolean(spotlightSlot?.completed)

  const otherInterest = (!currentMatch?.investor || currentMatchCompleted)
    ? (meetingRequests || []).find((s) =>
        s.id !== currentMatch?.investor?.id && (s.investor_raised || s.both_opted_in))
    : null

  // Whichever investor is actually actionable right now — the algorithmic
  // top match if there is one and it isn't already finished, otherwise real
  // raised-hand interest that current_match's stale snapshot hasn't caught
  // up to (including a brand-new investor showing up after the last one's
  // deal completed).
  const activeInvestor = (currentMatch?.investor && !currentMatchCompleted) ? currentMatch.investor : otherInterest?.investor
  const activeSlot = (spotlightSlot && !currentMatchCompleted) ? spotlightSlot : otherInterest

  async function handleMarkDone() {
    if (!activeInvestor?.id) return
    setMarkingDone(true)
    setMarkDoneError('')
    try {
      await completeDeal(activeInvestor.id, accessToken)
      onRefetch?.()
    } catch (err) {
      setMarkDoneError(err.message)
    } finally {
      setMarkingDone(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* mvpUrlValid can legitimately drift back to false later (the URL
          stops resolving, gets swapped for an unreachable one, etc.) without
          undoing a meeting that's already confirmed — showing "unlock
          meetings" right next to an open live chat reads as a direct
          contradiction, so only show the gate when there's actually
          something it would be gating. */}
      {!mvpUrlValid && !activeSlot?.both_opted_in && <MvpGateBanner onUnlocked={onRefetch} />}

      {currentMatch?.investor && !currentMatchCompleted ? (
        <CurrentMatchSpotlight
          currentMatch={currentMatch}
          mvpUrlValid={mvpUrlValid}
          meetingSlot={spotlightSlot}
          founderDomain={founderDomain}
          onActionDone={onRefetch}
        />
      ) : otherInterest ? (
        <PendingInterestCard slot={otherInterest} mvpUrlValid={mvpUrlValid} onActionDone={onRefetch} />
      ) : (
        <EmptyState icon={<HandshakeIcon className="w-6 h-6" />} title="No active match right now" subtitle="Post a live idea (or pass on your current one) to get matched with the single best investor for you." />
      )}

      {activeSlot?.both_opted_in && activeInvestor?.owner_user_id && (
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
              counterpartUserId={activeInvestor.owner_user_id}
              counterpartName={activeInvestor.name}
              ideaRef={myIdeaId}
            />
          )}
        </>
      )}

      {termSheetOpen && (
        <TermSheetModal
          slotId={activeInvestor?.id}
          selfUserId={user?.id}
          counterpartUserId={activeInvestor?.owner_user_id}
          isFounder
          onClose={() => setTermSheetOpen(false)}
        />
      )}
    </div>
  )
}
