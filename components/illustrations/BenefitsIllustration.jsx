/**
 * "What you actually get" illustration — one elevated, highlighted match
 * card in front of two faded, tilted-back ones, so "one real match, not a
 * pile to sort through" is shown, not just stated.
 */
export default function BenefitsIllustration() {
  return (
    <svg viewBox="0 0 340 260" className="w-full h-auto" role="img" aria-label="One highlighted match card standing out in front of two faded ones">
      <ellipse cx="170" cy="222" rx="118" ry="10" fill="#0F172A" opacity="0.08" />
      <circle cx="170" cy="118" r="108" fill="#EAF0FF" opacity="0.5" />

      {/* faded back cards */}
      <rect x="46" y="118" width="74" height="90" rx="16" fill="#94A3B8" opacity="0.35" transform="rotate(-6 83 163)" />
      <rect x="220" y="118" width="74" height="90" rx="16" fill="#94A3B8" opacity="0.35" transform="rotate(6 257 163)" />

      {/* the one real match, elevated and highlighted */}
      <rect x="120" y="86" width="100" height="124" rx="20" fill="#2563EB" />
      <circle cx="170" cy="130" r="20" fill="#fff" opacity="0.95" />
      <path d="M146 190c4-20 20-30 24-30s20 10 24 30" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9" />

      {/* star badge */}
      <circle cx="205" cy="96" r="17" fill="#F59E0B" />
      <path d="M205 88l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="#fff" />

      {/* checkmark tick floating above */}
      <circle cx="128" cy="68" r="13" fill="#10B981" />
      <path d="M122 68l4 4 8-8" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}
