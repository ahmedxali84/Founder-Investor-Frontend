import Link from 'next/link'
import { Logo } from '../components/icons.jsx'
import Reveal from '../components/Reveal.jsx'
import MobileNav from '../components/MobileNav.jsx'
import HeroMatchCard from '../components/HeroMatchCard.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import {
  RocketIcon, HandshakeIcon, ShieldIcon, DocIcon, BulbIcon, BriefcaseIcon,
  LinkedInMark, GitHubMark, RobotIcon, CheckCircleIcon, ArrowRightIcon,
} from '../components/icons.jsx'

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#founders', label: 'For Founders' },
  { href: '#investors', label: 'For Investors' },
]

export const metadata = {
  title: 'Kavan — Real matches, verified by AI',
  description:
    'Kavan pairs founders and investors using live, verified GitHub and LinkedIn data — one exclusive, MVP-ready match at a time, not a cold list to scroll through.',
}

/**
 * Public marketing page — the actual `/` route now, replacing the old
 * straight-to-/login redirect. Reuses the pre-auth zone's own design
 * language throughout (brand palette, .btn-primary-style buttons, the same
 * cream/dot-pattern background AuthSidePanel already uses, and — for the
 * hero copy and feature list specifically — the exact wording already
 * live on the login/signup side panel, so a visitor sees one consistent
 * voice from the very first screen through to signing in) rather than a
 * generic SaaS-template layout.
 *
 * Deliberately does NOT include: fake "trusted by" logos, a fabricated
 * stats bar, stock-photo testimonials, or a newsletter signup — Kavan is
 * early enough that none of those would be honest, and a marketing page
 * making up numbers/quotes undercuts the "verified, not invented" pitch
 * this product is actually selling.
 */

const FEATURES = [
  {
    Icon: RocketIcon,
    title: 'Multi-agent matching',
    body: 'A team of AI agents verifies, ranks, and pairs founders and investors automatically — no manual sourcing on either side.',
  },
  {
    Icon: HandshakeIcon,
    title: 'One exclusive match',
    body: 'No endless browsing. Each side sees a single, MVP-ready top match at a time — quality over an infinite feed.',
  },
  {
    Icon: ShieldIcon,
    title: 'Verified, not invented',
    body: 'Every profile is backed by live GitHub and LinkedIn data, and every MVP link is checked reachable. No fabricated stats.',
  },
  {
    Icon: DocIcon,
    title: 'Deal-ready tools',
    body: 'Once both sides opt in: real-time messaging, meeting confirmation, and an AI-drafted term sheet from your actual conversation.',
  },
]

const STEPS = [
  {
    Icon: null,
    title: 'Verify',
    body: 'Sign in with real LinkedIn (and GitHub, for founders) — your identity is confirmed, not just typed in.',
  },
  {
    Icon: BulbIcon,
    title: 'Post or set criteria',
    body: 'Founders post an idea and MVP link; investors set focus sectors and ticket size.',
  },
  {
    Icon: RobotIcon,
    title: 'Get matched',
    body: "Agents rank and pair you with one exclusive top match — the other side's best real fit.",
  },
  {
    Icon: HandshakeIcon,
    title: 'Connect & close',
    body: 'Message, confirm the meeting once both sides opt in, and generate a term sheet when you\'re ready.',
  },
]

