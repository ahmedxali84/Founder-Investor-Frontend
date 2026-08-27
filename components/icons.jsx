/**
 * The full lockup (pineapple mark + "KAVAN" wordmark + tagline) is baked
 * into one square image per theme — light-on-white for light mode,
 * gold-on-black for dark — rather than separate SVG/text pieces, so this
 * just swaps which one is visible via Tailwind's dark: class strategy
 * (same one every other dark: usage in this app relies on, toggled by
 * ThemeContext.jsx) instead of trying to theme an <img> src directly.
 */
export function Logo({ className = '', size = 'sm' }) {
  // The lockup is a full square (mark + wordmark + tagline stacked), not a
  // wide horizontal logo — shrinking it to a typical nav-bar height (~36px)
  // makes the tagline an illegible blur and the wordmark itself blurry.
  // Confirmed by rendering it at several heights side by side: the wordmark
  // stays crisp from ~48px, the tagline only actually reads from ~80px.
  const height = size === 'lg' ? 'h-20' : 'h-12'
  return (
    <div className={`flex items-center ${className}`}>
      <img src="/logo-light.png" alt="Kavan" className={`${height} w-auto dark:hidden`} />
      <img src="/logo-dark.png" alt="Kavan" className={`${height} w-auto hidden dark:block`} />
    </div>
  )
}

export function GoogleIcon({ className = 'w-[18px] h-[18px]' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59A14.5 14.5 0 019.77 24c0-1.6.27-3.15.76-4.59l-7.98-6.19A23.94 23.94 0 000 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

export function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path
        d="M10.6 6.2A9.9 9.9 0 0112 6c6.4 0 10 7 10 7a17.6 17.6 0 01-3.4 4.3M6.5 7.4C3.7 9.1 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.5 4.5-1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.9 9.9a3 3 0 004.2 4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MailIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
      <path d="M3.5 7l7.4 5.2a2 2 0 002.2 0L20.5 7" strokeLinecap="round" />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="10" width="16" height="10.5" rx="3" />
      <path d="M8 10V7.5a4 4 0 018 0V10" strokeLinecap="round" />
    </svg>
  )
}

export function UserIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c1.4-3.7 4.2-5.5 7.5-5.5s6.1 1.8 7.5 5.5" strokeLinecap="round" />
    </svg>
  )
}

export function CollabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2F6BFF" strokeWidth="1.9" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 19c1-3 3.4-4.6 6.2-4.6S14.2 16 15.2 19" strokeLinecap="round" />
      <circle cx="17.4" cy="7.2" r="2.6" />
      <path d="M16 13.6c2.6-.3 4.5 1.4 5.2 4.2" strokeLinecap="round" />
    </svg>
  )
}

export function AutomationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1FA971" strokeWidth="2" aria-hidden="true">
      <path d="M4 19V12M10 19V6M16 19v-4.5M22 19V9" strokeLinecap="round" />
    </svg>
  )
}

export function ShieldIcon({ className }) {
  return (
    <svg className={className} width={className ? undefined : '18'} height={className ? undefined : '18'} viewBox="0 0 24 24" fill="none" stroke={className ? 'currentColor' : '#E2A032'} strokeWidth="1.9" aria-hidden="true">
      <path d="M12 2.8l7.5 3v6c0 4.7-3.1 8.3-7.5 9.4-4.4-1.1-7.5-4.7-7.5-9.4v-6l7.5-3z" strokeLinejoin="round" />
      <path d="M8.8 12l2.2 2.2 4.2-4.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function LinkedInMark({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M7.12 9.4H4.62v9.1h2.5V9.4zM5.87 8.2a1.45 1.45 0 100-2.9 1.45 1.45 0 000 2.9zM19.38 13.5c0-2.6-1.39-3.8-3.24-3.8-1.5 0-2.17.83-2.54 1.4v-1.2h-2.5c.03.7 0 9.1 0 9.1h2.5v-5.08c0-.27.02-.54.1-.74.22-.54.72-1.11 1.57-1.11 1.1 0 1.6.85 1.6 2.08v4.85h2.5v-5.5z"
      />
    </svg>
  )
}

export function GitHubMark({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.11.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.76 1.19 1.76 1.19 1.03 1.75 2.7 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 015.79 0c2.2-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.09 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .3.2.67.79.55A10.51 10.51 0 0023.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  )
}

