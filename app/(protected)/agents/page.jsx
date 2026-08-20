'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext.jsx'
import { useAgentStatus } from '../../../hooks/useAgentStatus.js'
import Notice from '../../../components/Notice.jsx'
import AppShell from '../../../components/AppShell.jsx'
import InfoPill from '../../../components/InfoPill.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import { Skeleton } from '../../../components/Skeleton.jsx'
import {
  ProfileIcon, RepoIcon, BulbIcon, HandshakeIcon, CheckCircleIcon,
  ClockIcon, SpinnerIcon, WarningIcon, RobotIcon, ArrowRightIcon,
} from '../../../components/icons.jsx'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// Human-facing framing of the pipeline — no agent internals, session refs, or
// raw model output, since real founders/investors (not just developers) land
// on this page. `core: true` steps always show; the rest only appear once
// they've actually run (they're conditional actions like "next best match
// after a rejection", not something every user goes through).
const STEP_DEFS = [
  {
    key: (role) => (role === 'investor' ? 'agent2_investor' : 'agent2_founder'),
    title: 'Building your profile',
    // Investors are never asked for GitHub — Agent 2's investor variant only
    // ever reads LinkedIn — so this can't be one fixed string for both roles.
    description: (role) => role === 'investor'
      ? "We're reading your LinkedIn to put together your profile."
      : "We're reading your LinkedIn and GitHub to put together your profile.",
    icon: ProfileIcon,
    core: true,
  },
  {
    key: () => 'agent3',
    title: 'Preparing your resume',
    description: 'Polishing your profile into an investor-ready resume.',
    icon: RepoIcon,
    core: true,
    roles: ['founder'],
  },
  {
    key: () => 'agent1',
    title: 'Reviewing your idea',
    description: 'Reading your idea and mapping out an MVP roadmap.',
    icon: BulbIcon,
    core: true,
    roles: ['founder'],
  },
  {
    key: () => 'agent4',
    title: 'Finding your best matches',
    description: 'Scoring and shortlisting the strongest matches for you.',
    icon: HandshakeIcon,
    core: true,
  },
  {
    key: () => 'agent5',
    title: 'Checking match readiness',
    description: "Double-checking your top match is ready to connect.",
    icon: CheckCircleIcon,
    core: true,
  },
  {
    key: (role) => (role === 'investor' ? 'agent6_investor' : 'agent6_founder'),
    title: 'Finding your next match',
    description: 'Routing you to the next-best match after a pass.',
    icon: RobotIcon,
    core: false,
  },
  {
    key: () => 'agent7',
    title: 'Drafting your agreement',
    description: 'Turning your conversation into a draft investment agreement.',
    icon: RepoIcon,
    core: false,
  },
]

function timeAgo(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d)) return null
  const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000))
  if (seconds < 10) return 'Just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const STATUS_META = {
  idle: { label: 'Waiting', tone: 'slate', Icon: ClockIcon },
  running: { label: 'In progress', tone: 'amber', Icon: SpinnerIcon },
  done: { label: 'Done', tone: 'emerald', Icon: CheckCircleIcon },
  failed: { label: 'Needs attention', tone: 'rose', Icon: WarningIcon },
}

