'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext.jsx'
import { useAgentStatus } from '../../../hooks/useAgentStatus.js'
import { supabase } from '../../../lib/supabaseClient.js'
import { downloadAuthenticated } from '../../../lib/apiClient.js'
import { safeHref } from '../../../lib/validation.js'
import AppShell from '../../../components/AppShell.jsx'
import StatTile from '../../../components/StatTile.jsx'
import InfoPill from '../../../components/InfoPill.jsx'
import Notice from '../../../components/Notice.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import { PageSkeleton } from '../../../components/Skeleton.jsx'
import {
  LinkedInMark, GitHubMark, RepoIcon, StarIcon, ProfileIcon,
  BulbIcon, RobotIcon, HandshakeIcon, CheckCircleIcon,
  ArrowRightIcon, ArrowUpRightIcon, HomeIcon, WarningIcon,
} from '../../../components/icons.jsx'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export default function ProfilePage() {
  const { user, accessToken, signOut } = useAuth()
  // Only used to feed the notification bell — this page loads its own
  // profile/pitch-posts data separately below via Supabase directly.
  const { profileData, statusData } = useAgentStatus()

  const [profile, setProfile] = useState(null)
  const [pitchPosts, setPitchPosts] = useState([])
  const [loading, setLoading] = useState(true)
  // Distinct from "profile is null" — lets the render branch below show an
  // honest retry screen instead of silently falling through to the founder-
  // mode default a moment ago, which meant a transient network blip on this
  // fetch showed an investor their own account rendered as a founder with no
  // indication anything had gone wrong.
  const [loadError, setLoadError] = useState(false)
  const [resumeError, setResumeError] = useState('')
  const [downloadingResume, setDownloadingResume] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadProfileAndPosts() {
      try {
        setLoading(true)
        setLoadError(false)
        let loadedUserType = null

        if (accessToken) {
          const res = await fetch(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          if (res.ok) {
            const data = await res.json()
            if (cancelled) return
            setProfile(data)
            loadedUserType = data.user_type || 'founder'
          } else {
            if (cancelled) return
            setLoadError(true)
          }
        }

        // Investors never post pitch_posts — skip the query entirely rather
        // than running a fetch that's always empty for that role.
        if (loadedUserType === 'founder' && supabase && user?.id) {
          const { data: posts, error } = await supabase
            .from('pitch_posts')
            .select('*')
            .eq('founder_id', user.id)
            .order('created_at', { ascending: false })

          if (cancelled) return
          if (!error && posts) {
            setPitchPosts(posts)
          }
        }
      } catch (err) {
        console.error('Error loading profile page:', err)
        if (!cancelled) setLoadError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfileAndPosts()
    return () => { cancelled = true }
  }, [accessToken, user])

  async function handleDownloadResume(url, filename) {
    // downloadAuthenticated used to be called with no error handling at all
    // here — any failure (a 503 while the resume rebuilds from a wiped
    // file, a network blip, ...) just silently did nothing, which is
    // exactly what "I clicked it and nothing happened" looks like from the
    // outside.
    setResumeError('')
    setDownloadingResume(true)
    try {
      await downloadAuthenticated(url, accessToken, filename)
    } catch (err) {
      setResumeError(err.message || 'Could not download the resume. Please try again.')
    } finally {
      setDownloadingResume(false)
    }
  }

  const founderData = profile?.profile || {}
  const rawData = profile?.raw || {}
  const resumeUrl = profile?.resume_url || null
  const userType = profile?.user_type || 'founder'
  const investedIn = profile?.invested_in || []
  // No fallback numbers here on purpose — if Agent 2 hasn't verified a real
  // GitHub account yet, we show an honest empty state instead of invented stats.
  const githubInsights = founderData?.github_insights || {}
  const hasGithubData = Boolean(githubInsights.verified)
  const displayName = founderData.linkedin_verified?.name || user?.user_metadata?.full_name || founderData.name || 'Kavan Member'
  // Prefer the real LinkedIn OAuth photo — it's the literal PFP the person
  // uses professionally, which is a stronger identity signal than GitHub's.
  const avatarUrl = founderData.linkedin_verified?.picture || githubInsights.avatar_url || null
  const avatarSource = founderData.linkedin_verified?.picture ? 'linkedin' : (githubInsights.avatar_url ? 'github' : null)

  if (loading) {
    return <PageSkeleton />
  }

  if (loadError && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-slate-950 px-6">
        <EmptyState
          icon={<WarningIcon className="w-6 h-6" />}
          title="Couldn't load your profile"
          subtitle="That's likely a transient connection issue — your account and data are fine. Try again in a moment."
          action={
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
            >
              Try again
            </button>
          }
          className="max-w-sm"
        />
      </div>
    )
  }

  return (
    <AppShell active="profile" userType={userType} userName={displayName} userRole={userType === 'investor' ? (founderData.designation || 'Investor') : (founderData.role || founderData.specialization || 'Founder')} avatarUrl={avatarUrl} onSignOut={signOut} profileData={profileData} statusData={statusData}>
      <div className="grid md:grid-cols-12 gap-6">
        {/* LEFT / TOP: LinkedIn Style Profile Card */}
        <div className="md:col-span-8 space-y-6">
          {/* Hero Banner & Avatar Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 relative">
            <div className="h-36 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
              <div className="absolute right-4 top-4 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[11px] font-bold text-white uppercase tracking-wider">
                {userType === 'founder' ? 'Verified Founder Profile' : 'Verified Investor Profile'}
              </div>
            </div>

            <div className="px-6 pb-6 pt-0 relative">
              <div className="flex justify-between items-end -mt-16 mb-4">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-900 bg-blue-100 flex items-center justify-center text-3xl font-extrabold text-blue-700 shadow-md overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      user?.email?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <span className="w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full absolute bottom-1 right-1" title="Online" />
                  {avatarSource === 'linkedin' && (
                    <span className="absolute -bottom-1 -right-1 translate-x-1/3 translate-y-1/3 bg-[#0A66C2] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-slate-900">
                      in
                    </span>
                  )}
                </div>
                {userType !== 'investor' && (
                  <Link
                    href="/ideas"
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold transition-all border border-blue-200 dark:border-blue-500/30"
                  >
                    + Post Idea
                  </Link>
                )}
              </div>

              <div>
                <h1 className="text-page md:text-page-lg text-slate-900 dark:text-slate-100">{displayName}</h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  {/* role/specialization are founder-only fields — an investor's
                      profile never has them, so falling back straight to the
                      literal string 'Founder' here mislabeled every investor
                      whose designation wasn't set. Branch on userType instead,
                      same as the "Verified X Profile" banner above. */}
                  {userType === 'investor' ? (founderData.designation || 'Investor') : (founderData.role || founderData.specialization || 'Founder')} • {user?.email}
                </p>
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  <InfoPill tone={founderData.linkedin_verified ? 'emerald' : 'slate'} dot>
                    {founderData.linkedin_verified
                      ? `LinkedIn sign-in verified${founderData.linkedin_verified.picture ? ' (real photo)' : ''}`
                      : 'LinkedIn not signed in'}
                  </InfoPill>
                  {/* Investors are never asked for GitHub during onboarding —
                      showing a "not connected" badge for something they were
                      never asked to connect just reads as broken/confusing. */}
                  {userType !== 'investor' && (
                    <InfoPill tone={hasGithubData ? 'emerald' : 'slate'} dot>
                      {hasGithubData ? 'GitHub live data verified' : 'GitHub not connected'}
                    </InfoPill>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                {rawData.linkedin && (
                  <a
                    href={rawData.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                  >
                    <LinkedInMark className="w-4 h-4" /> LinkedIn Profile
                  </a>
                )}
                {userType !== 'investor' && rawData.github && (
                  <a
                    href={rawData.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    <GitHubMark className="w-4 h-4 [&>path]:fill-slate-800 dark:[&>path]:fill-slate-200" /> GitHub{hasGithubData ? ` (${githubInsights.public_repos} repos)` : ''}
                  </a>
                )}
                {/* Agent 3's resume is a founder-only artifact (built from
                    LinkedIn+GitHub) — investors never get one, so the
                    "building..." placeholder would just be a permanent,
                    misleading promise for them. */}
                {userType !== 'investor' && (
                  resumeUrl ? (
                    <button
                      type="button"
                      disabled={downloadingResume}
                      onClick={() => handleDownloadResume(resumeUrl, `${displayName.replace(/\s+/g, '_')}_resume.docx`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 disabled:opacity-50 transition-all"
                    >
                      <ArrowUpRightIcon className="w-4 h-4" /> {downloadingResume ? 'Downloading…' : 'Download resume'}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      <ArrowUpRightIcon className="w-4 h-4" /> Resume building…
                    </span>
                  )
                )}
              </div>
              {resumeError && <Notice tone="error" className="mt-3">{resumeError}</Notice>}
            </div>
          </div>

          {/* Live GitHub Insights Verification Card — founders only. Investors
              are never asked to connect GitHub, so this card (and its empty
              state) would just be confusing noise on an investor's profile. */}
          {userType !== 'investor' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-title text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <GitHubMark className="w-[18px] h-[18px] [&>path]:fill-slate-800 dark:[&>path]:fill-slate-200" /> Live GitHub API insights
                </h2>
                <InfoPill tone={hasGithubData ? 'emerald' : 'slate'}>
                  {hasGithubData ? 'Live Verified' : 'Not connected yet'}
                </InfoPill>
              </div>

              {!hasGithubData ? (
                <EmptyState icon={<GitHubMark className="w-6 h-6 [&>path]:fill-slate-400" />} title="No GitHub account verified yet" subtitle="Connect a real GitHub profile during onboarding to see live repo, star, and language data here." />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatTile label="Public repos" value={githubInsights.public_repos} icon={<RepoIcon className="w-[18px] h-[18px]" />} />
                    <StatTile label="Total stars" value={githubInsights.stars_count} icon={<StarIcon className="w-[18px] h-[18px]" />} tone="amber" />
                    <StatTile label="Followers" value={githubInsights.followers} icon={<ProfileIcon className="w-[18px] h-[18px]" />} tone="blue" />
                  </div>

                  {githubInsights.top_languages && Object.keys(githubInsights.top_languages).length > 0 && (
                    <div>
                      <h3 className="text-meta text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Verified Languages & Stack Ratio</h3>
                      <div className="space-y-1.5">
                        {Object.entries(githubInsights.top_languages).map(([lang, pct]) => (
                          <div key={lang} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-700 dark:text-slate-300">{lang}</span>
                              <span className="text-blue-600 dark:text-blue-400 font-bold">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {githubInsights.recent_repos && githubInsights.recent_repos.length > 0 && (
                    <div className="pt-2">
                      <h3 className="text-meta text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Verified Public Repositories</h3>
                      <div className="flex flex-wrap gap-2">
                        {githubInsights.recent_repos.map((repo) => (
                          <span key={repo} className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold">
                            <RepoIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 inline mr-1 -mt-0.5" />{repo}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* About / AI Profile Analysis Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-title text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ProfileIcon className="w-[18px] h-[18px] text-slate-500 dark:text-slate-400" /> AI agent summary & professional bio
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {founderData.resume_summary || founderData.bio || rawData.additional || 'Professional bio extracted and verified from your connected profiles.'}
            </p>

            {(founderData.experience || founderData.education) && (
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                {founderData.experience && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase block">Experience Level</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {founderData.experience}
                      {founderData.years_of_experience ? ` · ${founderData.years_of_experience} yrs` : ''}
                    </span>
                  </div>
                )}
                {founderData.education && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase block">Education</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{founderData.education}</span>
                  </div>
                )}
              </div>
            )}

            {founderData.skills && founderData.skills.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-meta text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Verified Core Competencies</h3>
                <div className="flex flex-wrap gap-1.5">
                  {founderData.skills.map((skill) => (
                    <InfoPill key={skill} tone="blue">{skill}</InfoPill>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Investment track record — investors only, derived from confirmed
              deals (GLOBAL_MEETING_REQUESTS slots both sides opted into).
              Stays on the profile even after a deal's negotiation wraps up. */}
          {userType === 'investor' && investedIn.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
              <h2 className="text-title text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <HandshakeIcon className="w-[18px] h-[18px] text-emerald-600 dark:text-emerald-400" /> Investment track record
              </h2>
              <div className="flex flex-wrap gap-2">
                {investedIn.map((deal, i) => (
                  <InfoPill key={deal.idea_id || i} tone="emerald">{deal.title || 'A startup'}</InfoPill>
                ))}
              </div>
            </div>
          )}

          {/* Pitch & MVP Posts Section — founders only; investors don't post
              pitches, so they get a pointer to their shortlist instead. */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-title text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BulbIcon className="w-[18px] h-[18px] text-slate-500 dark:text-slate-400" />
                {userType === 'investor' ? 'Startup shortlist' : 'Pitch ideas & MVP showcase'}
              </h2>
              {userType !== 'investor' && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{pitchPosts.length} Posts</span>
              )}
            </div>

            {userType === 'investor' ? (
              <EmptyState
                icon={<BulbIcon className="w-6 h-6" />}
                title="Your shortlist lives on its own page"
                subtitle="Review the AI-ranked startups matched to your focus sectors and ticket size, and raise your hand on the ones you want to meet."
                action={
                  <Link
                    href="/ideas"
                    className="inline-block px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                  >
                    View Shortlist
                  </Link>
                }
                className="h-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
              />
            ) : pitchPosts.length === 0 ? (
              <EmptyState
                icon={<BulbIcon className="w-6 h-6" />}
                title="No pitch posts yet"
                subtitle="Publish your startup pitch or MVP URL to show progress on your profile wall feed."
                action={
                  <Link
                    href="/ideas"
                    className="inline-block px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                  >
                    Post Your First Idea
                  </Link>
                }
                className="h-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
              />
            ) : (
              <div className="space-y-4">
                {pitchPosts.map((post) => (
                  <div key={post.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{user?.user_metadata?.full_name || 'Founder'}</h4>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400">
                            Published on {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {post.mvp_url && <InfoPill tone="emerald" dot>Verified MVP link</InfoPill>}
                    </div>

                    <h3 className="text-title text-slate-900 dark:text-slate-100">{post.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {post.pitch_text}
                    </p>

                    {post.mvp_url && (
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <ArrowUpRightIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Working MVP prototype
                        </div>
                        <a
                          href={safeHref(post.mvp_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Launch prototype
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AI Stats & Sidebar */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-meta text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <RobotIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Agentic AI verification
            </h3>
            {hasGithubData || founderData.linkedin_verified ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-300 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5"><CheckCircleIcon className="w-4 h-4" /> Verified agent node</span>
                <p>
                  {[
                    hasGithubData && 'GitHub REST API metrics',
                    founderData.linkedin_verified && 'LinkedIn sign-in identity',
                  ].filter(Boolean).join(' and ')} confirmed real.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs space-y-1">
                <span className="font-bold block">Not verified yet</span>
                <p>
                  {userType === 'investor'
                    ? 'Sign in with LinkedIn to unlock verified data here.'
                    : 'Connect GitHub or sign in with LinkedIn to unlock verified data here.'}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-meta text-slate-800 dark:text-slate-100 uppercase tracking-wider">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link href="/matches" className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2"><HandshakeIcon className="w-[18px] h-[18px] text-slate-400 dark:text-slate-400" /> View matches</span><ArrowRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              </Link>
              <Link href="/dashboard" className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2"><HomeIcon className="w-[18px] h-[18px] text-slate-400 dark:text-slate-400" /> Control center</span><ArrowRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              </Link>
              <Link href="/ideas" className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2"><BulbIcon className="w-[18px] h-[18px] text-blue-500 dark:text-blue-400" /> {userType === 'investor' ? 'Startup shortlist' : 'My ideas'}</span><ArrowRightIcon className="w-4 h-4 text-blue-300 dark:text-blue-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