export function CheckIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M4 12l6 6L20 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SpinnerIcon({ className = 'w-[17px] h-[17px]' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function WarningIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3.5L2.5 20h19L12 3.5z" strokeLinejoin="round" />
      <path d="M12 9.5v5" strokeLinecap="round" />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function InfoIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" strokeLinecap="round" />
      <circle cx="12" cy="7.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Partner-logo marks for the "Trusted by" row. */
export function PartnerMark({ shape }) {
  const common = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: '#8A8FA0', strokeWidth: 1.8 }
  if (shape === 'byte')
    return (
      <svg {...common} aria-hidden="true">
        <path d="M9 7L4 12l5 5M15 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (shape === 'cloud')
    return (
      <svg {...common} aria-hidden="true">
        <path d="M7 18h9.5a3.9 3.9 0 000-7.8 5.6 5.6 0 00-10.8 1.6A3.2 3.2 0 007 18z" strokeLinejoin="round" />
      </svg>
    )
  if (shape === 'data')
    return (
      <svg {...common} aria-hidden="true">
        <ellipse cx="12" cy="6.5" rx="7.2" ry="3" />
        <path d="M4.8 6.5v11c0 1.7 3.2 3 7.2 3s7.2-1.3 7.2-3v-11" />
        <path d="M4.8 12c0 1.7 3.2 3 7.2 3s7.2-1.3 7.2-3" />
      </svg>
    )
  return (
    <svg {...common} aria-hidden="true">
      <rect x="4" y="4.5" width="16" height="15" rx="3.2" />
      <path d="M8.5 12l2.4 2.4 4.6-4.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * In-app UI icon set. A single, consistent 24px line-icon family so
 * the product never falls back to emoji for functional UI. All inherit
 * `currentColor` and take a className, so color/size come from Tailwind.
 * ------------------------------------------------------------------ */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function HomeIcon({ className = 'w-[18px] h-[18px]' }) {
  return (
    <svg className={className} {...base}>
      <path d="M3.5 10.5 12 4l8.5 6.5" />
      <path d="M5.5 9.5V19a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 20v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5" />
    </svg>
  )
}

export function HandshakeIcon({ className = 'w-[18px] h-[18px]' }) {
  return (
    <svg className={className} {...base}>
      <path d="m11 17-2.2 2.2a1.4 1.4 0 0 1-2-2L9 15" />
      <path d="M12.5 8.5 15 6a2 2 0 0 1 2.8 0l3.2 3.2" />
      <path d="m3 9.8 3.2-3.2A2 2 0 0 1 9 6.6l2.5 2.5a1.4 1.4 0 0 1 0 2L10 12.6" />
      <path d="m13 10 3 3M15.5 12.5 18 15a1.4 1.4 0 0 1-2 2l-1-1M13 14.5l1.2 1.2a1.4 1.4 0 0 1-2 2L11 16.5" />
    </svg>
  )
}

export function RobotIcon({ className = 'w-[18px] h-[18px]' }) {
  return (
    <svg className={className} {...base}>
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <path d="M12 4v4M8 13h.01M16 13h.01" />
      <path d="M9 16.5h6M2.5 12v3M21.5 12v3" />
    </svg>
  )
}

export function BulbIcon({ className = 'w-[18px] h-[18px]' }) {
  return (
    <svg className={className} {...base}>
      <path d="M9 17.5h6M10 20.5h4" />
      <path d="M12 3a6 6 0 0 0-3.8 10.6c.5.4.8 1 .8 1.7v.2h6v-.2c0-.7.3-1.3.8-1.7A6 6 0 0 0 12 3Z" />
    </svg>
  )
}

export function ChatBubbleIcon({ className = 'w-[18px] h-[18px]' }) {
  return (
    <svg className={className} {...base}>
      <path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.9 8.9 0 0 1-3.5-.7L3 21l1.8-5.4a8.4 8.4 0 0 1-.8-3.6A8.4 8.4 0 0 1 12.5 3a8.4 8.4 0 0 1 8.5 8.5Z" />
    </svg>
  )
}

export function ProfileIcon({ className = 'w-[18px] h-[18px]' }) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.8 3.8-5.5 7-5.5s5.8 1.7 7 5.5" />
    </svg>
  )
}

export function SearchIcon({ className = 'w-[18px] h-[18px]' }) {
  return (
    <svg className={className} {...base}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  )
}

export function BellIcon({ className = 'w-[18px] h-[18px]' }) {
  return (
    <svg className={className} {...base}>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  )
}

export function HelpIcon({ className = 'w-[18px] h-[18px]' }) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.5" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function RepoIcon({ className = 'w-[18px] h-[18px]' }) {
  return (
    <svg className={className} {...base}>
      <path d="M6 3.5h11a1 1 0 0 1 1 1v13.5H7A2.5 2.5 0 0 1 4.5 15.5V6A2.5 2.5 0 0 1 7 3.5" />
      <path d="M18 18v2.5H7A2.5 2.5 0 0 1 4.5 18" />
    </svg>
  )
}

export function StarIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 17.9 6.7 20.6l1-5.8-4.2-4.1 5.9-.9L12 3.5Z" />
    </svg>
  )
}

