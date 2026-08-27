'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUnreadMessages } from '../context/UnreadMessagesContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import Notice from './Notice.jsx'
import DeleteAccountModal from './DeleteAccountModal.jsx'
import {
  Logo, HomeIcon, HandshakeIcon, RobotIcon, BulbIcon, ProfileIcon, ChatBubbleIcon,
  SearchIcon, BellIcon, HelpIcon, GitHubMark, LinkedInMark,
  MenuIcon, CloseIcon, ArrowRightIcon, PinIcon, StarIcon,
  CheckCircleIcon, HandRaiseIcon, GearIcon, SunIcon, MoonIcon, TrashIcon,
} from './icons.jsx'
import { timeAgo } from '../lib/format.js'

/** Shared by every header dropdown (bell, help): closes on an outside click or Escape. */
function useDismissablePopover() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return [open, setOpen, rootRef]
}

const NAV_ITEMS = [
  { key: 'overview', to: '/dashboard', Icon: HomeIcon, label: 'Overview' },
  { key: 'messages', to: '/messaging', Icon: ChatBubbleIcon, label: 'Messages' },
]

/**
 * Investors don't post ideas — /ideas shows their AI-ranked startup
 * shortlist instead, so the nav item is relabeled per role rather than
 * always reading "My Ideas" for a user type it doesn't apply to.
 */
function getAiManagementItems(userType) {
  return [
    { key: 'matches', to: '/matches', Icon: HandshakeIcon, label: 'Matches' },
    { key: 'search', to: '/search', Icon: PinIcon, label: 'Location Search' },
    { key: 'agents', to: '/agents', Icon: RobotIcon, label: 'AI Agents' },
    userType === 'investor'
      ? { key: 'ideas', to: '/ideas', Icon: StarIcon, label: 'Shortlist' }
      : { key: 'ideas', to: '/ideas', Icon: BulbIcon, label: 'My Ideas' },
    { key: 'profile', to: '/profile', Icon: ProfileIcon, label: 'Profile' },
  ]
}

function NavLink({ item, active, onNavigate, badgeCount }) {
  const { Icon } = item
  const isActive = active === item.key
  return (
    <Link
      href={item.to}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={`group relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-nav transition-colors duration-150 ${
        isActive
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-accent-gradient" />
      )}
      <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}`} />
      <span>{item.label}</span>
      {badgeCount > 0 && (
        <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold leading-[18px] text-center shrink-0">
          {badgeCount}
        </span>
      )}
    </Link>
  )
}

const SEEN_NOTIFICATIONS_KEY = 'techflix_seen_notifications'

function loadSeenIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_NOTIFICATIONS_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function saveSeenIds(ids) {
  try {
    // Cap at the most recent 200 so this can't grow unbounded over a long
    // session — old ids falling off just means a since-resolved notification
    // could theoretically re-show as "new" once, which is harmless.
    localStorage.setItem(SEEN_NOTIFICATIONS_KEY, JSON.stringify([...ids].slice(-200)))
  } catch {
    // localStorage unavailable (private mode, quota) — seen-tracking just
    // won't persist across reloads; not worth surfacing an error for.
  }
}

/**
 * Real notifications derived from the same /api/profile + /api/{type}/status
 * data every page already polls — meeting-request state changes and the
 * current top match — not a separate invented notifications backend.
 * Each item gets a stable id keyed to the actual state it represents (which
 * counterpart, which stage) so "seen" tracking below only clears once per
 * genuinely new event, not once ever.
 */
/**
 * Derives notification items from data useAgentStatus() already fetched
 * (profileData/statusData — the same /profile + /{type}/status payload)
 * instead of independently polling the same endpoints on its own 8s timer.
 * Before this, any authenticated page was firing /profile + /{type}/status
 * twice at once — once from useAgentStatus's 4s poll, once from here at 8s —
 * with no shared cache between them. useMemo instead of state+effect: this
 * is now pure derived data, recomputed whenever the shared status changes.
 */
function useNotifications(profileData, statusData) {
  return useMemo(() => {
    if (!profileData?.onboarded || !statusData) return []

    const next = []
    for (const m of statusData.meeting_requests || []) {
      // A founder never learns the investor's real identity from a
      // notification before the meeting is confirmed — same confidentiality
      // rule as the Matches page itself, so this can't be used as a
      // side-channel to see who it is early.
      const otherName = profileData.user_type === 'founder'
        ? (m.both_opted_in ? (m.investor?.name || m.investor?.firm || 'An investor') : 'a confidential investor match')
        : (m.idea?.title || 'A founder')
      const base = { updatedAt: m.updated_at, href: '/matches' }
      if (m.both_opted_in) {
        next.push({ ...base, id: `confirmed-${m.id}`, type: 'confirmed', text: `Meeting confirmed with ${otherName}.` })
      } else if (profileData.user_type === 'founder' && m.investor_raised && !m.founder_requested) {
        next.push({ ...base, id: `raised-${m.id}`, type: 'action', text: `An investor raised their hand on your idea — request a meeting to confirm.` })
      } else if (profileData.user_type === 'investor' && m.founder_requested && !m.investor_raised) {
        next.push({ ...base, id: `requested-${m.id}`, type: 'action', text: `${otherName} requested a meeting — raise your hand to confirm.` })
      }
    }
    if (statusData.current_match) {
      const matchId = profileData.user_type === 'investor' ? statusData.current_match.idea?.id : statusData.current_match.investor?.id
      const name = profileData.user_type === 'investor'
        ? statusData.current_match.idea?.title
        : 'a confidential investor match'
      if (name && matchId) {
        next.push({ id: `current-match-${matchId}`, type: 'match', text: `Your current top match: ${name}.`, href: '/matches' })
      }
    }
    return next
  }, [profileData, statusData])
}