export default function AgentsDashboard() {
  const { user, accessToken, signOut } = useAuth()
  const router = useRouter()
  // Mostly just for the notification bell — this page tracks its own
  // role/onboarded/agent-pipeline state separately above/below. userRole is
  // the exception: it's pulled from here rather than recomputed, so this
  // page shows the same real designation ("CEO", "Partner", ...) every
  // other page does instead of a generic "Investor"/"Founder" placeholder.
  const { profileData, statusData, userRole } = useAgentStatus()

  const [role, setRole] = useState('founder')
  const [onboarded, setOnboarded] = useState(null) // null = not known yet
  const [agentsById, setAgentsById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState({}) // agentId -> bool
  const [retryErrors, setRetryErrors] = useState({}) // agentId -> error text

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  // A ref, not state — read synchronously by the polling loop below to pick
  // the next delay; state would only be visible on the following render,
  // one tick too late for that decision.
  const consecutiveErrorsRef = useRef(0)

  async function fetchStatus() {
    try {
      const res = await fetch(`${API_URL}/agents/status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error('Failed to fetch agent status')
      const data = await res.json()
      setAgentsById(Object.fromEntries((data.agents || []).map((a) => [a.agent_id, a])))
      setError('')
      consecutiveErrorsRef.current = 0
    } catch (err) {
      console.error(err)
      consecutiveErrorsRef.current += 1
      setError("Couldn't load your progress right now. Retrying…")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.user_type) setRole(data.user_type)
          setOnboarded(Boolean(data.onboarded))
        }
      } catch {
        // default 'founder' framing is a reasonable fallback
      }
    }
    if (accessToken) loadProfile()
  }, [accessToken])

  useEffect(() => {
    let cancelled = false
    let timer = null

    async function tick() {
      await fetchStatus()
      if (cancelled) return
      // Back off exponentially on repeated failures (capped at 30s) instead
      // of hammering a downed endpoint every 3s indefinitely; drops straight
      // back to the 3s base the moment a poll succeeds.
      const delay = Math.min(3000 * 2 ** consecutiveErrorsRef.current, 30000)
      timer = setTimeout(tick, delay)
    }

    tick()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [accessToken])

  async function handleRetry(agentId) {
    setRetrying((prev) => ({ ...prev, [agentId]: true }))
    setRetryErrors((prev) => ({ ...prev, [agentId]: '' }))
    try {
      const res = await fetch(`${API_URL}/agents/${agentId}/rerun`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRetryErrors((prev) => ({ ...prev, [agentId]: data.detail || "Couldn't retry that step." }))
      }
    } catch {
      setRetryErrors((prev) => ({ ...prev, [agentId]: 'Network error — please try again.' }))
    } finally {
      setRetrying((prev) => ({ ...prev, [agentId]: false }))
      fetchStatus()
    }
  }

  const steps = STEP_DEFS
    .filter((def) => !def.roles || def.roles.includes(role))
    .map((def) => ({
      ...def,
      agentId: def.key(role),
      description: typeof def.description === 'function' ? def.description(role) : def.description,
    }))
    .map((def) => ({ ...def, agent: agentsById[def.agentId] }))
    .filter((def) => def.core || (def.agent && def.agent.status !== 'idle'))

  // A brand-new account has nothing for these steps to report on yet — five
  // identical "Waiting" pills reads as broken, not as "nothing to do yet".
  // Point at the actual next action instead of just watching an empty pipeline.
  const profileBuilt = agentsById.agent2_founder?.status === 'done' || agentsById.agent2_investor?.status === 'done'
  const founderHasNoIdeaYet =
    role === 'founder' && onboarded && profileBuilt && (agentsById.agent1?.status || 'idle') === 'idle'

  return (
    <AppShell active="agents" userType={role} userName={userName} userRole={userRole} onSignOut={signOut} profileData={profileData} statusData={statusData}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-page md:text-page-lg text-slate-900 dark:text-slate-100 tracking-tight">Your Progress</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Here's where things stand while our AI agents work on your matches.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          Refresh
        </button>
      </div>

      {error && <Notice tone="error" className="mb-4">{error}</Notice>}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-40 h-4" />
                <Skeleton className="w-64 h-3" />
              </div>
              <Skeleton className="w-20 h-6 rounded-full" />
            </div>
          ))}
        </div>
      ) : onboarded === false ? (
        <EmptyState
          icon={<ProfileIcon className="w-5 h-5" />}
          title="Let's get your profile built first"
          subtitle="Connect your LinkedIn and GitHub and our AI agents will build your profile, resume, and matches from there."
          action={
            <button onClick={() => router.push('/onboarding')} className="btn-accent inline-flex items-center gap-1.5">
              Complete your profile <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          }
        />
      ) : founderHasNoIdeaYet ? (
        <EmptyState
          icon={<BulbIcon className="w-5 h-5" />}
          title="Post an idea to kick things off"
          subtitle="Your profile's ready — post your startup idea and the agents below will build your roadmap and start finding investor matches."
          action={
            <button onClick={() => router.push('/ideas')} className="btn-accent inline-flex items-center gap-1.5">
              Post your idea <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => {
            const status = step.agent?.status || 'idle'
            const meta = STATUS_META[status] || STATUS_META.idle
            const StatusIcon = meta.Icon
            const StepIcon = step.icon
            const isFailed = status === 'failed'
            const isLast = index === steps.length - 1

            return (
              <div key={step.agentId} className="relative">
                {!isLast && (
                  <div className="absolute left-[35px] top-[52px] bottom-[-12px] w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
                )}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    status === 'done' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : status === 'running' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : status === 'failed' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}>
                    <StepIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-title text-slate-900 dark:text-slate-100">{step.title}</h3>
                      <InfoPill tone={meta.tone} dot={status === 'running'}>
                        <StatusIcon className={`w-3 h-3 ${status === 'running' ? 'animate-spin' : ''}`} />
                        {meta.label}
                      </InfoPill>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{step.description}</p>

                    {isFailed && (
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={() => handleRetry(step.agentId)}
                          disabled={retrying[step.agentId]}
                          className="h-8 px-4 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 disabled:opacity-50 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors"
                        >
                          {retrying[step.agentId] ? 'Retrying…' : 'Try again'}
                        </button>
                        {retryErrors[step.agentId] && (
                          <span className="text-[11px] text-rose-500 dark:text-rose-400">{retryErrors[step.agentId]}</span>
                        )}
                      </div>
                    )}

                    {step.agent?.updated_at && (status === 'done' || status === 'failed') && (
                      <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1.5">{timeAgo(step.agent.updated_at)}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
