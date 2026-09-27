/**
 * "What is Kavan" illustration — a founder card and an investor card,
 * connected by a verified checkmark badge instead of a plain line, so the
 * visual itself says "matched and confirmed," not just "linked."
 */
export default function AboutIllustration() {
  return (
    <svg viewBox="0 0 340 260" className="w-full h-auto" role="img" aria-label="A founder profile and an investor profile connected by a verified match badge">
      <ellipse cx="170" cy="222" rx="118" ry="10" fill="#0F172A" opacity="0.08" />
      <circle cx="170" cy="118" r="108" fill="#EAF0FF" opacity="0.55" />

      {/* Founder card, left */}
      <rect x="30" y="70" width="96" height="120" rx="20" fill="#2563EB" />
      <circle cx="78" cy="112" r="18" fill="#fff" opacity="0.92" />
      <path d="M56 168c4-18 18-28 22-28s18 10 22 28" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9" />
      <rect x="46" y="176" width="64" height="7" rx="3.5" fill="#fff" opacity="0.35" />

      {/* Investor card, right */}
      <rect x="214" y="70" width="96" height="120" rx="20" fill="#6366F1" />
      <circle cx="262" cy="112" r="18" fill="#fff" opacity="0.92" />
      <path d="M240 168c4-18 18-28 22-28s18 10 22 28" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9" />
      <rect x="230" y="176" width="64" height="7" rx="3.5" fill="#fff" opacity="0.35" />

      {/* Connecting dashed lines into the center badge */}
      <path d="M126 130h35M214 130h-35" stroke="#94A3B8" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />

      {/* Verified match badge */}
      <circle cx="170" cy="130" r="27" fill="#fff" stroke="#2563EB" strokeWidth="3" />
      <path d="M159 130l7 7 15-15" stroke="#10B981" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* sparkle accents */}
      <path d="M170 58l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8z" fill="#F5C960" />
      <path d="M256 52l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" fill="#F5C960" opacity="0.8" />
    </svg>
  )
}