const NOTIFICATION_ICON = {
  confirmed: { Icon: CheckCircleIcon, className: 'text-emerald-500' },
  action: { Icon: HandRaiseIcon, className: 'text-blue-500' },
  match: { Icon: HandshakeIcon, className: 'text-slate-400' },
}

function NotificationBell({ profileData, statusData }) {
  const [open, setOpen, rootRef] = useDismissablePopover()
  const router = useRouter()
  const notifications = useNotifications(profileData, statusData)
  const [seenIds, setSeenIds] = useState(loadSeenIds)
  const unseenCount = notifications.filter((n) => !seenIds.has(n.id)).length

  // Opening the dropdown is "reading" it — mark everything currently shown
  // as seen so the badge only ever counts what's genuinely new since last look.
  useEffect(() => {
    if (!open || notifications.length === 0) return
    setSeenIds((prev) => {
      const next = new Set(prev)
      notifications.forEach((n) => next.add(n.id))
      saveSeenIds(next)
      return next
    })
  }, [open, notifications])

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors relative"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <BellIcon />
        {unseenCount > 0 && (
          <span className="min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold leading-4 text-center absolute -top-0.5 -right-0.5 ring-2 ring-white dark:ring-slate-900">
            {unseenCount > 9 ? '9+' : unseenCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:top-[calc(100%+8px)] sm:right-0 sm:w-[calc(100vw-2rem)] sm:max-w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg z-40 overflow-hidden animate-card-in">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Notifications</span>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <span className="text-xs text-slate-400 dark:text-slate-500">You're all caught up — no notifications yet.</span>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((n) => {
                const { Icon, className } = NOTIFICATION_ICON[n.type] || NOTIFICATION_ICON.match
                const isNew = !seenIds.has(n.id)
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => { setOpen(false); if (n.href) router.push(n.href) }}
                      className="w-full text-left px-4 py-3 flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${className}`} />
                      <span className="min-w-0 flex-1">
                        <span className="text-xs text-slate-600 dark:text-slate-300 block">{n.text}</span>
                        <span className="mt-0.5 flex items-center gap-1.5">
                          {n.updatedAt && <span className="text-[10px] text-slate-400 dark:text-slate-500">{timeAgo(n.updatedAt)}</span>}
                          {isNew && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" aria-label="New" />}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

const HELP_ITEMS = [
  {
    title: 'How matching works',
    body: 'A founder connects LinkedIn + GitHub and posts an idea; an investor sets a firm, sectors and ticket size. Agents 4/5 rank and pair you with one exclusive top match at a time.',
  },
  {
    title: 'Getting your MVP unlocked',
    body: "Investor access to your idea's contact details stays locked until your MVP URL is verified reachable on the Ideas page.",
  },
  {
    title: 'Location Search',
    body: 'Founders search investors, investors search founder ideas — results are sorted closest-to-you first, using the location you set during onboarding.',
  },
]

function HelpMenu() {
  const [open, setOpen, rootRef] = useDismissablePopover()

  return (
    <div className="relative hidden sm:block" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
        aria-label="Help"
        aria-expanded={open}
      >
        <HelpIcon />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[calc(100vw-2rem)] max-w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg z-40 overflow-hidden animate-card-in">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Quick help</span>
          </div>
          <ul className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {HELP_ITEMS.map((item) => (
              <li key={item.title} className="px-4 py-3">
                <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{item.title}</p>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * Sidebar dropdown: theme toggle + account deletion. Both apply to every
 * role (founder and investor) — nothing here is role-gated.
 */
function SettingsMenu() {
  const [open, setOpen, rootRef] = useDismissablePopover()
  const { theme, toggleTheme } = useTheme()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-nav text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
        aria-label="Settings"
        aria-expanded={open}
      >
        <GearIcon className="w-[18px] h-[18px] shrink-0 text-slate-400 dark:text-slate-500" />
        <span>Settings</span>
      </button>

      {open && (
        <div className="absolute left-0 bottom-[calc(100%+8px)] w-[calc(100vw-2rem)] max-w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg z-40 overflow-hidden animate-card-in">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200">
              {theme === 'dark' ? <MoonIcon className="w-4 h-4 text-slate-400" /> : <SunIcon className="w-4 h-4 text-amber-500" />}
              Theme
            </span>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 capitalize">{theme}</span>
          </button>
          <div className="border-t border-slate-100 dark:border-slate-800" />
          <button
            onClick={() => { setOpen(false); setDeleteModalOpen(true) }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            Delete account
          </button>
        </div>
      )}

      {deleteModalOpen && <DeleteAccountModal onClose={() => setDeleteModalOpen(false)} />}
    </div>
  )
}

/**
 * A genuine top-level component, not a function defined inside AppShell's
 * render body (which it used to be) — that meant a brand-new component
 * identity on every single AppShell re-render, which React treats as an
 * entirely different component type: it unmounted and remounted this whole
 * subtree on every re-render, silently wiping any local state inside it —
 * SettingsMenu's `deleteModalOpen` included, which is why the delete-account
 * modal (nested inside SettingsMenu, nested inside this) could vanish
 * within seconds of opening it, roughly in step with AppShell's own re-render
 * cadence (e.g. every status poll tick).
 */
function SidebarBody({ active, userType, unreadContactsCount, aiManagementItems, onNavigate }) {
  return (
    <>
      <div>
        <Link href="/dashboard" onClick={onNavigate} className="block p-5 border-b border-slate-100 dark:border-slate-800">
          <Logo />
        </Link>

        <nav className="p-3 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.key}
                item={item}
                active={active}
                onNavigate={onNavigate}
                badgeCount={item.key === 'messages' ? unreadContactsCount : 0}
              />
            ))}
          </div>

          <div className="space-y-1">
            <span className="px-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.14em] block mb-2">
              AI Management
            </span>
            {aiManagementItems.map((item) => (
              <NavLink key={item.key} item={item} active={active} onNavigate={onNavigate} />
            ))}
          </div>

          <div className="space-y-1">
            <span className="px-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.14em] block mb-2">
              Integrations
            </span>
            {/* Investors are never asked to connect GitHub — Agent 2's
                investor variant only ever reads LinkedIn — so listing it
                here as a "LIVE" integration for them would be a flat lie. */}
            {userType !== 'investor' && (
              <div className="px-3.5 py-2 text-[13px] font-semibold text-slate-500 dark:text-slate-400 rounded-xl flex items-center gap-3">
                <GitHubMark className="w-[18px] h-[18px] [&>path]:fill-slate-700 dark:[&>path]:fill-slate-300" />
                <span>GitHub API</span>
                <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />LIVE
                </span>
              </div>
            )}
            <div className="px-3.5 py-2 text-[13px] font-semibold text-slate-500 dark:text-slate-400 rounded-xl flex items-center gap-3">
              <LinkedInMark className="w-[18px] h-[18px]" />
              <span>LinkedIn Sync</span>
            </div>
          </div>
        </nav>
      </div>

      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <SettingsMenu />
        <p className="mt-2 text-center text-[10px] text-slate-400/70 dark:text-slate-500/70">
          © {new Date().getFullYear()} Kavan — a Techflix company.
        </p>
      </div>
    </>
  )
}

/**
 * Shared in-app shell (sidebar + top header) so every page behind login
 * feels like the same product instead of each hand-rolling its own header.
 */
export default function AppShell({ active, userType, userName, userRole, avatarUrl, onSignOut, notice, profileData, statusData, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)
  const router = useRouter()
  const { unreadContactsCount } = useUnreadMessages()
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'U')}&background=2563EB&color=fff`
  const aiManagementItems = getAiManagementItems(userType)

  // ⌘K / Ctrl+K focuses the header search box, matching the badge shown next to it.
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function runHeaderSearch(e) {
    e.preventDefault()
    const q = searchQuery.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-slate-950 flex font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-blue-100">
      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200/70 dark:border-slate-800 flex-col justify-between shrink-0 hidden md:flex sticky top-0 h-screen z-20">
        <SidebarBody active={active} userType={userType} unreadContactsCount={unreadContactsCount} aiManagementItems={aiManagementItems} />
      </aside>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between animate-card-in overflow-y-auto">
            <div className="absolute right-3 top-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>
            <SidebarBody active={active} userType={userType} unreadContactsCount={unreadContactsCount} aiManagementItems={aiManagementItems} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200/70 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>

            <form onSubmit={runHeaderSearch} className="w-full max-w-md relative hidden sm:block">
              <SearchIcon className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search investors, founders, skills, ideas…"
                className="w-full pl-10 pr-12 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 transition-all duration-150"
              />
              {!searchQuery && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold pointer-events-none">
                  ⌘K
                </span>
              )}
            </form>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <NotificationBell profileData={profileData} statusData={statusData} />
            <HelpMenu />

            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 sm:border-l border-slate-200 dark:border-slate-800">
              <Link href="/profile" className="flex items-center gap-2.5">
                <img
                  src={avatarUrl || fallbackAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 object-cover transition-transform hover:scale-105"
                  onError={(e) => { e.currentTarget.src = fallbackAvatar }}
                />
                <div className="hidden sm:block text-left leading-tight">
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 block">{userName}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block capitalize">{userRole}</span>
                </div>
              </Link>
              <button
                onClick={onSignOut}
                className="ml-1 sm:ml-2 text-[12px] font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 overflow-y-auto flex-1">
          {notice && <Notice tone="info" className="mb-4">{notice}</Notice>}
          {children}
        </main>
      </div>
    </div>
  )
}
