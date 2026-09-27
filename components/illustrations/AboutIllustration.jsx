/**
 * "What is Kavan" illustration — a founder card and an investor card,
 * connected by a verified checkmark badge instead of a plain line, so the
 * visual itself says "matched and confirmed," not just "linked."
 *
 * Gradient fills + a soft drop-shadow filter + glossy top-highlights give
 * this real depth instead of flat single-color shapes — the brief was
 * "premium," and flat fills read as a placeholder icon rather than a
 * finished illustration.
 */
export default function AboutIllustration() {
  return (
    <svg viewBox="0 0 340 260" className="w-full h-auto" role="img" aria-label="A founder profile and an investor profile connected by a verified match badge">
      <defs>
        <linearGradient id="about-founder" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="about-investor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <radialGradient id="about-badge-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#93C5FD" stopOpacity="0" />
        </radialGradient>
        <filter id="about-card-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#1E2334" floodOpacity="0.16" />
        </filter>
      </defs>

      <ellipse cx="170" cy="226" rx="118" ry="9" fill="#0F172A" opacity="0.08" />
      <circle cx="170" cy="118" r="108" fill="#EAF0FF" opacity="0.55" />
      <circle cx="170" cy="130" r="46" fill="url(#about-badge-glow)" />

      {/* Founder card, left */}
      <g filter="url(#about-card-shadow)">
        <rect x="30" y="70" width="96" height="120" rx="20" fill="url(#about-founder)" />
        <path d="M30 90a20 20 0 0120-20h56a20 20 0 0120 20v6H30z" fill="#fff" opacity="0.08" />
        <circle cx="78" cy="112" r="18" fill="#fff" opacity="0.94" />
        <path d="M56 168c4-18 18-28 22-28s18 10 22 28" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.92" />
        <rect x="46" y="176" width="64" height="7" rx="3.5" fill="#fff" opacity="0.4" />
      </g>

      {/* Investor card, right */}
      <g filter="url(#about-card-shadow)">
        <rect x="214" y="70" width="96" height="120" rx="20" fill="url(#about-investor)" />
        <path d="M214 90a20 20 0 0120-20h56a20 20 0 0120 20v6H214z" fill="#fff" opacity="0.08" />
        <circle cx="262" cy="112" r="18" fill="#fff" opacity="0.94" />
        <path d="M240 168c4-18 18-28 22-28s18 10 22 28" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.92" />
        <rect x="230" y="176" width="64" height="7" rx="3.5" fill="#fff" opacity="0.4" />
      </g>

      {/* Connecting dashed lines into the center badge */}
      <path d="M126 130h35M214 130h-35" stroke="#94A3B8" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />

      {/* Verified match badge */}
      <circle cx="170" cy="130" r="28" fill="#fff" filter="url(#about-card-shadow)" />
      <circle cx="170" cy="130" r="28" fill="none" stroke="#2563EB" strokeWidth="3" />
      <path d="M159 130l7 7 15-15" stroke="#10B981" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* sparkle accents */}
      <path d="M170 56l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8z" fill="#F5C960" />
      <path d="M256 50l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" fill="#F5C960" opacity="0.85" />
      <circle cx="66" cy="58" r="3" fill="#93C5FD" />
      <circle cx="280" cy="180" r="3" fill="#A5B4FC" />
    </svg>
  )
}
