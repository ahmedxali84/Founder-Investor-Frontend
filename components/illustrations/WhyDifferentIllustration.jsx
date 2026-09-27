/**
 * "Why it's different" illustration — a solid verified shield in front of a
 * faded, dashed-outline duplicate profile with an X — "real, verified data"
 * shown next to what it isn't, rather than the shield standing alone.
 */
export default function WhyDifferentIllustration() {
  return (
    <svg viewBox="0 0 340 260" className="w-full h-auto" role="img" aria-label="A verified shield in front of a faded, rejected duplicate profile card">
      <ellipse cx="170" cy="222" rx="118" ry="10" fill="#0F172A" opacity="0.08" />
      <circle cx="170" cy="118" r="108" fill="#EAF0FF" opacity="0.5" />

      {/* faded fake card, behind */}
      <g transform="rotate(8 240 125)" opacity="0.6">
        <rect x="196" y="70" width="88" height="110" rx="16" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeDasharray="5 6" />
        <path d="M224 96l16 16M240 96l-16 16" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* verified shield, front */}
      <path d="M150 52l50 19v40c0 34-21 57-50 67-29-10-50-33-50-67V71z" fill="#2563EB" />
      <path d="M150 52l50 19v40c0 34-21 57-50 67z" fill="#4F46E5" opacity="0.5" />
      <path d="M127 116l16 16 30-30" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* sparkle accents */}
      <path d="M90 84l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8z" fill="#F5C960" />
      <path d="M86 156l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" fill="#F5C960" opacity="0.8" />
    </svg>
  )
}
