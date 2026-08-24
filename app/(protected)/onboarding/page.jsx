'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext.jsx'
import Field from '../../../components/Field.jsx'
import Notice from '../../../components/Notice.jsx'
import AuthSidePanel from '../../../components/AuthSidePanel.jsx'
import { Logo, SpinnerIcon, LinkedInMark, GitHubMark, CheckIcon, RocketIcon, BriefcaseIcon, CodeIcon } from '../../../components/icons.jsx'
import { validateLinkedInUrl, validateGitHubUrl } from '../../../lib/validation.js'
import { CURRENCIES, toUsd } from '../../../lib/currency.js'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

const FOUNDER_STEP_LABELS = ['LinkedIn', 'GitHub']
const INVESTOR_STEP_LABELS = ['Profile', 'Criteria']
const LOADING_STAGES = [
  'Reading your LinkedIn profile…',
  'Reading your GitHub activity…',
  'Agent is building your profile…',
  'Preparing your workspace…',
]

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/api\/?$/, '')

function OnboardingInner() {
  const { user, accessToken, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [role, setRole] = useState(null) // 'founder' | 'investor'
  const [step, setStep] = useState(1)
  const [checkingExisting, setCheckingExisting] = useState(true)

  // Pre-select role from user metadata (set during signup)
  useEffect(() => {
    if (user?.user_metadata?.user_type && role === null) {
      setRole(user.user_metadata.user_type)
    }
  }, [user, role])

  // Already connected LinkedIn/GitHub in a past session (durable, survives a
  // backend restart) — skip straight past this form instead of asking again.
  useEffect(() => {
    let cancelled = false
    async function checkAlreadyOnboarded() {
      if (!accessToken) {
        setCheckingExisting(false)
        return
      }
      try {
        const res = await fetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data.onboarded) {
          router.replace('/dashboard')
          return
        }
      } catch (err) {
        // fall through to showing the form — worst case they fill it in again
      }
      if (!cancelled) setCheckingExisting(false)
    }
    checkAlreadyOnboarded()
    return () => { cancelled = true }
  }, [accessToken, router])

  // Common inputs
  const [linkedin, setLinkedin] = useState('')
  const [additional, setAdditional] = useState('')
  const [linkedinBioText, setLinkedinBioText] = useState('')

  // Real LinkedIn OAuth identity (set only once LinkedIn itself confirms it)
  const [linkedinVerifiedName, setLinkedinVerifiedName] = useState('')
  const [linkedinConnecting, setLinkedinConnecting] = useState(false)
  const [linkedinOAuthError, setLinkedinOAuthError] = useState('')

  // Location — used by the location-search page (Country/City/District exact
  // filter + H3-based "nearby" radius search). Optional: search just won't
  // surface someone who leaves it blank.
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')

  // Founder inputs
  const [github, setGithub] = useState('')
  const [githubSearchOpen, setGithubSearchOpen] = useState(false)
  const [githubSearchName, setGithubSearchName] = useState('')
  const [githubSearching, setGithubSearching] = useState(false)
  const [githubCandidates, setGithubCandidates] = useState([])
  const [githubSearchError, setGithubSearchError] = useState('')
  const [githubNameHint, setGithubNameHint] = useState('')

  // Investor inputs
  const [firm, setFirm] = useState('')
  const [designation, setDesignation] = useState('')
  const [focusSectors, setFocusSectors] = useState('')
  const [minTicket, setMinTicket] = useState(100000)
  const [ticketCurrency, setTicketCurrency] = useState('USD')
  const [maxTicket, setMaxTicket] = useState(1000000)

  // Status states
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [linkedinError, setLinkedinError] = useState('')
  const [githubError, setGithubError] = useState('')
  const [loadingStage, setLoadingStage] = useState(0)

  const isGithubStep = role === 'founder' && step === 2

  // Pick up the redirect back from /api/linkedin/callback (?linkedin=connected&name=...)
  useEffect(() => {
    const linkedinStatus = searchParams.get('linkedin')
    if (!linkedinStatus) return

    if (linkedinStatus === 'connected') {
      setLinkedinVerifiedName(searchParams.get('name') || 'LinkedIn account')
      setLinkedinOAuthError('')
      // LinkedIn Connect is used by both roles, not just founders — this
      // used to hardcode a 'founder' fallback here, which won a race against
      // the user_metadata-restore effect above whenever `user` hadn't
      // finished loading yet on this fresh post-redirect mount (the LinkedIn
      // redirect is a real page reload, not client-side routing, so `role`
      // starts back at null every time). That silently flipped investors
      // over to the founder flow (and its GitHub step) right after they
      // verified LinkedIn. Falling back to the metadata's real user_type
      // instead — and to nothing at all if that hasn't loaded yet either —
      // lets the effect above correctly set it once `user` is ready.
      setRole((r) => r || user?.user_metadata?.user_type || r)
    } else if (linkedinStatus === 'error') {
      const reason = searchParams.get('reason')
      // Not shown to the user (the message below stays generic/friendly) —
      // but printed so the failure mode is visible in the browser console
      // without needing to catch the backend terminal at the right moment.
      if (reason) console.error(`LinkedIn OAuth failed: ${reason}`)
      setLinkedinOAuthError('LinkedIn sign-in did not complete. You can still paste your profile URL/bio below.')
    }

    const next = new URLSearchParams(searchParams.toString())
    next.delete('linkedin')
    next.delete('name')
    next.delete('reason')
    router.replace(next.toString() ? `${pathname}?${next}` : pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function connectLinkedIn() {
    setLinkedinOAuthError('')
    setLinkedinConnecting(true)
    try {
      const res = await fetch(`${API_BASE}/api/linkedin/login`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'LinkedIn sign-in is unavailable right now.')
      window.location.href = data.authorize_url
    } catch (err) {
      setLinkedinOAuthError(err.message)
      setLinkedinConnecting(false)
    }
  }

  async function searchGithubByName() {
    setGithubSearchError('')
    if (!githubSearchName.trim()) {
      setGithubSearchError('Type a real name to search.')
      return
    }
    setGithubSearching(true)
    setGithubCandidates([])
    try {
      const res = await fetch(`${API_BASE}/api/github/search?name=${encodeURIComponent(githubSearchName.trim())}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'GitHub search failed.')
      if (!data.candidates || data.candidates.length === 0) {
        setGithubSearchError('No real GitHub accounts matched that name. Try a different spelling, or paste your profile URL instead.')
      }
      setGithubCandidates(data.candidates || [])
    } catch (err) {
      setGithubSearchError(err.message)
    } finally {
      setGithubSearching(false)
    }
  }

  function pickGithubCandidate(candidate) {
    setGithub(candidate.profile_url)
    setGithubNameHint(githubSearchName.trim())
    setGithubError('')
    setGithubSearchOpen(false)
    setGithubCandidates([])
  }

  // Cycle through the loading checklist while the final submit is in flight —
  // the backend does the work in one request, so this just gives the user
  // something concrete to watch instead of a bare spinner.
  useEffect(() => {
    if (!submitting) {
      setLoadingStage(0)
      return
    }
    const id = setInterval(() => {
      setLoadingStage((s) => Math.min(s + 1, LOADING_STAGES.length - 1))
    }, 900)
    return () => clearInterval(id)
  }, [submitting])

  function goToLinkedInStep() {
    // OAuth-verified identity already satisfies this step even with no typed
    // URL or pasted bio — real, verified data from LinkedIn itself already
    // covers what the manual fallback below exists to provide.
    if (linkedinVerifiedName) {
      setStep(2)
      return
    }
    const err = validateLinkedInUrl(linkedin)
    setLinkedinError(err)
    if (err) return
    // A profile URL alone can't actually be read (LinkedIn blocks scraping)
    // — without the pasted bio text too, Agent 2 has nothing real to analyze.
    if (!linkedinBioText.trim()) {
      setFormError('Paste your real LinkedIn About/Experience text below, or sign in with LinkedIn above — a URL alone can\'t be read.')
      return
    }
    setFormError('')
    setStep(2)
  }

  // A handful of real profile submissions have gone on to actually succeed
  // server-side (Postgres write + session save) even after this request came
  // back with an error response — the one thing in that request capable of
  // throwing before those saves run is Agent 2's Groq call, and it's been
  // transiently rate-limited during heavy same-key testing. Before showing a
  // scary "failed" error for something that may have actually gone through a
  // moment later, double-check with the server itself rather than trusting
  // this one response alone.
  async function reallyDidFail() {
    try {
      const res = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) return true
      const data = await res.json()
      return !data.onboarded
    } catch {
      return true
    }
  }

  async function handleFounderSubmit(e) {
    if (e) e.preventDefault()
    setFormError('')

    if (!linkedinVerifiedName) {
      const linkErr = validateLinkedInUrl(linkedin)
      if (linkErr) {
        setLinkedinError(linkErr)
        setStep(1)
        return
      }
      if (!linkedinBioText.trim()) {
        setFormError('Paste your real LinkedIn About/Experience text, or sign in with LinkedIn — a URL alone can\'t be read.')
        setStep(1)
        return
      }
    }
    const ghErr = validateGitHubUrl(github)
    if (ghErr) {
      setGithubError(ghErr)
      setStep(2)
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('linkedin', linkedin.trim())
      formData.append('github', github.trim())
      formData.append('additional', additional.trim())
      formData.append('linkedin_bio_text', linkedinBioText.trim())
      formData.append('github_name_hint', githubNameHint.trim())
      formData.append('country', country.trim())
      formData.append('city', city.trim())
      formData.append('district', district.trim())

      const res = await fetch(`${API_URL}/founder/profile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (!(await reallyDidFail())) {
          router.push('/ideas')
          return
        }
        throw new Error(data.detail || 'Failed to submit founder profile.')
      }

      // No idea collected here anymore — head to the ideas hub to post one.
      router.push('/ideas')
    } catch (err) {
      setFormError(err.message)
      setSubmitting(false)
    }
  }

  async function handleInvestorSubmit(e) {
    e.preventDefault()
    setFormError('')

    // A verified LinkedIn sign-in already satisfies this step, same as the
    // founder flow — the URL field alone was never a real data source (see
    // the note on the field itself), so it shouldn't gate submission once
    // OAuth has actually confirmed a real identity.
    if (!linkedinVerifiedName && !linkedin.trim()) {
      setFormError('LinkedIn Profile URL is required (or sign in with LinkedIn above).')
      return
    }
    if (!linkedinVerifiedName && !linkedinBioText.trim()) {
      setFormError('Paste your real LinkedIn About/Experience text, or sign in with LinkedIn — a URL alone can\'t be read.')
      return
    }
    if (!firm.trim()) {
      setFormError('Firm Name is required.')
      return
    }
    if (!designation.trim()) {
      setFormError('Your designation/title is required.')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('linkedin', linkedin.trim())
      formData.append('firm', firm.trim())
      formData.append('designation', designation.trim())
      formData.append('focus_sectors', focusSectors.trim())
      formData.append('min_ticket', String(toUsd(minTicket, ticketCurrency)))
      formData.append('max_ticket', String(toUsd(maxTicket, ticketCurrency)))
      formData.append('ticket_currency', ticketCurrency)
      formData.append('additional', additional.trim())
      formData.append('linkedin_bio_text', linkedinBioText.trim())
      formData.append('country', country.trim())
      formData.append('city', city.trim())
      formData.append('district', district.trim())

      const res = await fetch(`${API_URL}/investor/profile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (!(await reallyDidFail())) {
          router.push('/matches')
          return
        }
        throw new Error(data.detail || 'Failed to submit investor profile.')
      }

      router.push('/matches')
    } catch (err) {
      setFormError(err.message)
      setSubmitting(false)
    }
  }

  const stepLabels = role === 'investor' ? INVESTOR_STEP_LABELS : FOUNDER_STEP_LABELS
  const totalSteps = 2

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-cream dark:bg-slate-950 flex flex-col items-center justify-center">
        <SpinnerIcon className="w-8 h-8 text-brand" />
        <p className="mt-3 text-sm font-semibold text-muted dark:text-slate-400">Checking your account...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      {/* Top bar — a neutral strip above the split, never needs a dark variant
          since the GitHub step's dark theme only applies to the right pane below. */}
      <header className="shrink-0 relative z-10 border-b border-[#EFE9DF]/70 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="px-5 md:px-7 py-4 flex items-center justify-between">
          <Logo />
          <button
            onClick={signOut}
            className="h-9 px-4 rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] font-semibold dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      {/* LEFT — the exact same full-bleed brand panel as Login/Signup (not a
          separate lookalike component) so this can never visually drift from
          them again. RIGHT — form fills the entire remaining half directly,
          no floating card, matching AuthSidePanel's sibling on Login/Signup. */}
      <div className="flex-1 lg:flex">
        <div className="hidden lg:block lg:w-1/2">
          <AuthSidePanel />
        </div>

        <div
          className={`w-full lg:w-1/2 flex flex-col items-center justify-center px-6 sm:px-12 xl:px-20 py-10 transition-colors duration-300 ${
            isGithubStep ? 'bg-[#0D1117] text-white' : 'bg-white dark:bg-slate-950 text-ink dark:text-slate-100'
          }`}
        >
          <div className="w-full max-w-[480px]">
            {formError && (
              <Notice tone="error" className="mb-5">
                {formError}
              </Notice>
            )}

            {/* Role Selection Screen */}
            {role === null && (
              <div className="flex flex-col items-center text-center py-4">
                <h1 className="text-page text-ink dark:text-slate-100 tracking-tight">Complete your profile</h1>
                <p className="mt-2 text-[14px] text-muted dark:text-slate-400 max-w-[420px]">
                  Choose your role to get started. We analyze your real profiles — nothing invented.
                </p>

                <div className="mt-8 w-full grid sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('founder')}
                    className="flex flex-col items-center p-7 text-center rounded-[20px] border border-line dark:border-slate-700 hover:border-brand bg-white dark:bg-slate-900 hover:bg-brand/5 dark:hover:bg-brand/10 transition-all text-ink dark:text-slate-100 hover-lift"
                  >
                    <span className="grid place-items-center w-14 h-14 rounded-2xl bg-brand/10 text-brand mb-3"><CodeIcon className="w-7 h-7" /></span>
                    <span className="text-[16px] font-bold">I'm a Founder</span>
                    <span className="mt-1.5 text-[12.5px] text-muted dark:text-slate-400 leading-relaxed">
                      Verify your real profile, then post your ideas and match with the right investor.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('investor')}
                    className="flex flex-col items-center p-7 text-center rounded-[20px] border border-line dark:border-slate-700 hover:border-brand bg-white dark:bg-slate-900 hover:bg-brand/5 dark:hover:bg-brand/10 transition-all text-ink dark:text-slate-100 hover-lift"
                  >
                    <span className="grid place-items-center w-14 h-14 rounded-2xl bg-brand/10 text-brand mb-3"><BriefcaseIcon className="w-7 h-7" /></span>
                    <span className="text-[16px] font-bold">I'm an Investor</span>
                    <span className="mt-1.5 text-[12.5px] text-muted dark:text-slate-400 leading-relaxed">
                      Get matched exclusively with one verified, MVP-ready startup at a time.
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Founder Form */}
            {role === 'founder' && (
              <form onSubmit={handleFounderSubmit}>
                {/* Step Indicators */}
                {!(step === 2 && submitting) && (
                  <div className="mb-7">
                    <div className="flex items-center gap-2" aria-hidden="true">
                      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                        <div
                          key={s}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            s <= step ? (isGithubStep ? 'bg-[#2DA44E]' : 'bg-brand') : isGithubStep ? 'bg-white/15' : 'bg-line dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <div className={`mt-1.5 flex justify-between text-[10.5px] font-semibold uppercase tracking-wide ${isGithubStep ? 'text-white/40' : 'text-gray-400 dark:text-slate-500'}`}>
                      {stepLabels.map((label, i) => (
                        <span key={label} className={i + 1 === step ? (isGithubStep ? 'text-[#2DA44E]' : 'text-brand') : ''}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 1: LinkedIn */}
                {step === 1 && (
                  <div
                    className="space-y-4"
                    onKeyDown={(e) => {
                      // The LinkedIn URL field is the only single-line text
                      // input on this step, so pressing Enter in it triggers
                      // the form's native implicit submission (handleFounderSubmit)
                      // instead of advancing via goToLinkedInStep — that runs
                      // GitHub validation against a still-empty `github` and
                      // dumps the user onto Step 2 with a confusing "required"
                      // error before they've touched that field. Route Enter
                      // through the same Continue action instead.
                      if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                        e.preventDefault()
                        goToLinkedInStep()
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <LinkedInMark className="w-11 h-11 shrink-0" />
                      <div>
                        <h2 className="text-title text-ink dark:text-slate-100">Connect your LinkedIn</h2>
                        <p className="text-[12.5px] text-muted dark:text-slate-400">Step 1 of {totalSteps} — verified directly by LinkedIn, not guessed.</p>
                      </div>
                    </div>

                    {linkedinOAuthError && (
                      <Notice tone="error">{linkedinOAuthError}</Notice>
                    )}

                    {linkedinVerifiedName ? (
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-2.5 text-[13px] font-semibold text-emerald-800 dark:text-emerald-400">
                        <CheckIcon className="w-4 h-4 shrink-0" />
                        Signed in with LinkedIn as {linkedinVerifiedName}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={connectLinkedIn}
                        disabled={linkedinConnecting}
                        className="w-full h-[44px] rounded-lg text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 transition-colors"
                        style={{ backgroundColor: '#0A66C2' }}
                      >
                        {linkedinConnecting && <SpinnerIcon />}
                        {linkedinConnecting ? 'Redirecting to LinkedIn…' : 'Sign in with LinkedIn (real, verified)'}
                      </button>
                    )}

                    <div className="relative flex items-center py-1">
                      <div className="flex-1 border-t border-line dark:border-slate-700" />
                      <span className="px-3 text-[11px] font-semibold uppercase text-gray-400 dark:text-slate-500">or add manually</span>
                      <div className="flex-1 border-t border-line dark:border-slate-700" />
                    </div>

                    <Field
                      id="f-linkedin"
                      label="LinkedIn Profile URL (optional if signed in above)"
                      type="url"
                      placeholder="https://linkedin.com/in/yourname"
                      value={linkedin}
                      onChange={(v) => {
                        setLinkedin(v)
                        if (linkedinError) setLinkedinError('')
                      }}
                      error={linkedinError}
                    />
                    <p className="text-[11.5px] text-muted dark:text-slate-400 -mt-2">
                      A profile URL alone can't be read — LinkedIn doesn't allow scraping. Sign in above, or
                      paste your real About/Experience text below, for anything to actually be analyzed.
                    </p>

                    <div>
                      <label htmlFor="f-linkedin-bio" className="block text-[12.5px] font-semibold text-ink dark:text-slate-300 mb-1">
                        Paste your real LinkedIn About / Experience text{linkedinVerifiedName ? ' (optional if signed in above)' : ''}
                      </label>
                      <textarea
                        id="f-linkedin-bio"
                        rows={4}
                        className="w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13.5px] text-ink dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all resize-y"
                        placeholder="Copy-paste your actual About section here — the agent only extracts facts from real text you provide, it never invents your history."
                        value={linkedinBioText}
                        onChange={(e) => {
                          setLinkedinBioText(e.target.value)
                          if (formError) setFormError('')
                        }}
                      />
                    </div>

                    <div className="pt-2 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setRole(null)}
                        className="px-5 h-[38px] rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] font-semibold text-ink dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        Change Role
                      </button>
                      <button
                        type="button"
                        onClick={goToLinkedInStep}
                        className="px-6 h-[38px] rounded-lg text-white text-[13px] font-semibold transition-colors"
                        style={{ backgroundColor: '#0A66C2' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#004182')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0A66C2')}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: GitHub */}
                {step === 2 && !submitting && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <GitHubMark className="w-11 h-11 shrink-0 rounded-md bg-[#161B22] p-1.5" />
                      <div>
                        <h2 className="text-title text-white">Connect your GitHub</h2>
                        <p className="text-[12.5px] text-white/50">Step 2 of {totalSteps} — we scan your repos to build your skills profile.</p>
                      </div>
                    </div>

                    <Field
                      id="f-github"
                      label="GitHub Profile URL"
                      type="url"
                      placeholder="https://github.com/yourname"
                      value={github}
                      onChange={(v) => {
                        setGithub(v)
                        if (githubError) setGithubError('')
                      }}
                      error={githubError}
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setGithubSearchOpen((v) => !v)}
                      className="text-[12.5px] font-semibold text-[#2DA44E] hover:underline"
                    >
                      {githubSearchOpen ? 'Hide name search' : "Don't know your GitHub URL? Search by name"}
                    </button>

                    {githubSearchOpen && (
                      <div className="rounded-lg border border-[#30363D] bg-[#161B22] p-3 space-y-2.5">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Your real full name"
                            value={githubSearchName}
                            onChange={(e) => setGithubSearchName(e.target.value)}
                            className="flex-1 rounded-md border border-[#30363D] bg-[#0D1117] px-2.5 py-1.5 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-[#2DA44E]"
                          />
                          <button
                            type="button"
                            onClick={searchGithubByName}
                            disabled={githubSearching}
                            className="px-3.5 h-[34px] rounded-md bg-[#2DA44E] hover:bg-[#2C974B] text-white text-[12.5px] font-semibold flex items-center gap-1.5 shrink-0"
                          >
                            {githubSearching && <SpinnerIcon className="w-3.5 h-3.5" />}
                            Search
                          </button>
                        </div>
                        {githubSearchError && <p className="text-[12px] text-red-400">{githubSearchError}</p>}
                        {githubCandidates.length > 0 && (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {githubCandidates.map((c) => (
                              <button
                                type="button"
                                key={c.username}
                                onClick={() => pickGithubCandidate(c)}
                                className="w-full flex items-center gap-2.5 p-2 rounded-md bg-[#0D1117] border border-[#30363D] hover:border-[#2DA44E] text-left transition-colors"
                              >
                                <img src={c.avatar_url} alt="" className="w-7 h-7 rounded-full shrink-0" />
                                <span className="text-[12.5px] font-semibold text-white truncate">{c.username}</span>
                                <span className="ml-auto text-[10px] text-white/40 shrink-0">real GitHub account</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label htmlFor="f-additional" className="block text-[12.5px] font-semibold text-white/80 mb-1">
                        Additional Bio / Background (optional)
                      </label>
                      <textarea
                        id="f-additional"
                        rows={3}
                        className="w-full rounded-lg border border-[#30363D] bg-[#161B22] px-3 py-2 text-[13.5px] text-white placeholder:text-white/30 outline-none focus:border-[#2DA44E] focus:ring-4 focus:ring-[#2DA44E]/15 transition-all resize-y"
                        placeholder="Share your domain expertise, tech stack, or previous startup ventures..."
                        value={additional}
                        onChange={(e) => setAdditional(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[12.5px] font-semibold text-white/80 mb-1">
                        Location (optional — powers location-based search for investors)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full rounded-lg border border-[#30363D] bg-[#161B22] px-3 py-2 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-[#2DA44E] focus:ring-4 focus:ring-[#2DA44E]/15 transition-all"
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full rounded-lg border border-[#30363D] bg-[#161B22] px-3 py-2 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-[#2DA44E] focus:ring-4 focus:ring-[#2DA44E]/15 transition-all"
                        />
                        <input
                          type="text"
                          placeholder="District"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full rounded-lg border border-[#30363D] bg-[#161B22] px-3 py-2 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-[#2DA44E] focus:ring-4 focus:ring-[#2DA44E]/15 transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        disabled={submitting}
                        className="px-5 h-[38px] rounded-lg border border-[#30363D] bg-[#21262D] text-[13px] font-semibold text-white hover:bg-[#30363D] disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 h-[38px] rounded-lg bg-[#2DA44E] hover:bg-[#2C974B] text-white text-btn flex items-center gap-2"
                      >
                        {submitting && <SpinnerIcon />}
                        {submitting ? 'Building profile…' : 'Complete & post your idea'}
                      </button>
                    </div>
                  </div>
                )}

                {submitting && (
                  <div className="py-6 flex flex-col items-center text-center">
                    <div className="relative w-14 h-14 mb-5">
                      <SpinnerIcon className="w-14 h-14 text-brand" />
                    </div>
                    <h3 className="text-title text-ink mb-1">Building your profile</h3>
                    <p className="text-[12.5px] text-muted mb-6">Analyzing LinkedIn & GitHub metadata...</p>

                    <ul className="w-full max-w-[320px] space-y-2.5 text-left">
                      {LOADING_STAGES.map((stage, i) => {
                        const done = i < loadingStage
                        const active = i === loadingStage
                        return (
                          <li key={stage} className="flex items-center gap-2.5 text-[13px]">
                            <span
                              className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                                done ? 'bg-brand text-white' : active ? 'bg-brand-soft text-brand' : 'bg-gray-100 text-gray-300'
                              }`}
                            >
                              {done ? <CheckIcon className="w-3 h-3" /> : active ? <SpinnerIcon className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </span>
                            <span className={done || active ? 'text-ink font-medium' : 'text-gray-400'}>{stage}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </form>
            )}

            {/* Investor Form */}
            {role === 'investor' && (
              <form onSubmit={handleInvestorSubmit}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-line dark:border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-brand-soft text-brand flex items-center justify-center font-bold text-[18px]">
                    <BriefcaseIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-title text-ink dark:text-slate-100">Investor Onboarding</h2>
                    <p className="text-[12.5px] text-muted dark:text-slate-400">Step {step} of {totalSteps}</p>
                  </div>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center gap-2 mb-6" aria-hidden="true">
                  {[1, 2].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 flex-1 rounded-full ${
                        s <= step ? 'bg-brand' : 'bg-line dark:bg-slate-700'
                      } transition-colors`}
                    />
                  ))}
                </div>

                {/* Step 1: Firm/Role/LinkedIn */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-meta text-ink dark:text-slate-100 uppercase tracking-wider mb-2">Step 1 — Professional Bio</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field
                        id="i-firm"
                        label="Firm Name"
                        placeholder="e.g. Accel Partners"
                        value={firm}
                        onChange={setFirm}
                        required
                      />
                      <Field
                        id="i-designation"
                        label="Title / Designation"
                        placeholder="e.g. Partner"
                        value={designation}
                        onChange={setDesignation}
                        required
                      />
                    </div>

                    {linkedinOAuthError && (
                      <Notice tone="error">{linkedinOAuthError}</Notice>
                    )}

                    {linkedinVerifiedName ? (
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-2.5 text-[13px] font-semibold text-emerald-800 dark:text-emerald-400">
                        <CheckIcon className="w-4 h-4 shrink-0" />
                        Signed in with LinkedIn as {linkedinVerifiedName}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={connectLinkedIn}
                        disabled={linkedinConnecting}
                        className="w-full h-[44px] rounded-lg text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 transition-colors"
                        style={{ backgroundColor: '#0A66C2' }}
                      >
                        {linkedinConnecting && <SpinnerIcon />}
                        {linkedinConnecting ? 'Redirecting to LinkedIn…' : 'Sign in with LinkedIn (real, verified)'}
                      </button>
                    )}

                    <div className="relative flex items-center py-1">
                      <div className="flex-1 border-t border-line dark:border-slate-700" />
                      <span className="px-3 text-[11px] font-semibold uppercase text-gray-400 dark:text-slate-500">or add manually</span>
                      <div className="flex-1 border-t border-line dark:border-slate-700" />
                    </div>

                    <Field
                      id="i-linkedin"
                      label={`LinkedIn Profile URL${linkedinVerifiedName ? ' (optional if signed in above)' : ''}`}
                      type="url"
                      placeholder="https://linkedin.com/in/yourname"
                      value={linkedin}
                      onChange={setLinkedin}
                      required={!linkedinVerifiedName}
                    />
                    <p className="text-[11.5px] text-muted dark:text-slate-400 -mt-2">
                      A profile URL alone can't be read — LinkedIn doesn't allow scraping. Sign in above, or
                      paste your real About/Experience text below, for anything to actually be analyzed.
                    </p>

                    <div>
                      <label htmlFor="i-bio" className="field-label">
                        Paste your real LinkedIn About / Experience text{linkedinVerifiedName ? ' (optional if signed in above)' : ''}
                      </label>
                      <textarea
                        id="i-bio"
                        rows={3}
                        className="w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13.5px] text-ink dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all resize-y"
                        placeholder="Copy-paste your actual About section here — the agent only extracts facts from real text you provide, it never invents your history."
                        value={linkedinBioText}
                        onChange={(e) => {
                          setLinkedinBioText(e.target.value)
                          if (formError) setFormError('')
                        }}
                      />
                    </div>

                    <div>
                      <label className="field-label">Location (optional — powers location-based search)</label>
                      <div className="grid grid-cols-3 gap-3">
                        <Field id="i-country" label="" placeholder="Country" value={country} onChange={setCountry} />
                        <Field id="i-city" label="" placeholder="City" value={city} onChange={setCity} />
                        <Field id="i-district" label="" placeholder="District" value={district} onChange={setDistrict} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="i-thesis" className="field-label">Investment Thesis (optional)</label>
                      <textarea
                        id="i-thesis"
                        rows={3}
                        className="w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13.5px] text-ink dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all resize-y"
                        placeholder="Describe your thesis, preferred stages, and focus areas..."
                        value={additional}
                        onChange={(e) => setAdditional(e.target.value)}
                      />
                    </div>

                    <div className="pt-4 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setRole(null)}
                        className="px-5 h-[38px] rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] font-semibold text-ink dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        Change Role
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if ((!linkedinVerifiedName && !linkedin.trim()) || !firm.trim() || !designation.trim()) {
                            setFormError('Firm, designation, and LinkedIn (URL or sign-in) are required.')
                            return
                          }
                          // A profile URL alone can't actually be read (LinkedIn
                          // blocks scraping) — without the pasted bio text too,
                          // Agent 2 has nothing real to analyze.
                          if (!linkedinVerifiedName && !linkedinBioText.trim()) {
                            setFormError('Paste your real LinkedIn About/Experience text below, or sign in with LinkedIn above — a URL alone can\'t be read.')
                            return
                          }
                          setFormError('')
                          setStep(2)
                        }}
                        className="px-6 h-[38px] rounded-lg bg-brand hover:bg-brand-hover text-white text-[13px] font-semibold"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Thesis & Sectors */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-meta text-ink dark:text-slate-100 uppercase tracking-wider mb-2">Step 2 — Criteria</h3>

                    <Field
                      id="i-sectors"
                      label="Focus Sectors (comma-separated)"
                      placeholder="e.g. AI, SaaS, FinTech, Web3"
                      value={focusSectors}
                      onChange={focusSectors => setFocusSectors(focusSectors)}
                      required
                    />

                    <div>
                      <label htmlFor="i-ticket-currency" className="field-label">Ticket Currency</label>
                      <select
                        id="i-ticket-currency"
                        className="w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 h-[38px] text-[13.5px] text-ink dark:text-slate-100 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all"
                        value={ticketCurrency}
                        onChange={(e) => setTicketCurrency(e.target.value)}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="i-min-ticket" className="field-label">Min Ticket ({ticketCurrency})</label>
                        <input
                          id="i-min-ticket"
                          type="number"
                          min={1000}
                          className="w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 h-[38px] text-[13.5px] text-ink dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all"
                          value={minTicket}
                          onChange={(e) => setMinTicket(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label htmlFor="i-max-ticket" className="field-label">Max Ticket ({ticketCurrency})</label>
                        <input
                          id="i-max-ticket"
                          type="number"
                          min={1000}
                          className="w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 h-[38px] text-[13.5px] text-ink dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all"
                          value={maxTicket}
                          onChange={(e) => setMaxTicket(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-5 h-[38px] rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] font-semibold text-ink dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800"
                        disabled={submitting}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 h-[38px] rounded-lg bg-brand hover:bg-brand-hover text-white text-btn flex items-center gap-2"
                      >
                        {submitting && <SpinnerIcon />}
                        {submitting ? 'Saving Profile…' : 'Complete & Launch'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Onboarding() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream dark:bg-slate-950 flex flex-col items-center justify-center">
        <SpinnerIcon className="w-8 h-8 text-brand" />
      </div>
    }>
      <OnboardingInner />
    </Suspense>
  )
}
