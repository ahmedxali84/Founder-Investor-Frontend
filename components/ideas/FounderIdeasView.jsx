'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../lib/supabaseClient.js'
import { uploadPitchScreenshot } from '../../lib/supabaseStorage.js'
import { isSafeHttpUrl, safeHref } from '../../lib/validation.js'
import Field from '../Field.jsx'
import Notice from '../Notice.jsx'
import InfoPill from '../InfoPill.jsx'
import EmptyState from '../EmptyState.jsx'
import { SpinnerIcon, GitHubMark, PaperclipIcon } from '../icons.jsx'
import { Skeleton } from '../Skeleton.jsx'
import { BulbIcon, RepoIcon, ArrowUpRightIcon, RocketIcon, CheckCircleIcon, TrashIcon } from '../icons.jsx'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

/**
 * Founder-facing "post an idea, then go live for matching" flow — unchanged
 * from the original IdeasPage, just extracted so the route can branch by
 * role (investors get InvestorShortlistView instead).
 */
export default function FounderIdeasView() {
  const { user, accessToken } = useAuth()
  const router = useRouter()

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // create form — just the essentials, posting an idea should be quick
  const [title, setTitle] = useState('')
  const [pitchText, setPitchText] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Dropping a PDF pre-fills pitchText via a lightweight extract-only call
  // (no LLM) — the founder can still review/edit the result before posting.
  // It's an alternative input method, not a separate data path: whatever
  // ends up in pitchText goes through the exact same flow either way.
  const [pdfFileName, setPdfFileName] = useState('')
  const [pdfExtracting, setPdfExtracting] = useState(false)
  const [pdfError, setPdfError] = useState('')

  // "Go Live" panel — MVP URL/repo/screenshot are only ever asked for here,
  // right before an idea actually needs to be verified and matched.
  const [goLiveId, setGoLiveId] = useState(null)
  const [mvpUrl, setMvpUrl] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [activatingId, setActivatingId] = useState(null)
  const [activateError, setActivateError] = useState('')

  // Delete — a plain confirm() is enough here (unlike account deletion,
  // losing one idea draft is cheap and undoable by re-posting), but we still
  // want a distinct "confirming" id so only the clicked card's button shows
  // a spinner/disables while the request is in flight.
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  // Agent 1's actual output for whichever idea is live — refined problem/
  // solution/target market, MVP must-have vs nice-to-have split, and the
  // build roadmap. Computed on every Go Live/Refresh regardless of whether
  // the idea came from typing or a dropped PDF, but was never shown anywhere
  // before this — surfaced here so that work is actually visible.
  const [ideaDetails, setIdeaDetails] = useState(null)

  async function loadPosts() {
    if (!supabase || !user?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('pitch_posts')
      .select('*')
      .eq('founder_id', user.id)
      .order('created_at', { ascending: false })
    if (!error && data) setPosts(data)
    setLoading(false)
  }

  async function loadIdeaDetails() {
    if (!accessToken) return
    try {
      const res = await fetch(`${API_URL}/founder/status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) return
      const data = await res.json().catch(() => null)
      if (data?.ready && data?.my_idea) setIdeaDetails(data.my_idea)
    } catch {
      // best-effort — the live idea's card just won't show the roadmap panel yet
    }
  }

  useEffect(() => {
    loadPosts()
    loadIdeaDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Lets handleConfirmGoLive's background poll (below) know to stop touching
  // state/navigating once this page has been left — otherwise leaving mid-poll
  // can still fire a stale navigate('/matches') or a setState-after-unmount.
  // Must reset to true when the effect (re-)runs, not just at useRef's
  // initial value — React StrictMode's dev-only mount→unmount→remount cycle
  // otherwise leaves this stuck at false forever after the very first mount,
  // silently killing every poll for the rest of the page's real lifetime.
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!title.trim() || !pitchText.trim()) {
      setErrorMsg('Title and pitch details are required.')
      return
    }

    setBusy(true)
    try {
      if (!supabase) throw new Error('Supabase client is not initialized.')

      const { error } = await supabase.from('pitch_posts').insert([
        {
          founder_id: user?.id,
          title: title.trim(),
          pitch_text: pitchText.trim(),
          is_live: false,
        },
      ])
      if (error) throw error

      setSuccessMsg('Idea posted! Click "Go Live" below when you\'re ready to match with investors.')
      setTitle('')
      setPitchText('')
      setPdfFileName('')
      setShowForm(false)
      loadPosts()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to post idea.')
    } finally {
      setBusy(false)
    }
  }

  async function handlePdfDrop(file) {
    if (!file) return
    setPdfError('')
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setPdfError('Only PDF files are supported.')
      return
    }

    setPdfExtracting(true)
    setPdfFileName(file.name)
    try {
      const body = new FormData()
      body.append('idea_pdf', file)
      const res = await fetch(`${API_URL}/founder/idea/extract-pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Failed to read PDF.')
      setPitchText(data.text || '')
    } catch (err) {
      setPdfError(err.message)
      setPdfFileName('')
    } finally {
      setPdfExtracting(false)
    }
  }

  function openGoLive(post) {
    setGoLiveId(post.id)
    setMvpUrl(post.mvp_url || '')
    setRepoUrl(post.repo_url || '')
    setScreenshotFile(null)
    setActivateError('')
  }

  // Shared by both "Go live" (first activation) and "Refresh matches" (an
  // already-live idea re-running Agent 1/4/5) — posts the idea to the
  // backend, then polls founder/status until the pipeline finishes.
  async function activateAndPoll(post, { mvpUrl, repoUrl, screenshotUrl }) {
    const res = await fetch(`${API_URL}/founder/idea/activate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        idea_text: post.pitch_text,
        mvp_url: mvpUrl,
        repo_url: repoUrl,
        screenshot_url: screenshotUrl || '',
        title: post.title || '',
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.detail || 'Failed to activate idea.')

    // Poll until Agent 1/4/5 finish, then reflect repo_verified back onto the row.
    let attempts = 0
    const poll = async () => {
      if (!isMountedRef.current) return
      attempts += 1
      try {
        // A plain fetch() has no default timeout — if the backend ever hangs
        // on a slow dependency (this is exactly what happened when
        // _hydrate_from_db blocked the event loop on a stuck Postgres
        // connection), this await would never resolve or reject, so
        // `attempts` could never advance and the 20-attempt cap below would
        // never fire — the UI would just stay on "Refreshing…" forever
        // instead of eventually erroring out. Aborting after 8s guarantees
        // this tick always completes one way or another.
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)
        let statusRes
        try {
          statusRes = await fetch(`${API_URL}/founder/status`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          })
        } finally {
          clearTimeout(timeoutId)
        }
        const statusData = statusRes.ok ? await statusRes.json() : null
        if (statusData?.ready) {
          const repoVerified = Boolean(statusData?.current_match?.idea?.founder?.repo_verified)
          await supabase.from('pitch_posts').update({ repo_verified: repoVerified }).eq('id', post.id)
          if (statusData?.my_idea && isMountedRef.current) setIdeaDetails(statusData.my_idea)
          if (isMountedRef.current) router.push('/matches')
          return
        }
      } catch (err) {
        // transient network/parse hiccup — the next poll tick will retry
      }
      if (!isMountedRef.current) return
      if (attempts < 20) setTimeout(poll, 1500)
      else {
        setActivateError('Still processing — check /matches shortly.')
        setActivatingId(null)
      }
    }
    poll()
  }

  async function handleConfirmGoLive(post) {
    setActivateError('')
    // The warning banner above only nudges toward a valid http(s) URL — it
    // never actually blocked a bad one from being saved. mvp_url/repo_url
    // get rendered as a real <a href> for investors browsing this idea, so
    // anything other than http(s) (javascript:, data:, etc.) must be
    // rejected here, not just discouraged.
    if (mvpUrl.trim() && !isSafeHttpUrl(mvpUrl.trim())) {
      setActivateError('MVP link must be a valid http:// or https:// URL.')
      return
    }
    if (repoUrl.trim() && !isSafeHttpUrl(repoUrl.trim())) {
      setActivateError('Repo link must be a valid http:// or https:// URL.')
      return
    }
    setActivatingId(post.id)
    try {
      let screenshotUrl = post.screenshot_url || null
      if (screenshotFile) {
        screenshotUrl = await uploadPitchScreenshot(screenshotFile, user.id)
      }

      // Only one idea is ever live for matching — unset any previous one.
      await supabase.from('pitch_posts').update({ is_live: false }).eq('founder_id', user.id).eq('is_live', true)
      await supabase.from('pitch_posts').update({
        is_live: true,
        mvp_url: mvpUrl.trim() || null,
        mvp_valid: Boolean(mvpUrl.trim()),
        repo_url: repoUrl.trim() || null,
        screenshot_url: screenshotUrl,
      }).eq('id', post.id)

      setGoLiveId(null)
      await activateAndPoll(post, { mvpUrl: mvpUrl.trim(), repoUrl: repoUrl.trim(), screenshotUrl })
    } catch (err) {
      setActivateError(err.message)
      setActivatingId(null)
    }
  }

  // For an idea that's already live: re-runs Agent 1/4/5 against the current
  // investor pool (e.g. a new investor joined, or one was passed on since
  // this idea last matched) without re-asking for MVP/repo details already on file.
  async function handleRefreshMatches(post) {
    setActivateError('')
    setActivatingId(post.id)
    try {
      await activateAndPoll(post, {
        mvpUrl: post.mvp_url || '',
        repoUrl: post.repo_url || '',
        screenshotUrl: post.screenshot_url || '',
      })
    } catch (err) {
      setActivateError(err.message)
      setActivatingId(null)
    }
  }

  async function handleDeleteIdea(post) {
    if (!window.confirm(`Delete "${post.title}"? This can't be undone.`)) return
    setDeleteError('')
    setDeletingId(post.id)
    try {
      if (post.is_live) {
        const res = await fetch(`${API_URL}/founder/idea/active`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.detail || 'Failed to remove idea from matching.')
        setIdeaDetails(null)
      }
      if (!supabase) throw new Error('Supabase client is not initialized.')
      const { error } = await supabase.from('pitch_posts').delete().eq('id', post.id)
      if (error) throw error
      if (goLiveId === post.id) setGoLiveId(null)
      await loadPosts()
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete idea.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-page md:text-page-lg text-slate-900 dark:text-slate-100 tracking-tight">Your Ideas</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Post as many ideas as you like — then hit "Go Live" on the one you want matched with investors.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-accent"
        >
          {showForm ? 'Cancel' : '+ Post New Idea'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-6 space-y-4 animate-card-in">
          {errorMsg && <Notice tone="error">{errorMsg}</Notice>}
          <form onSubmit={handleCreate} className="space-y-4">
            <Field id="idea-title" label="Startup / Project Title" placeholder="e.g. Next-Gen AI Customer Support" value={title} onChange={setTitle} required />

            <div>
              <label htmlFor="idea-text" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                What's the idea?
              </label>
              <textarea
                id="idea-text"
                rows={4}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 transition-all resize-y"
                placeholder="Describe the problem, the solution, and who it's for — a couple of sentences is fine, you can go live and add MVP details later."
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                required
              />
              <div className="mt-2 flex items-center gap-2">
                <label
                  htmlFor="idea-pdf"
                  className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <PaperclipIcon className="w-3.5 h-3.5" />
                  {pdfExtracting ? 'Reading PDF…' : 'Or drop a pitch PDF to fill this in'}
                </label>
                <input
                  id="idea-pdf"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={pdfExtracting}
                  onChange={(e) => handlePdfDrop(e.target.files?.[0])}
                />
                {pdfExtracting && <SpinnerIcon className="w-3.5 h-3.5 text-blue-500" />}
                {!pdfExtracting && pdfFileName && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[200px]">{pdfFileName}</span>
                )}
              </div>
              {pdfError && <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">{pdfError}</p>}
            </div>

            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={busy} className="btn-accent px-6 flex items-center gap-2">
                {busy && <SpinnerIcon />}
                {busy ? 'Posting...' : 'Post Idea'}
              </button>
            </div>
          </form>
        </div>
      )}

      {successMsg && <Notice tone="success" className="mb-4">{successMsg}</Notice>}
      {activateError && <Notice tone="error" className="mb-4">{activateError}</Notice>}
      {deleteError && <Notice tone="error" className="mb-4">{deleteError}</Notice>}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3">
              <Skeleton className="w-1/2 h-5" />
              <Skeleton className="w-full h-3" />
              <Skeleton className="w-2/3 h-3" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState icon={<BulbIcon className="w-6 h-6" />} title="No ideas posted yet" subtitle="Post your first idea above to start the matching pipeline." className="h-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm" />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-title text-slate-900 dark:text-slate-100">{post.title}</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Posted {new Date(post.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  {post.is_live && <InfoPill tone="emerald" dot>Live for matching</InfoPill>}
                  {post.repo_url && (
                    <InfoPill tone={post.repo_verified ? 'emerald' : 'slate'}>
                      <GitHubMark className="w-3 h-3 rounded-sm inline mr-1" />
                      {post.repo_verified ? 'Repo verified' : 'Repo unverified'}
                    </InfoPill>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-3">{post.pitch_text}</p>

              {safeHref(post.screenshot_url) && (
                <img src={safeHref(post.screenshot_url)} alt={`${post.title} screenshot`} className="w-full max-h-64 object-cover rounded-2xl border border-slate-100 dark:border-slate-800" />
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 text-[11px] font-semibold">
                  {safeHref(post.mvp_url) && <a href={safeHref(post.mvp_url)} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"><ArrowUpRightIcon className="w-3.5 h-3.5" /> MVP link</a>}
                  {safeHref(post.repo_url) && <a href={safeHref(post.repo_url)} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"><RepoIcon className="w-3.5 h-3.5" /> Repo</a>}
                </div>
                <div className="flex items-center gap-2">
                  {!post.is_live && goLiveId !== post.id && (
                    <button
                      onClick={() => openGoLive(post)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold transition-all"
                    >
                      Go live
                    </button>
                  )}
                  {post.is_live && goLiveId !== post.id && (
                    <button
                      onClick={() => openGoLive(post)}
                      title="Add or change the MVP link, repo link, or screenshot"
                      className="px-4 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition-all"
                    >
                      Edit details
                    </button>
                  )}
                  {post.is_live && (
                    <button
                      onClick={() => handleRefreshMatches(post)}
                      disabled={activatingId === post.id}
                      title="Re-run matching against the current investor pool"
                      className="px-4 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 disabled:opacity-50 text-blue-700 dark:text-blue-400 text-[11px] font-bold transition-all flex items-center gap-1.5"
                    >
                      {activatingId === post.id && <SpinnerIcon className="w-3 h-3" />}
                      {activatingId === post.id ? 'Refreshing…' : 'Refresh matches'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteIdea(post)}
                    disabled={deletingId === post.id}
                    title="Delete this idea"
                    className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 disabled:opacity-50 text-rose-600 dark:text-rose-400 text-[11px] font-bold transition-all flex items-center gap-1.5"
                  >
                    {deletingId === post.id ? <SpinnerIcon className="w-3 h-3" /> : <TrashIcon className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {post.is_live && ideaDetails && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <RocketIcon className="w-3.5 h-3.5 text-blue-500" /> Agent 1 — Roadmap & MVP Scope
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1.5">Must-have (MVP)</p>
                      <ul className="space-y-1">
                        {(ideaDetails.features_must_have || []).map((f, i) => (
                          <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex gap-1.5">
                            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nice-to-have</p>
                      <ul className="space-y-1">
                        {(ideaDetails.features_nice_to_have || []).map((f, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex gap-1.5">
                            <span className="text-slate-400 dark:text-slate-500">•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Build Roadmap</p>
                    <ul className="space-y-1">
                      {(ideaDetails.roadmap || []).map((step, i) => (
                        <li key={i} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {post.is_live && (!post.screenshot_url || !post.mvp_url) && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">⚠️ Lower Match Score:</span>
                  <span>Missing MVP screenshot or link reduces investor match probability. Click "Edit details" to add them.</span>
                </div>
              )}

              {goLiveId === post.id && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-card-in">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Add your MVP link and repo so investors can verify it's real — both optional, but a verified MVP is required to request meetings.
                  </p>
                  
                  {(!screenshotFile && !post.screenshot_url || !mvpUrl.trim() || !(mvpUrl.trim().startsWith('http://') || mvpUrl.trim().startsWith('https://'))) && (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                      <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <span>⚠️ Investor Matching Warning:</span>
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-700/90 dark:text-amber-300/90">
                        {(!screenshotFile && !post.screenshot_url) && (
                          <li>Screenshot/image upload na karne se aapke investor matching chances kam ho jayenge.</li>
                        )}
                        {(!mvpUrl.trim() || !(mvpUrl.trim().startsWith('http://') || mvpUrl.trim().startsWith('https://'))) && (
                          <li>Valid MVP URL (`http://` ya `https://`) match na hone par investor confidence kam hota hai.</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      type="url" placeholder="https://your-mvp-app.vercel.app"
                      value={mvpUrl} onChange={(e) => setMvpUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 h-10 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                    />
                    <input
                      type="url" placeholder="https://github.com/you/project"
                      value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 h-10 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                    />
                  </div>
                  <input
                    type="file" accept="image/*"
                    onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 dark:file:bg-blue-500/10 file:text-blue-700 dark:file:text-blue-400 file:text-xs file:font-bold"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setGoLiveId(null)} className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmGoLive(post)}
                      disabled={activatingId === post.id}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      {activatingId === post.id && <SpinnerIcon className="w-3 h-3" />}
                      {activatingId === post.id ? 'Saving…' : post.is_live ? 'Save Details' : 'Confirm & Go Live'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
