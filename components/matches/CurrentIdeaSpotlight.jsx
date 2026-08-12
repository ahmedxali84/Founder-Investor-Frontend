'use client'

import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { scoreBadgeTone, mvpStatusTone } from '../../lib/format.js'
import { raiseHand, rejectMatch } from '../../lib/matchesApi.js'
import { downloadAuthenticated } from '../../lib/apiClient.js'
import InfoPill from '../InfoPill.jsx'
import Notice from '../Notice.jsx'
import { SpinnerIcon, GitHubMark, StarIcon, LockIcon, RepoIcon, ArrowUpRightIcon, RocketIcon, CheckCircleIcon } from '../icons.jsx'

/**
 * Investor-facing spotlight: the single best current startup match. The
 * idea's actual problem/solution/roadmap/repo stay blind (a teaser only —
 * founder identity, domain, MVP readiness, match score, skills) until the
 * investor explicitly reveals it — the exclusivity is the point, not a
 * browsable catalog of ideas to skim.
 */
export default function CurrentIdeaSpotlight({ currentMatch, meetingSlot, onActionDone }) {
  const { accessToken } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [revealed, setRevealed] = useState(false)

  if (!currentMatch || !currentMatch.idea) return null
  const idea = currentMatch.idea
  const founder = idea.founder || {}
  const gh = founder.github_insights || {}
  const hasGithub = Boolean(gh.verified)
  const tone = scoreBadgeTone(currentMatch.score)
  const mvpTone = mvpStatusTone(idea.mvp_status)
  const raised = meetingSlot?.investor_raised
  const confirmed = meetingSlot?.both_opted_in

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
            {founder.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Your Exclusive Top Match</span>
            <h2 className="text-title text-slate-900 dark:text-slate-100 mt-0.5 leading-tight">
              {revealed ? idea.title : 'Confidential Startup Match'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{founder.name} · {founder.specialization} · {idea.domain}</p>
          </div>
        </div>
        <InfoPill tone={tone.bg.includes('emerald') ? 'emerald' : tone.bg.includes('blue') ? 'blue' : 'amber'}>
          {tone.label} · {Math.round(currentMatch.score)}
        </InfoPill>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {idea.mvp_status && (
          <InfoPill tone={mvpTone.bg.includes('emerald') ? 'emerald' : mvpTone.bg.includes('blue') ? 'blue' : 'amber'}>
            {idea.mvp_status} {idea.mvp_completion != null ? `· ${idea.mvp_completion}%` : ''}
          </InfoPill>
        )}
        {founder.linkedin_verified && <InfoPill tone="blue" dot>LinkedIn verified</InfoPill>}
        {(founder.skills || []).slice(0, 5).map((s) => <InfoPill key={s} tone="slate">{s}</InfoPill>)}
      </div>

      {hasGithub && (
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
            <GitHubMark className="w-4 h-4 rounded-sm" /> Verified real GitHub — @{gh.username}
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span>{gh.public_repos} repos</span>
            <span className="inline-flex items-center gap-1"><StarIcon className="w-3.5 h-3.5 text-amber-500" /> {gh.stars_count} stars</span>
            <span>{gh.followers} followers</span>
          </div>
        </div>
      )}

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/10 hover:bg-blue-50 dark:hover:bg-blue-500/15 hover:border-blue-300 dark:hover:border-blue-500/50 text-blue-700 dark:text-blue-400 text-xs font-bold transition-all duration-150 active:scale-[0.99]"
        >
          <span className="inline-flex items-center gap-1.5"><LockIcon /> Reveal full idea — problem, solution, roadmap & repo</span>
        </button>
      ) : (
        <>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{idea.problem}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{idea.solution}</p>

          {(idea.features_must_have?.length > 0 || idea.roadmap?.length > 0) && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                <RocketIcon className="w-3.5 h-3.5 text-blue-500" /> Agent 1 — Roadmap & MVP Scope
              </div>

              {idea.features_must_have?.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1.5">Must-have (MVP)</p>
                    <ul className="space-y-1">
                      {idea.features_must_have.map((f, i) => (
                        <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex gap-1.5">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {idea.features_nice_to_have?.length > 0 && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nice-to-have</p>
                      <ul className="space-y-1">
                        {idea.features_nice_to_have.map((f, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex gap-1.5">
                            <span className="text-slate-400 dark:text-slate-500">•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {idea.roadmap?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Build Roadmap</p>
                  <ul className="space-y-1">
                    {idea.roadmap.map((step, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {founder.screenshot_url && (
            <img src={founder.screenshot_url} alt="MVP screenshot" className="w-full max-h-64 object-cover rounded-2xl border border-slate-100 dark:border-slate-800" />
          )}

          {founder.repo_url && (
            <InfoPill tone={founder.repo_verified ? 'emerald' : 'slate'}>
              <GitHubMark className="w-3 h-3 rounded-sm inline mr-1" />
              {founder.repo_verified ? 'Repo ownership verified' : 'Repo unverified'}
            </InfoPill>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
            {founder.resume_url && (
              <button
                type="button"
                onClick={() => downloadAuthenticated(founder.resume_url, accessToken, `${(founder.name || 'founder').replace(/\s+/g, '_')}_resume.docx`)}
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <ArrowUpRightIcon className="w-3.5 h-3.5" /> Download resume
              </button>
            )}
            {founder.mvp_url && <a href={founder.mvp_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"><ArrowUpRightIcon className="w-3.5 h-3.5" /> View live MVP</a>}
            {founder.repo_url && <a href={founder.repo_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"><RepoIcon className="w-3.5 h-3.5" /> View repo</a>}
            {currentMatch.reason && <span className="text-slate-400 dark:text-slate-500 font-normal italic">"{currentMatch.reason}"</span>}
          </div>
        </>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-wrap gap-3 pt-2">
        {confirmed ? (
          <InfoPill tone="emerald" dot>Meeting confirmed — chat is live below</InfoPill>
        ) : raised ? (
          <InfoPill tone="blue" dot>Interest raised — waiting on {founder.name}</InfoPill>
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
