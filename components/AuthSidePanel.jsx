import { Logo, HandshakeIcon, ShieldIcon, CheckCircleIcon, StarIcon, RocketIcon } from './icons.jsx'

/**
 * Full-bleed left panel for the Login/Signup split layout — fills the whole
 * left half edge-to-edge (unlike <BrandPanel/>, which is a rounded card used
 * inside Onboarding's padded grid, so this stays a separate component rather
 * than reskinning that one out from under Onboarding).
 */

const FEATURES = [
  {
    Icon: RocketIcon,
    title: 'Multi-agent matching',
    body: 'Founders and investors are verified, ranked, and paired automatically.',
  },
  {
    Icon: HandshakeIcon,
    title: 'One exclusive match',
    body: 'No endless browsing — each side sees a single, MVP-ready top match at a time.',
  },
  {
    Icon: ShieldIcon,
    title: 'Verified, not invented',
    body: 'Every profile is backed by live GitHub and LinkedIn data. No fabricated stats.',
  },
]

export default function AuthSidePanel() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-cream dark:bg-slate-900">
      {/* soft warm blobs, same visual language as Onboarding */}
      <div className="pointer-events-none absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full bg-[#FBEEDD] dark:bg-slate-800/60" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 w-[420px] h-[420px] rounded-full bg-[#FDF1E3] dark:bg-slate-800/40" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.08]" style={{
        backgroundImage: 'radial-gradient(#E5DAC5 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="relative h-full flex flex-col justify-between p-10 xl:p-14">
        <Logo size="lg" showTagline={false} />

        <div className="py-8 max-w-[440px]">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-slate-800/70 ring-1 ring-black/5 dark:ring-white/10 px-3 py-1.5 backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11.5px] font-semibold text-ink/80 dark:text-slate-200">Where founders meet the right investor</span>
          </div>

          <h1 className="mt-5 text-hero xl:text-hero-lg tracking-[-0.02em] text-ink dark:text-slate-100">
            Real matches,
            <br />
            <span className="bg-gradient-to-r from-brand to-indigo-600 bg-clip-text text-transparent">
              verified by AI.
            </span>
          </h1>
          <p className="mt-3 max-w-[360px] text-[14px] leading-relaxed text-muted dark:text-slate-400">
            Kavan pairs startups and investors using live, verified data — so every introduction is one worth taking.
          </p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-white/10 shadow-sm text-brand">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <div>
                  <p className="text-[14px] font-bold text-ink dark:text-slate-100">{title}</p>
                  <p className="text-[12.5px] leading-snug text-muted dark:text-slate-400 max-w-[300px]">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="rounded-2xl bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-white/10 shadow-sm px-4 py-3.5 max-w-[380px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-ink dark:text-slate-100">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                Match confirmed · both opted in
              </div>
              <div className="flex items-center gap-0.5 text-amber-400">
                {[0, 1, 2, 3, 4].map((i) => (
                  <StarIcon key={i} className="w-3.5 h-3.5" />
                ))}
              </div>
            </div>
            <p className="mt-1.5 text-[11.5px] text-muted dark:text-slate-400">
              Founders and investors are meeting on Kavan every week.
            </p>
          </div>

          {/* Fiverr-style footer credit — company attribution tucked away as
              quiet fine print instead of competing with the Kavan logo up top. */}
          <p className="mt-6 text-[11px] text-muted dark:text-slate-400">
            © {new Date().getFullYear()} Kavan — a Techflix company.
          </p>
        </div>
      </div>
    </div>
  )
}
