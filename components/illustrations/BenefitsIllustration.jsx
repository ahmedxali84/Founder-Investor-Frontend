/**
 * "What you actually get" illustration — one elevated, highlighted match
 * card in front of two faded, tilted-back ones, so "one real match, not a
 * pile to sort through" is shown, not just stated.
 *
 * Same depth treatment as AboutIllustration: gradient fills, a real
 * drop-shadow filter lifting the front card off the page, and a soft glow
 * behind the star badge, instead of flat single-tone shapes.
 */
export default function BenefitsIllustration() {
  return (
    <svg viewBox="0 0 340 260" className="w-full h-auto" role="img" aria-label="One highlighted match card standing out in front of two faded ones">
      <defs>
        <linearGradient id="benefits-main" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="benefits-star" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="benefits-check" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <radialGradient id="benefits-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FCD34D" stopOpacity="0" />
        </radialGradient>
        <filter id="benefits-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#1E2334" floodOpacity="0.18" />
        </filter>
        <filter id="benefits-soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#1E2334" floodOpacity="0.1" />
        </filter>
      </defs>

      <ellipse cx="170" cy="226" rx="118" ry="9" fill="#0F172A" opacity="0.08" />
      <circle cx="170" cy="118" r="108" fill="#EAF0FF" opacity="0.5" />
      <circle cx="205" cy="96" r="34" fill="url(#benefits-glow)" />

      {/* faded back cards */}
      <rect x="46" y="118" width="74" height="90" rx="16" fill="#94A3B8" opacity="0.3" transform="rotate(-6 83 163)" />
      <rect x="220" y="118" width="74" height="90" rx="16" fill="#94A3B8" opacity="0.3" transform="rotate(6 257 163)" />

      {/* the one real match, elevated and highlighted */}
      <g filter="url(#benefits-shadow)">
        <rect x="120" y="86" width="100" height="124" rx="20" fill="url(#benefits-main)" />
        <path d="M120 106a20 20 0 0120-20h60a20 20 0 0120 20v6H120z" fill="#fff" opacity="0.08" />
        <circle cx="170" cy="130" r="20" fill="#fff" opacity="0.96" />
        <path d="M146 190c4-20 20-30 24-30s20 10 24 30" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.92" />
      </g>

      {/* star badge */}
      <g filter="url(#benefits-soft-shadow)">
        <circle cx="205" cy="96" r="17" fill="url(#benefits-star)" />
        <path d="M205 88l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="#fff" />
      </g>

      {/* checkmark tick floating above */}
      <g filter="url(#benefits-soft-shadow)">
        <circle cx="128" cy="68" r="13" fill="url(#benefits-check)" />
        <path d="M122 68l4 4 8-8" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* sparkle + dot accents */}
      <path d="M262 66l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill="#F5C960" opacity="0.9" />
      <circle cx="90" cy="90" r="3" fill="#93C5FD" />
    </svg>
  )
}
