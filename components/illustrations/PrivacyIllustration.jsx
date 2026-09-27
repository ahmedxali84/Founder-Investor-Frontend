/**
 * "Privacy & Trust" illustration — a profile card with a padlock over its
 * corner, ringed by soft protection pulses, so "your data is protected" has
 * an actual visual instead of a generic padlock floating alone.
 */
export default function PrivacyIllustration() {
  return (
    <svg viewBox="0 0 340 260" className="w-full h-auto" role="img" aria-label="A profile card protected behind a padlock, ringed by soft protection pulses">
      <ellipse cx="170" cy="222" rx="118" ry="10" fill="#0F172A" opacity="0.08" />
      <circle cx="170" cy="118" r="108" fill="#EAF0FF" opacity="0.5" />

      {/* protection pulse rings */}
      <circle cx="170" cy="126" r="86" fill="none" stroke="#2563EB" strokeWidth="2" opacity="0.14" />
      <circle cx="170" cy="126" r="66" fill="none" stroke="#2563EB" strokeWidth="2" opacity="0.22" />

      {/* profile card */}
      <rect x="118" y="94" width="100" height="120" rx="18" fill="#6366F1" />
      <circle cx="168" cy="134" r="18" fill="#fff" opacity="0.92" />
      <path d="M146 192c4-18 18-28 22-28s18 10 22 28" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9" />

      {/* padlock, overlapping the card's corner */}
      <path d="M212 148v-15a19 19 0 0138 0v15" stroke="#2563EB" strokeWidth="9" fill="none" strokeLinecap="round" />
      <rect x="196" y="148" width="70" height="56" rx="14" fill="#2563EB" />
      <circle cx="231" cy="172" r="7" fill="#fff" />
      <rect x="228" y="172" width="6" height="14" rx="3" fill="#fff" />
    </svg>
  )
}
