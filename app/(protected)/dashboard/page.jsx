'use client'

import Link from 'next/link'
import { useAgentStatus } from '../../../hooks/useAgentStatus.js'
import AppShell from '../../../components/AppShell.jsx'
import StatTile from '../../../components/StatTile.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import { PageSkeleton } from '../../../components/Skeleton.jsx'
import {
  HandshakeIcon, HandRaiseIcon, CheckCircleIcon, ClockIcon, CodeIcon,
  RepoIcon, StarIcon, PinIcon, BuildingIcon, BulbIcon, RobotIcon,
  ArrowRightIcon, ArrowUpRightIcon,
} from '../../../components/icons.jsx'

// Segment colors for the language ratio ring, in draw order.
const LANG_COLORS = ['#2563EB', '#6366F1', '#10B981', '#F59E0B', '#EC4899', '#14B8A6']

export default function Dashboard() {
  const {
    loading, ready, userType, statusData, profileData,
    githubInsights, investorProfile, userName, userRole, avatarUrl, pollingError, signOut,
  } = useAgentStatus()
  const isInvestor = userType === 'investor'

  const publicRepos = githubInsights.public_repos ?? 0
  const topLanguages = githubInsights.top_languages || {}
  const repoDetails = githubInsights.repo_details || []
  const investorLocation = [investorProfile?.location?.city, investorProfile?.location?.country].filter(Boolean).join(', ')

  const meetingRequests = statusData?.meeting_requests || []
  const confirmedCount = meetingRequests.filter((s) => s.both_opted_in).length
  const pendingCount = meetingRequests.filter((s) => !s.both_opted_in && (s.founder_requested || s.investor_raised)).length
  const shortlistCount = userType === 'investor' ? (statusData?.top_ideas?.length || 0) : (statusData?.top_investors?.length || 0)

  // Build a real conic-gradient ring from the language ratio.
  const langEntries = Object.entries(topLanguages)
  let acc = 0
  const stops = langEntries.map(([lang, pct], i) => {
    const start = acc
    acc += Number(pct) || 0
    return `${LANG_COLORS[i % LANG_COLORS.length]} ${start}% ${acc}%`
  })
  const ringStyle = stops.length
    ? { background: `conic-gradient(${stops.join(', ')})` }
    : { background: 'conic-gradient(#E2E8F0 0% 100%)' }

  if (loading) return <PageSkeleton />

  return (
    <AppShell active="overview" userType={userType} userName={userName} userRole={userRole} avatarUrl={avatarUrl} onSignOut={signOut} notice={pollingError} profileData={profileData} statusData={statusData}>
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-page md:text-page-lg text-slate-900 dark:text-slate-100 tracking-tight">Overview</h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isInvestor
                  ? 'Insights extracted from your LinkedIn verification and deal activity.'
                  : 'Insights extracted from your live GitHub activity and LinkedIn verification.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[12px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Session live
              </div>
              <Link href="/matches" className="btn-accent inline-flex items-center gap-1.5">
                View matches <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Matches at a glance — real shortlist/meeting counts, not fabricated.
              The 4th tile is GitHub-derived, so investors (never asked for
              GitHub) get a 3-column layout instead of a permanently-zero tile. */}
          <div className={`grid grid-cols-2 gap-4 ${isInvestor ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
            <StatTile icon={<HandshakeIcon className="w-[18px] h-[18px]" />} label="Shortlisted" value={ready ? shortlistCount : '—'} tone="blue" delta={ready ? (userType === 'investor' ? 'startups ranked' : 'investors ranked') : undefined} />
            <StatTile icon={<HandRaiseIcon className="w-[18px] h-[18px]" />} label="Pending requests" value={ready ? pendingCount : '—'} tone="amber" delta={ready ? 'awaiting reply' : undefined} />
            <StatTile icon={<CheckCircleIcon className="w-[18px] h-[18px]" />} label="Confirmed meetings" value={ready ? confirmedCount : '—'} tone="emerald" delta={ready ? 'both opted in' : undefined} />
            {!isInvestor && (
              <StatTile icon={<CodeIcon className="w-[18px] h-[18px]" />} label="Public repos" value={publicRepos} tone="blue" delta={githubInsights.verified ? 'live GitHub' : undefined} deltaMuted={githubInsights.verified ? 'verified' : undefined} />
            )}
          </div>

          {/* GitHub tech-stack ratio + live repos — founders only. Investors
              are never asked to connect GitHub, so this would always just be
              two permanently-empty cards pointing them at a step that
              doesn't apply to their onboarding. */}
          {!isInvestor && (
            <div className="grid md:grid-cols-12 gap-6">
              <div className="md:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-title text-slate-800 dark:text-slate-100">GitHub tech-stack ratio</h3>
                <div className="flex items-center justify-center relative py-3">
                  <div className="w-36 h-36 rounded-full p-[14px]" style={ringStyle}>
                    <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center shadow-inner">
                      <span className="text-xl font-black text-slate-900 dark:text-slate-100 tabular-nums">{publicRepos}</span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Live repos</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[12px] font-semibold">
                  {langEntries.length === 0 ? (
                    <div className="text-center text-[12px] text-slate-400 dark:text-slate-500 py-2">
                      Connect GitHub during onboarding to fetch a live language ratio.
                    </div>
                  ) : (
                    langEntries.map(([lang, pct], i) => (
                      <div key={lang} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: LANG_COLORS[i % LANG_COLORS.length] }} />
                        <span className="text-slate-600 dark:text-slate-300">{lang}</span>
                        <span className="ml-auto font-bold text-slate-800 dark:text-slate-100 tabular-nums">{pct}%</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="md:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-title text-slate-800 dark:text-slate-100">Live public repositories <span className="text-slate-400 dark:text-slate-500 font-semibold">({repoDetails.length})</span></h3>
                  <Link href="/profile" className="text-[12px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                    Profile <ArrowUpRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {repoDetails.length === 0 ? (
                  <EmptyState icon={<RepoIcon className="w-6 h-6" />} title="No repositories yet" subtitle="Add a GitHub username during onboarding to stream your live repositories here." />
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1 -mr-1">
                    {repoDetails.map((r) => (
                      <div key={r.name} className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                        <div className="min-w-0">
                          <a href={r.url} target="_blank" rel="noreferrer" className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5">
                            <RepoIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="truncate">{r.name}</span>
                          </a>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 block">{r.description}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {r.language && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                              {r.language}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-amber-500 dark:text-amber-400 font-bold text-[11px]">
                            <StarIcon className="w-3.5 h-3.5" /> {r.stars}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-title text-slate-800 dark:text-slate-100">Meeting requests</h3>
              <Link href="/matches" className="text-[12px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                Manage <ArrowUpRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
            {meetingRequests.length === 0 ? (
              <EmptyState icon={<HandshakeIcon className="w-6 h-6" />} title="No meeting activity yet" subtitle="Once you request a meeting — or an investor raises their hand — it'll show up here." />
            ) : (
              <div className="space-y-2">
                {meetingRequests.slice(0, 5).map((slot) => {
                  const confirmed = slot.both_opted_in
                  const completed = Boolean(slot.completed)
                  // Investor identity stays confidential to the founder until the
                  // meeting is actually confirmed — same rule as the Matches page,
                  // so this widget can't be used to peek at who it is early.
                  const counterpart = !confirmed && userType === 'founder'
                    ? 'Confidential Investor'
                    : slot.investor?.name || slot.idea?.title || 'Match'
                  const badgeTone = completed
                    ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
                    : confirmed
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20'
                  return (
                    <div key={slot.id} className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{counterpart}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${badgeTone}`}>
                        {confirmed || completed ? <CheckCircleIcon className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
                        {completed ? 'Completed' : confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2563EB&color=fff`}
                alt={userName}
                className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2563EB&color=fff` }}
              />
              <div className="min-w-0">
                <h3 className="text-title text-slate-800 dark:text-slate-100 truncate">{userName}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{userRole}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[12px] text-slate-600 dark:text-slate-300">
              {isInvestor ? (
                <>
                  {investorLocation && (
                    <div className="flex items-center gap-2"><PinIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {investorLocation}</div>
                  )}
                  {investorProfile?.firm && (
                    <div className="flex items-center gap-2"><BuildingIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {investorProfile.firm}</div>
                  )}
                </>
              ) : (
                <>
                  {githubInsights.location && (
                    <div className="flex items-center gap-2"><PinIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {githubInsights.location}</div>
                  )}
                  {githubInsights.company && (
                    <div className="flex items-center gap-2"><BuildingIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {githubInsights.company}</div>
                  )}
                </>
              )}
              <Link
                href="/profile"
                className="mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold text-[12px] hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
              >
                View profile wall <ArrowUpRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-2">
            <h3 className="text-title text-slate-800 dark:text-slate-100 mb-1">Quick links</h3>
            {[
              { to: '/matches', Icon: HandshakeIcon, label: 'View matches' },
              userType === 'investor'
                ? { to: '/ideas', Icon: BulbIcon, label: 'Startup shortlist' }
                : { to: '/ideas', Icon: BulbIcon, label: 'My ideas' },
              { to: '/agents', Icon: RobotIcon, label: 'Agent activity' },
            ].map(({ to, Icon, label }) => (
              <Link key={to} href={to} className="group flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-[12px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 transition-colors">
                <Icon className="w-[18px] h-[18px] text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                <span>{label}</span>
                <ArrowRightIcon className="w-4 h-4 ml-auto text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
