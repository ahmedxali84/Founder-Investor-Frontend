'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAgentStatus } from '../../../hooks/useAgentStatus.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import { apiFetch } from '../../../lib/apiClient.js'
import { formatTicket } from '../../../lib/format.js'
import AppShell from '../../../components/AppShell.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import InfoPill from '../../../components/InfoPill.jsx'
import { Skeleton, PageSkeleton } from '../../../components/Skeleton.jsx'
import { SearchIcon, PinIcon, BuildingIcon, SpinnerIcon, WarningIcon } from '../../../components/icons.jsx'

const PAGE_SIZE = 10

function locationLabel(loc) {
  if (!loc) return null
  const parts = [loc.district, loc.city, loc.country].filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

function ResultCard({ item, searchType }) {
  const loc = locationLabel(item.location)
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-4 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/40 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-title text-slate-900 dark:text-slate-100 truncate">
            {searchType === 'investors' ? (item.name || item.firm || 'Investor') : (item.title || 'Untitled idea')}
          </h3>
          {searchType === 'investors' ? (
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <BuildingIcon className="w-3.5 h-3.5 shrink-0" /> {item.firm || '—'}{item.designation ? ` · ${item.designation}` : ''}
            </p>
          ) : (
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{item.founder_name ? `by ${item.founder_name}` : ''}{item.domain ? ` · ${item.domain}` : ''}</p>
          )}
        </div>
        {item.distance_km !== null && item.distance_km !== undefined && (
          <InfoPill tone="blue">{item.distance_km} km</InfoPill>
        )}
      </div>

      {searchType === 'ideas' && item.problem && (
        <p className="text-[12.5px] text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-2">{item.problem}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3">
        {searchType === 'investors' && (item.focus_sectors || []).slice(0, 4).map((s) => (
          <InfoPill key={s} tone="slate">{s}</InfoPill>
        ))}
        {searchType === 'investors' && (item.min_ticket || item.max_ticket) && (
          <InfoPill tone="emerald">{formatTicket(item.min_ticket, item.max_ticket, item.ticket_currency)}</InfoPill>
        )}
        {searchType === 'ideas' && item.specialization && (
          <InfoPill tone="slate">{item.specialization}</InfoPill>
        )}
      </div>

      {loc && (
        <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-3 flex items-center gap-1">
          <PinIcon className="w-3 h-3 shrink-0" /> {loc}
        </p>
      )}

      {searchType === 'investors' && item.invested_in?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide block mb-1.5">
            Invested on
          </span>
          <div className="flex flex-wrap gap-1.5">
            {item.invested_in.map((deal, i) => (
              <InfoPill key={deal.idea_id || i} tone="emerald">{deal.title || 'A startup'}</InfoPill>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SearchPageInner() {
  const { userType, userName, userRole, avatarUrl, signOut, pollingError, profileData, statusData } = useAgentStatus()
  const { accessToken } = useAuth()

  // Role-locked, matching the backend: founders only ever see investors,
  // investors only ever see founders (via their live ideas) — there is no
  // toggle because there is nothing to toggle.
  const searchLabel = userType === 'investor' ? 'founders' : 'investors'
  const searchType = userType === 'investor' ? 'ideas' : 'investors'

  // ?q= arrives from the header search box (Cmd/Ctrl+K → type → Enter).
  const searchParams = useSearchParams()
  const [keyword, setKeyword] = useState(searchParams.get('q') || '')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [near, setNear] = useState('')

  // Country/City/District here match onboarding's cascading selects exactly
  // (see app/(protected)/onboarding/page.jsx) — "City" holds a real
  // province/state name and "District" holds a real city name, sourced from
  // the same /api/geo/* route handlers. countryIso/stateIso are just this
  // cascade's own working state, never sent to /search.
  const [countryIso, setCountryIso] = useState('')
  const [stateIso, setStateIso] = useState('')
  const [countryOptions, setCountryOptions] = useState([])
  const [stateOptions, setStateOptions] = useState([])
  const [cityOptions, setCityOptions] = useState([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const loadingMoreRef = useRef(false) // avoids the observer double-firing while a page is already in flight

  const buildParams = useCallback((nextOffset) => {
    const params = new URLSearchParams({ offset: String(nextOffset), limit: String(PAGE_SIZE) })
    if (keyword.trim()) params.set('q', keyword.trim())
    if (country.trim()) params.set('country', country.trim())
    if (city.trim()) params.set('city', city.trim())
    if (district.trim()) params.set('district', district.trim())
    if (near.trim()) params.set('near', near.trim())
    return params
  }, [keyword, country, city, district, near])

  // Shared by the initial search and every "load more" tick — same request
  // shape, same auth header, same JSON/error handling (via apiFetch).
  const fetchPage = useCallback(
    (nextOffset) => apiFetch(`/search?${buildParams(nextOffset).toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    [accessToken, buildParams],
  )

  async function runSearch(e) {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await fetchPage(0)
      setResults(data.results || [])
      setTotal(data.total ?? 0)
      setHasMore(Boolean(data.has_more))
      setOffset(data.results?.length || 0)
    } catch (err) {
      setError(err.message)
      setResults([])
      setHasMore(false)
    } finally {
      setLoading(false)
      setHasSearched(true)
    }
  }

  // Kept in a ref (always pointing at the latest closure) so the
  // IntersectionObserver below can be created once on mount instead of being
  // torn down and recreated on every single "load more" tick.
  const loadMoreRef = useRef(async () => {})
  loadMoreRef.current = async () => {
    if (loadingMoreRef.current || !hasMore) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const data = await fetchPage(offset)
      setResults((prev) => [...prev, ...(data.results || [])])
      setHasMore(Boolean(data.has_more))
      setOffset((prev) => prev + (data.results?.length || 0))
    } catch {
      // a failed "load more" tick just stops there — the results already on
      // screen stay valid, no need to surface a page-wide error for it
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }

  // Auto-run once on mount so "everyone, closest first" is the default view
  // — no filters required to see results.
  useEffect(() => {
    runSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Infinite scroll: load the next 10 as soon as the sentinel at the bottom
  // of the results list scrolls into view. The sentinel <div> only exists
  // once there are results, so a mount-only effect would run before it's in
  // the DOM and never attach — a callback ref fires exactly when the node
  // itself mounts/unmounts instead, and always calls the latest loadMore via
  // the ref above (so it doesn't need to be recreated on every scroll tick).
  const observerRef = useRef(null)
  const sentinelCallbackRef = useCallback((node) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (!node) return
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreRef.current()
      },
      { rootMargin: '200px' },
    )
    observerRef.current.observe(node)
  }, [])

  useEffect(() => {
    fetch('/api/geo/countries')
      .then((r) => r.json())
      .then(setCountryOptions)
      .catch(() => setCountryOptions([]))
  }, [])

  useEffect(() => {
    if (!countryIso) {
      setStateOptions([])
      return
    }
    setLoadingStates(true)
    fetch(`/api/geo/states?country=${countryIso}`)
      .then((r) => r.json())
      .then(setStateOptions)
      .catch(() => setStateOptions([]))
      .finally(() => setLoadingStates(false))
  }, [countryIso])

  useEffect(() => {
    if (!countryIso || !stateIso) {
      setCityOptions([])
      return
    }
    setLoadingCities(true)
    fetch(`/api/geo/cities?country=${countryIso}&state=${stateIso}`)
      .then((r) => r.json())
      .then(setCityOptions)
      .catch(() => setCityOptions([]))
      .finally(() => setLoadingCities(false))
  }, [countryIso, stateIso])

  function handleCountryChange(iso) {
    setCountryIso(iso)
    setCountry(countryOptions.find((c) => c.isoCode === iso)?.name || '')
    setStateIso('')
    setCity('')
    setDistrict('')
  }

  function handleStateChange(iso) {
    setStateIso(iso)
    setCity(stateOptions.find((s) => s.isoCode === iso)?.name || '')
    setDistrict('')
  }

  function clearFilters() {
    setKeyword('')
    setCountry('')
    setCity('')
    setDistrict('')
    setNear('')
    setCountryIso('')
    setStateIso('')
  }

  return (
    <AppShell active="search" userType={userType} userName={userName} userRole={userRole} avatarUrl={avatarUrl} onSignOut={signOut} notice={pollingError} profileData={profileData} statusData={statusData}>
      <div className="mb-6">
        <h1 className="text-page md:text-page-lg text-slate-900 dark:text-slate-100 tracking-tight">Location Search</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
          Every {searchLabel} on Kavan, closest to you first.
        </p>
      </div>

      <form onSubmit={runSearch} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-5 mb-6 space-y-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-400 mb-2 block">Keyword (optional)</span>
          <input type="text" placeholder={searchType === 'investors' ? 'Name, firm, sector…' : 'Idea title, skill, specialization…'} value={keyword} onChange={(e) => setKeyword(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 h-[38px] text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 transition-all" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-400 mb-2 block">Narrow by location (optional)</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={countryIso} onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 h-[38px] text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 transition-all">
              <option value="">Country</option>
              {countryOptions.map((c) => (
                <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
              ))}
            </select>
            <select value={stateIso} onChange={(e) => handleStateChange(e.target.value)} disabled={!countryIso || loadingStates}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 h-[38px] text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-40">
              <option value="">{loadingStates ? 'Loading…' : !countryIso ? 'Province/State' : stateOptions.length === 0 ? 'No provinces listed' : 'Province/State'}</option>
              {stateOptions.map((s) => (
                <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
              ))}
            </select>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} disabled={!stateIso || loadingCities}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 h-[38px] text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-40">
              <option value="">{loadingCities ? 'Loading…' : !stateIso ? 'District/City' : cityOptions.length === 0 ? 'No cities listed' : 'District/City'}</option>
              {cityOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-400 mb-2 block">
            Measure distance from (optional — defaults to your own saved location)
          </span>
          <input type="text" placeholder="e.g. Lahore, Pakistan" value={near} onChange={(e) => setNear(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 h-[38px] text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 transition-all" />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={loading}
            className="px-6 h-[38px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-btn inline-flex items-center gap-2 transition-colors">
            <SearchIcon className="w-4 h-4" /> {loading ? 'Searching…' : 'Search'}
          </button>
          {(keyword || country || city || district || near) && (
            <button type="button" onClick={clearFilters}
              className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100">
              Clear filters
            </button>
          )}
        </div>
      </form>

      {error && (
        <EmptyState icon={<WarningIcon className="w-6 h-6" />} title="Search failed" subtitle={error} className="h-40 mb-6" />
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      )}

      {!loading && !error && hasSearched && (
        results.length > 0 ? (
          <>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-3">{total} result{total === 1 ? '' : 's'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((item) => <ResultCard key={item.id} item={item} searchType={searchType} />)}
            </div>

            {/* Sentinel for infinite scroll — loads the next 10 when it enters view. */}
            <div ref={sentinelCallbackRef} className="h-10 flex items-center justify-center mt-4">
              {loadingMore && (
                <span className="inline-flex items-center gap-2 text-[12px] text-slate-400 dark:text-slate-400 font-medium">
                  <SpinnerIcon className="w-4 h-4" /> Loading more…
                </span>
              )}
              {!hasMore && results.length >= PAGE_SIZE && (
                <span className="text-[12px] text-slate-300 dark:text-slate-600">You've reached the end.</span>
              )}
            </div>
          </>
        ) : (
          <EmptyState
            icon={<PinIcon className="w-6 h-6" />}
            title={`No ${searchLabel} match this filter yet`}
            subtitle="Try clearing the Country/Province/District filters, or check back once more people onboard."
            className="h-56"
          />
        )
      )}
    </AppShell>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SearchPageInner />
    </Suspense>
  )
}