function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-cream/90 dark:bg-slate-950/90 backdrop-blur border-b border-line/70 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <a href="#" aria-label="Back to top" className="shrink-0">
          <Logo />
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-nav text-ink/70 dark:text-slate-300 hover:text-ink dark:hover:text-white transition-colors">{l.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* "Log in" and the section links live inside the hamburger below
              `md` — the secondary nav links have nowhere else to go on
              mobile, so they get a real home instead of just vanishing.
              "Get Started" stays visible at every width: it's the one action
              this page actually wants a mobile visitor to take, and burying
              the only CTA behind a menu tap would cost more than it saves. */}
          <ThemeToggle className="hidden md:grid" />
          <Link href="/login" className="hidden md:inline-block text-nav text-ink dark:text-slate-100 px-2 sm:px-3 py-2 whitespace-nowrap hover:text-brand dark:hover:text-blue-400 transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 h-10 px-2 sm:px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-btn whitespace-nowrap shadow-glow transition-all active:scale-[0.98]"
          >
            Get Started
          </Link>
          <MobileNav links={NAV_LINKS} />
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full bg-[#FBEEDD] dark:bg-slate-800/60" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.08]" style={{
        backgroundImage: 'radial-gradient(#E5DAC5 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-2 gap-14 items-center">
        <Reveal className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-slate-800/70 ring-1 ring-black/5 dark:ring-white/10 px-3 py-1.5 backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11.5px] font-semibold text-ink/80 dark:text-slate-200">Where founders meet the right investor</span>
          </div>

          <h1 className="mt-5 text-[32px] leading-[1.1] font-extrabold sm:text-hero xl:text-hero-lg tracking-[-0.02em] text-ink dark:text-slate-100">
            Real matches,
            <br />
            <span className="bg-gradient-to-r from-brand to-indigo-600 bg-clip-text text-transparent">
              verified by AI.
            </span>
          </h1>
          <p className="mt-4 max-w-[440px] text-[15px] leading-relaxed text-muted dark:text-slate-400">
            Kavan pairs startups and investors using live, verified data — so every introduction is one worth taking.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-brand hover:bg-brand-hover text-white text-btn shadow-glow transition-all active:scale-[0.98]"
            >
              Get Started Free <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center h-12 px-6 rounded-xl border border-line dark:border-slate-700 bg-white dark:bg-slate-900 text-ink dark:text-slate-100 text-btn hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
            >
              I have an account
            </Link>
          </div>

          {/* Trust diagram — shows the verification chain rather than just
              naming it, since "verified, not invented" is a claim this page
              should back up visually, not only in a sentence. */}
          <div className="mt-8 inline-flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-slate-800/70 ring-1 ring-black/5 dark:ring-white/10 pl-1.5 pr-2.5 py-1">
              <LinkedInMark className="w-4 h-4 rounded" /> LinkedIn
            </span>
            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="w-4 border-t border-dashed border-line dark:border-slate-700" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-slate-800/70 ring-1 ring-black/5 dark:ring-white/10 pl-1.5 pr-2.5 py-1">
              <GitHubMark className="w-4 h-4 rounded [&>path]:fill-slate-500 dark:[&>path]:fill-slate-400" /> GitHub
            </span>
            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="w-4 border-t border-dashed border-line dark:border-slate-700" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 pl-2 pr-2.5 py-1">
              <ShieldIcon className="w-3.5 h-3.5" /> Verified match
            </span>
          </div>
        </Reveal>

        {/* Hero visual — an illustration of the product's actual pattern (one
            exclusive match, both sides opted in), not a stock photo of an
            unrelated meeting. Deliberately built from the same card/pill/
            icon language as the rest of the app, not a screenshot claim. A
            soft glow + a ghost card behind the real one give it depth
            instead of sitting flat on the page. */}
        <Reveal delay={150} variant="scale" className="relative min-w-0">
          <div className="pointer-events-none absolute -inset-6 bg-gradient-to-br from-brand/25 via-indigo-400/10 to-transparent blur-3xl rounded-[2.5rem]" />
          <div className="pointer-events-none absolute inset-x-6 -bottom-3 top-6 rounded-3xl bg-white/60 dark:bg-slate-800/40 ring-1 ring-black/5 dark:ring-white/10 rotate-2" />

          <HeroMatchCard />

          <div className="absolute -bottom-5 -left-5 hidden sm:flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-white/10 shadow-card px-4 py-3">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
              <RocketIcon className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">Agent 5 ranked this match</p>
              <p className="text-[10.5px] text-slate-400 dark:text-slate-400">just now</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function DualAudience() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
      <Reveal className="text-center max-w-xl mx-auto">
        <h2 className="text-page text-ink dark:text-slate-100 tracking-tight">Built for both sides of the table</h2>
        <p className="mt-2 text-[14.5px] text-muted dark:text-slate-400">One platform, two real jobs to do — Kavan doesn't make you pretend otherwise.</p>
      </Reveal>

      <div className="mt-10 grid sm:grid-cols-2 gap-6">
        <Reveal id="founders" variant="left" className="flex flex-col min-w-0 rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-black/5 dark:ring-white/10 shadow-sm p-7 scroll-mt-24">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-soft text-brand dark:bg-blue-500/10 dark:text-blue-400"><BulbIcon className="w-5 h-5" /></span>
          <h3 className="mt-4 text-title text-ink dark:text-slate-100">For Founders</h3>
          <ul className="mt-3 mb-5 space-y-2.5">
            {[
              'Connect LinkedIn + GitHub and post your idea — Agent 1 scopes your MVP and roadmap for you.',
              'Get matched with one exclusive, real investor at a time, not a cold list to cold-email.',
              'Unlock meetings once your MVP link is live and verified reachable.',
            ].map((t) => (
              <li key={t} className="flex gap-2.5 text-[13.5px] text-slate-600 dark:text-slate-300">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
          <Link
            href="/signup?role=founder"
            className="mt-auto self-start w-[250px] max-w-full inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-brand hover:bg-brand-hover text-white text-btn shadow-glow transition-all active:scale-[0.98]"
          >
            Post your idea <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </Reveal>

        <Reveal delay={120} id="investors" variant="right" className="flex flex-col min-w-0 rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-black/5 dark:ring-white/10 shadow-sm p-7 scroll-mt-24">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-soft text-brand dark:bg-blue-500/10 dark:text-blue-400"><BriefcaseIcon className="w-5 h-5" /></span>
          <h3 className="mt-4 text-title text-ink dark:text-slate-100">For Investors</h3>
          <ul className="mt-3 mb-5 space-y-2.5">
            {[
              'Set your firm, focus sectors, and ticket size — in whichever of 10 currencies you actually write checks in.',
              'See one exclusive top-ranked startup at a time, backed by real GitHub activity, not a pitch deck alone.',
              'Raise your hand on any founder-requested meeting, confirm, and move straight to a term sheet.',
            ].map((t) => (
              <li key={t} className="flex gap-2.5 text-[13.5px] text-slate-600 dark:text-slate-300">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
          <Link
            href="/signup?role=investor"
            className="mt-auto self-start w-[250px] max-w-full inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-brand hover:bg-brand-hover text-white text-btn shadow-glow transition-all active:scale-[0.98]"
          >
            Find your next investment <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section className="relative">
      {/* Soft gradient seams instead of hard borders on either side, so the
          page reads as one continuous flow rather than a stack of
          rectangles stapled together. */}
      <div className="pointer-events-none h-16 bg-gradient-to-b from-cream dark:from-slate-950 to-white dark:to-slate-900/60" />
      <div className="bg-white dark:bg-slate-900/60">
        <div className="max-w-6xl mx-auto px-6 pb-16 lg:pb-20">
          <Reveal className="text-center max-w-xl mx-auto">
            <h2 className="text-page text-ink dark:text-slate-100 tracking-tight">Why Kavan feels different</h2>
            <p className="mt-2 text-[14.5px] text-muted dark:text-slate-400">The same principles running under every match, every time.</p>
          </Reveal>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 90} variant="scale">
                {/* The hover/active response lives on this inner div, not on
                    Reveal's own element — Reveal already animates transform
                    (translate/scale) for the scroll-in effect via Tailwind's
                    shared --tw-translate-y custom property, and a second,
                    competing set of transform utilities on that SAME element
                    silently lost the cascade battle (confirmed: the hover
                    transform never took effect even though :hover matched).
                    Splitting the two onto separate elements avoids the clash
                    entirely. [-webkit-tap-highlight-color] turns off the
                    browser's own gray flash on tap, which otherwise muddies
                    this animation on mobile Chrome/Safari. */}
                <div className="cursor-pointer rounded-2xl p-6 bg-cream dark:bg-slate-800/60 ring-1 ring-black/5 dark:ring-white/10 shadow-sm [-webkit-tap-highlight-color:transparent] transition-all duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(15,23,42,0.25)] hover:ring-brand/20 dark:hover:ring-blue-400/20 active:translate-y-0 active:scale-[0.97] active:shadow-sm active:duration-75">
                  <span className="grid place-items-center w-10 h-10 rounded-xl shadow-sm bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-white/10 text-brand dark:text-blue-400">
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  <h3 className="mt-4 text-[14px] font-bold text-ink dark:text-slate-100">{title}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted dark:text-slate-400">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
      <div className="pointer-events-none h-16 bg-gradient-to-b from-white dark:from-slate-900/60 to-cream dark:to-slate-950" />
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-16 lg:py-20 scroll-mt-16">
      <Reveal className="text-center max-w-xl mx-auto">
        {/* text-brand-hover, not text-brand — at 11px bold directly on the
            cream background, text-brand's contrast ratio is 4.2:1, just
            under the 4.5:1 WCAG AA floor for text this small. */}
        <span className="text-[11px] font-bold text-brand-hover dark:text-blue-400 uppercase tracking-wider">How it works</span>
        <h2 className="mt-2 text-page text-ink dark:text-slate-100 tracking-tight">From sign-in to term sheet</h2>
      </Reveal>

      {/* A real timeline (one continuous line, circles sitting on it), not
          another row of boxed icon-cards — the Features section above
          already used that shape, so this one earns its own identity
          instead of repeating it a third time down the page. */}
      <div className="mt-14 relative">
        <div className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-brand/25 dark:border-blue-500/25" />
        <div className="lg:hidden absolute top-6 bottom-6 left-6 border-l-2 border-dashed border-brand/25 dark:border-blue-500/25" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-6">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 100} variant="left" className="relative flex items-start gap-4 lg:flex-col lg:items-center lg:gap-0 lg:text-center">
              <span className="relative z-10 grid place-items-center w-12 h-12 rounded-full bg-white dark:bg-slate-950 ring-2 ring-brand dark:ring-blue-500 text-brand dark:text-blue-400 shrink-0">
                {step.Icon ? <step.Icon className="w-5 h-5" /> : (
                  <span className="inline-flex -space-x-1">
                    <LinkedInMark className="w-3.5 h-3.5 rounded" />
                    <GitHubMark className="w-3.5 h-3.5 rounded [&>path]:fill-slate-600 dark:[&>path]:fill-slate-300" />
                  </span>
                )}
              </span>
              <div className="lg:mt-3">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400">STEP {i + 1}</p>
                <h3 className="text-[14.5px] font-bold text-ink dark:text-slate-100">{step.title}</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted dark:text-slate-400 lg:max-w-[220px]">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="max-w-6xl mx-auto px-6 pb-16 lg:pb-20">
      <Reveal variant="scale" className="relative overflow-hidden rounded-3xl bg-ink dark:bg-slate-900 ring-1 ring-black/5 dark:ring-white/10 px-8 py-14 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }} />
        <div className="relative">
          <h2 className="text-page-lg text-white tracking-tight">Ready to find your match?</h2>
          <p className="mt-3 text-[14.5px] text-white/60 max-w-md mx-auto">
            One exclusive introduction, verified from real data — not another list to scroll through.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-brand hover:bg-brand-hover text-white text-btn shadow-glow transition-all active:scale-[0.98]"
            >
              Get Started Free <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center h-12 px-6 rounded-xl border border-white/15 text-white text-btn hover:bg-white/5 transition-all"
            >
              Log in
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-line/70 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <Logo />
          <p className="text-[11px] text-muted dark:text-slate-400">© {new Date().getFullYear()} Kavan — a Techflix company.</p>
        </div>
        <nav className="flex items-center gap-6">
          <a href="#how-it-works" className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 hover:text-ink dark:hover:text-white transition-colors">How it works</a>
          <Link href="/login" className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 hover:text-ink dark:hover:text-white transition-colors">Log in</Link>
          <Link href="/signup" className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 hover:text-ink dark:hover:text-white transition-colors">Sign up</Link>
        </nav>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream dark:bg-slate-950">
      <Navbar />
      <main>
        <Hero />
        <DualAudience />
        <Features />
        <HowItWorks />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
