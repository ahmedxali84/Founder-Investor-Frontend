export default function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 420 230"
      className="w-full max-w-[420px]"
      role="img"
      aria-label="An AI agent working at a laptop beside a plant and a mug"
    >
      {/* dotted texture, left */}
      <g fill="#D8DEEA">
        {[0, 1, 2, 3, 4].map((r) =>
          [0, 1, 2, 3, 4, 5].map((c) => (
            <circle key={`${r}-${c}`} cx={12 + c * 11} cy={104 + r * 11} r="1.7" />
          ))
        )}
      </g>

      {/* squiggle, right */}
      <path
        d="M356 96c14-10 26 2 18 12-7 9-20 1-13-9 8-11 27-6 33 6"
        stroke="#9FB6FF"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M300 40c10-6 19 1 15 8" stroke="#9FB6FF" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* chat bubble */}
      <g>
        <rect x="252" y="84" width="62" height="34" rx="17" fill="#fff" stroke="#E7E3DC" />
        <circle cx="271" cy="101" r="3.2" fill="#B9BECD" />
        <circle cx="283" cy="101" r="3.2" fill="#B9BECD" />
        <circle cx="295" cy="101" r="3.2" fill="#B9BECD" />
      </g>

      {/* sparkles */}
      <path d="M196 44l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8z" fill="#F5C960" />
      <path d="M232 66l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" fill="#F5C960" opacity="0.75" />

      {/* plant */}
      <path d="M88 156c-8-16-4-30 6-38 6 10 6 26-6 38z" fill="#4FAE7E" />
      <path d="M92 158c10-12 24-14 32-9-6 10-20 15-32 9z" fill="#3E9A6C" />
      <path d="M90 156c-12-6-22-2-26 5 8 6 20 5 26-5z" fill="#63C08F" />
      <path d="M74 158h36l-4 32a6 6 0 01-6 5H84a6 6 0 01-6-5l-4-32z" fill="#F2A65A" />
      <rect x="71" y="152" width="42" height="9" rx="4.5" fill="#FFB877" />

      {/* desk shadow */}
      <ellipse cx="222" cy="200" rx="112" ry="9" fill="#E9E3DA" />

      {/* laptop */}
      <path d="M176 192l10-42h74l10 42z" fill="#C9D2E4" />
      <rect x="170" y="190" width="106" height="8" rx="4" fill="#AEB9D0" />
      <rect x="205" y="192" width="36" height="3" rx="1.5" fill="#94A0BA" />

      {/* robot body */}
      <rect x="188" y="120" width="70" height="52" rx="20" fill="#2B3247" />
      <rect x="176" y="132" width="14" height="26" rx="7" fill="#3B435C" />
      <rect x="256" y="132" width="14" height="26" rx="7" fill="#3B435C" />

      {/* robot head */}
      <rect x="190" y="76" width="66" height="54" rx="22" fill="#2B3247" />
      <rect x="200" y="88" width="46" height="30" rx="15" fill="#171C2B" />
      <path d="M212 100c2.6 0 4.8 2.6 4.8 5.8" stroke="#63E0C6" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <path d="M229 105.8c0-3.2 2.2-5.8 4.8-5.8" stroke="#63E0C6" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <rect x="221" y="66" width="4" height="12" rx="2" fill="#2B3247" />
      <circle cx="223" cy="65" r="4.4" fill="#63E0C6" />

      {/* mug */}
      <rect x="128" y="170" width="26" height="22" rx="6" fill="#9E8BE8" />
      <path d="M154 175h6a5 5 0 010 10h-6" stroke="#9E8BE8" strokeWidth="3.5" fill="none" />
      <path d="M136 164c2-4-2-6 0-10M145 164c2-4-2-6 0-10" stroke="#CFC6F3" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  )
}
