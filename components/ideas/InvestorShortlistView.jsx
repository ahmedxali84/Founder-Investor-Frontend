'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext.jsx'
import { raiseHand } from '../../lib/matchesApi.js'
import { scoreBadgeTone, mvpStatusTone } from '../../lib/format.js'
import EmptyState from '../EmptyState.jsx'
import InfoPill from '../InfoPill.jsx'
import Notice from '../Notice.jsx'
import StatTile from '../StatTile.jsx'
import {
  StarIcon, GitHubMark, HandshakeIcon, HandRaiseIcon, CheckCircleIcon,
  ClockIcon, GearIcon, SpinnerIcon, ArrowUpRightIcon, RepoIcon,
} from '../icons.jsx'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

/**
 * One shortlisted startup. Unlike the single "exclusive match" spotlight on
 * /matches, this is deliberately a browsable card — an investor is scanning
 * a deal-flow list, not being walked through one blind reveal at a time.
 */
function ShortlistCard({ idea, slot, onRaised }) {
  const { accessToken } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const founder = idea.founder || {}
  const gh = founder.github_insights || {}
  const tone = scoreBadgeTone(idea.final_score ?? idea.rule_based_score)
  const mvpTone = mvpStatusTone(idea.mvp_status)
  const confirmed = slot?.both_opted_in
  const raised = slot?.investor_raised

  async function handleRaise() {
    setBusy(true)
    setError('')
    try {
      await raiseHand(idea.id, accessToken)
      onRaised?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-3 hover-lift">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-accent-gradient flex items-center justify-center text-white font-black text-sm shrink-0">
            {founder.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <h3 className="text-title text-slate-900 dark:text-slate-100 truncate">{idea.title}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{founder.name || 'Founder'} · {founder.specialization || idea.domain}</p>
          </div>
        </div>
        <InfoPill tone={tone.bg.includes('emerald') ? 'emerald' : tone.bg.includes('blue') ? 'blue' : tone.bg.includes('amber') ? 'amber' : 'slate'}>
          {tone.label} · {Math.round(idea.final_score ?? idea.rule_based_score ?? 0)}
        </InfoPill>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {idea.domain && <InfoPill tone="slate">{idea.domain}</InfoPill>}
        {idea.mvp_status && (
          <InfoPill tone={mvpTone.bg.includes('emerald') ? 'emerald' : mvpTone.bg.includes('blue') ? 'blue' : 'amber'}>
            {idea.mvp_status}{idea.mvp_completion != null ? ` · ${idea.mvp_completion}%` : ''}
          </InfoPill>
        )}
        {gh.verified && <InfoPill tone="blue" dot><GitHubMark className="w-3 h-3 rounded-sm inline" /> Verified GitHub</InfoPill>}
        {founder.repo_url && (
          <InfoPill tone={founder.repo_verified ? 'emerald' : 'slate'}>
            {founder.repo_verified ? 'Repo verified' : 'Repo unverified'}
          </InfoPill>
        )}
      </div>

      {idea.ai_reason && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">"{idea.ai_reason}"</p>
      )}

      <p className={`text-xs text-slate-600 dark:text-slate-300 leading-relaxed ${expanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
        {idea.problem}
      </p>
      {expanded && idea.solution && (
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{idea.solution}</p>
      )}
      {(idea.problem?.length > 140 || idea.solution) && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
        >
          {expanded ? 'Show less' : 'Read full pitch'}
        </button>
      )}

      {(founder.skills || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {founder.skills.slice(0, 5).map((s) => <InfoPill key={s} tone="slate">{s}</InfoPill>)}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          {founder.mvp_url && <a href={founder.mvp_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"><ArrowUpRightIcon className="w-3.5 h-3.5" /> MVP</a>}
          {founder.repo_url && <a href={founder.repo_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"><RepoIcon className="w-3.5 h-3.5" /> Repo</a>}
        </div>

        {confirmed ? (
          <InfoPill tone="emerald" dot>Meeting confirmed</InfoPill>
        ) : raised ? (
          <InfoPill tone="blue" dot>Waiting on founder</InfoPill>
        ) : (
          <button
            onClick={handleRaise}
            disabled={busy}
            className="px-3.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 disabled:opacity-50 text-blue-700 dark:text-blue-400 text-[11px] font-bold transition-all flex items-center gap-1.5"
          >
            {busy ? <SpinnerIcon className="w-3 h-3" /> : <HandRaiseIcon className="w-3.5 h-3.5" />}
            {busy ? 'Raising…' : 'Raise Hand'}
          </button>
        )}
      </div>

      {error && <Notice tone="error">{error}</Notice>}
    </div>
  )
}

/**
 * The investor's practical replacement for "My Ideas" — investors don't
 * post ideas, they review a ranked deal-flow of startups Agent 4/5 already
 * shortlisted for them (up to 8, same data /matches' single spotlight uses,
 * just not gated one-at-a-time). Raising a hand here uses the same
 * /api/raise-hand endpoint as the matches spotlight — it already accepts
 * any idea_id in the shortlist, not just the current exclusive match.
 */
export default function InvestorShortlistView({ ready, topIdeas, meetingRequests, onRefetch }) {
  const { accessToken } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')

  const ideas = topIdeas || []
  const slotsById = Object.fromEntries((meetingRequests || []).map((s) => [s.id, s]))

  const mvpReadyCount = ideas.filter((i) => i.mvp_ready).length
  const pendingCount = ideas.filter((i) => slotsById[i.id]?.investor_raised && !slotsById[i.id]?.both_opted_in).length
  const confirmedCount = ideas.filter((i) => slotsById[i.id]?.both_opted_in).length

  // The shortlist/current_match were only ever computed once, at onboarding
  // — a founder who goes live afterward would otherwise never show up here
  // at all. Mirrors the founder side's per-idea "Refresh matches" button.
  async function handleRefresh() {
    setRefreshing(true)
    setRefreshError('')
    try {
      const res = await fetch(`${API_URL}/investor/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Failed to refresh shortlist.')
      onRefetch?.()
    } catch (err) {
      setRefreshError(err.message)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-page md:text-page-lg text-slate-900 dark:text-slate-100 tracking-tight">Startup Shortlist</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            AI-ranked startups matched to your focus sectors and ticket size — raise your hand on any that interest you.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || !ready}
          title="Re-run matching against the current startup pool"
          className="px-4 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 disabled:opacity-50 text-blue-700 dark:text-blue-400 text-[11px] font-bold transition-all flex items-center gap-1.5"
        >
          {refreshing && <SpinnerIcon className="w-3 h-3" />}
          {refreshing ? 'Refreshing…' : 'Refresh Shortlist'}
        </button>
      </div>

      {refreshError && <Notice tone="error" className="mb-4">{refreshError}</Notice>}

      {ready && ideas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatTile icon={<StarIcon className="w-[18px] h-[18px]" />} label="Shortlisted" value={ideas.length} tone="blue" delta="startups ranked" />
          <StatTile icon={<CheckCircleIcon className="w-[18px] h-[18px]" />} label="MVP-ready" value={mvpReadyCount} tone="emerald" delta="verified reachable" />
          <StatTile icon={<ClockIcon className="w-[18px] h-[18px]" />} label="Awaiting reply" value={pendingCount} tone="amber" delta="hand raised" />
          <StatTile icon={<HandshakeIcon className="w-[18px] h-[18px]" />} label="Confirmed" value={confirmedCount} tone="emerald" delta="both opted in" />
        </div>
      )}

      {!ready ? (
        <EmptyState
          icon={<GearIcon className="w-6 h-6" />}
          title="Building your shortlist..."
          subtitle="This usually takes a few seconds while Agent 4 ranks startups against your focus sectors and ticket size."
          pulse
          className="h-64"
        />
      ) : ideas.length === 0 ? (
        <EmptyState
          icon={<StarIcon className="w-6 h-6" />}
          title="No startups shortlisted yet"
          subtitle="Once a founder goes live with an MVP-ready idea matching your focus, it'll be ranked and show up here."
          className="h-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {ideas.map((idea) => (
            <ShortlistCard key={idea.id} idea={idea} slot={slotsById[idea.id]} onRaised={onRefetch} />
          ))}
        </div>
      )}

      {ready && ideas.length > 0 && confirmedCount > 0 && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 text-center">
          Confirmed a meeting? Head to <Link href="/messaging" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">Messages</Link> to start the conversation.
        </p>
      )}
    </>
  )
}