export function PinIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} {...base}>
      <path d="M12 21c4-4.2 6.5-7.4 6.5-10.5a6.5 6.5 0 0 0-13 0C5.5 13.6 8 16.8 12 21Z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </svg>
  )
}

export function BuildingIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} {...base}>
      <path d="M5 21V5.5A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5V21" />
      <path d="M15 10h2.5A1.5 1.5 0 0 1 19 11.5V21M3 21h18" />
      <path d="M8 8h.01M11.5 8h.01M8 12h.01M11.5 12h.01M8 16h.01M11.5 16h.01" />
    </svg>
  )
}

export function CalendarIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...base}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </svg>
  )
}

export function CheckCircleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.3 2.3 4.7-4.9" />
    </svg>
  )
}

export function ClockIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function HandRaiseIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...base}>
      <path d="M8 11V4.8a1.4 1.4 0 0 1 2.8 0V10" />
      <path d="M10.8 10V3.8a1.4 1.4 0 0 1 2.8 0V10" />
      <path d="M13.6 10.2V5.4a1.4 1.4 0 0 1 2.8 0V13a6 6 0 0 1-6 6h-.5a5 5 0 0 1-4.2-2.3L4 14.4a1.4 1.4 0 0 1 2.2-1.7L8 14.5V8.2a1.4 1.4 0 0 1 2.8 0V10" />
    </svg>
  )
}

export function CodeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...base}>
      <path d="m9 8-4 4 4 4M15 8l4 4-4 4M13 6l-2 12" />
    </svg>
  )
}

export function PlugIcon({ className = 'w-[18px] h-[18px]' }) {
  return (
    <svg className={className} {...base}>
      <path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8ZM12 17v4" />
    </svg>
  )
}

export function ArrowRightIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...base}>
      <path d="M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5" />
    </svg>
  )
}

export function ArrowUpRightIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} {...base}>
      <path d="M7 17 17 7M8.5 7H17v8.5" />
    </svg>
  )
}

export function MenuIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...base}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function CloseIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...base}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function GearIcon({ className = 'w-[18px] h-[18px]' }) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.7 5.3 17 7M7 17l-1.7 1.7M18.7 18.7 17 17M7 7 5.3 5.3" />
    </svg>
  )
}

export function InboxIcon({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} {...base}>
      <path d="M3.5 13.5 6 5.5A2 2 0 0 1 8 4h8a2 2 0 0 1 2 1.5l2.5 8" />
      <path d="M3.5 13.5V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4.5h-5a3 3 0 0 1-6 0h-6Z" />
    </svg>
  )
}

export function TicketIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...base}>
      <path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h14a1.5 1.5 0 0 1 1.5 1.5v1a2 2 0 0 0 0 4v1A1.5 1.5 0 0 1 19 17H5a1.5 1.5 0 0 1-1.5-1.5v-1a2 2 0 0 0 0-4v-1Z" />
      <path d="M13 7v10" strokeDasharray="1.5 2.5" />
    </svg>
  )
}

export function DocIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...base}>
      <path d="M6.5 3.5h7L18 8v11a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M13 3.5V8h4.5M8.5 12.5h7M8.5 15.5h7" />
    </svg>
  )
}

export function RocketIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...base}>
      <path d="M5.5 15.5c-1.8.8-2.5 3-2.5 5 2-.1 4.2-.7 5-2.5" />
      <path d="M9 15l-2-2c1-4 3.5-7.5 8.5-9.5C15.8 6 14 9.5 11 11l-2 4Z" />
      <path d="M14.5 9.5a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function BriefcaseIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...base}>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3.5 12.5h17" />
    </svg>
  )
}

export function PaperclipIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 11.5 12.5 19a4.5 4.5 0 0 1-6.4-6.4l7.7-7.7a3 3 0 0 1 4.3 4.3l-7.6 7.6a1.5 1.5 0 0 1-2.2-2.1l6.9-6.9" />
    </svg>
  )
}

export function ArrowLeftIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19.5 12h-15M11 5.5 4.5 12l6.5 6.5" />
    </svg>
  )
}

export function SendIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 12 20 4.5 15.5 20l-3.5-6.5L4.5 12Z" />
    </svg>
  )
}

export function SunIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8 6 18M18 6l1.8-1.8" />
    </svg>
  )
}

export function MoonIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.6 15.3A8.5 8.5 0 1 1 8.7 3.4a7 7 0 0 0 11.9 11.9Z" />
    </svg>
  )
}

export function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}
