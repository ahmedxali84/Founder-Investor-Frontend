import Link from 'next/link'
import { Logo } from '../components/icons.jsx'
import Reveal from '../components/Reveal.jsx'
import MobileNav from '../components/MobileNav.jsx'
import NavDropdown from '../components/NavDropdown.jsx'
import HeroMatchCard from '../components/HeroMatchCard.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import {
  RocketIcon, HandshakeIcon, ShieldIcon, DocIcon, BulbIcon, BriefcaseIcon,
  LinkedInMark, GitHubMark, RobotIcon, CheckCircleIcon, ArrowRightIcon,
  LockIcon, TrashIcon,
} from '../components/icons.jsx'

const NAV_LINKS = [
  {
    label: 'Why Kavan',
    intro: 'See how real profiles, one real match, and real deals actually work.',
    // Pre-rendered elements, not raw component references — NavDropdown is
    // a Client Component, and a Server Component (this file exports
    // `metadata`) can't pass a function prop like Icon across that boundary.
    // A React element built here is plain serializable JSX, so that part
    // still works fine.
    dropdown: [
      { href: '#about', label: 'About', description: 'The 2-minute explainer', icon: <BulbIcon className="w-4 h-4" /> },
      { href: '#benefits', label: 'Benefits', description: 'What you actually get', icon: <HandshakeIcon className="w-4 h-4" /> },
      { href: '#why-different', label: "Why it's different", description: 'Verified, not invented', icon: <ShieldIcon className="w-4 h-4" /> },
      { href: '#privacy-trust', label: 'Privacy & Trust', description: 'Your data, protected — for real', icon: <LockIcon className="w-4 h-4" /> },
    ],
  },
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
          {NAV_LINKS.map((l) =>
            l.dropdown ? (
              <NavDropdown key={l.label} label={l.label} intro={l.intro} items={l.dropdown} />
            ) : (
              <a key={l.href} href={l.href} className="text-nav text-ink/70 dark:text-slate-300 hover:text-ink dark:hover:text-white transition-colors">{l.label}</a>
            )
          )}
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

const ABOUT_ITEMS = [
  {
    Icon: ShieldIcon,
    title: 'Real people, not made-up profiles',
    body: "When you sign up, you log in with your actual LinkedIn (founders also connect GitHub). You don't just type in your own bio — Kavan pulls live data straight from those accounts, so nobody can fake their experience, skills, or work history.",
  },
  {
    Icon: HandshakeIcon,
    title: 'One good match, not a hundred to sift through',
    body: "Most platforms hand you a giant list and leave you to figure out who's worth messaging. Kavan does that work for you — AI agents look at your idea (or your investment criteria) and hand you the one person who's genuinely a strong fit. Not right? Pass, and it shows you the next best one.",
  },
  {
    Icon: DocIcon,
    title: 'From your first "hello" to a real deal',
    body: "Once both sides say yes to meeting, a private chat opens up — no email back-and-forth needed. When you're ready to talk terms, Kavan's AI can even draft a starting term sheet based on what you actually discussed, so you're not writing that from a blank page.",
  },
]

/**
 * Plain-language "what is this, actually" explainer — sits right after the
 * Hero's punchy tagline and before the more detailed Features/HowItWorks
 * sections below, for a visitor who wants the concept spelled out in one
 * breath before getting into specifics. Linked from the navbar (#about) so
 * it's reachable in one click, same as How It Works/Founders/Investors.
 */
function AboutKavan() {
  return (
    <section id="about" className="max-w-6xl mx-auto px-6 py-16 lg:py-20 scroll-mt-24">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <Reveal>
          <span className="text-[11px] font-bold text-brand-hover dark:text-blue-400 uppercase tracking-wider">What is Kavan?</span>
          <h2 className="mt-2 text-page md:text-page-lg text-ink dark:text-slate-100 tracking-tight">
            Where startup founders and investors actually find each other
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted dark:text-slate-400">
            Kavan connects two kinds of people: <strong className="text-ink dark:text-slate-200 font-semibold">founders</strong> building
            a startup, and <strong className="text-ink dark:text-slate-200 font-semibold">investors</strong> looking to fund one. Normally,
            finding the right person means cold emails, guesswork, and hoping someone's profile isn't exaggerated. Kavan skips all of
            that — it verifies who you both really are, then its AI figures out who you'd actually be a good fit for, and introduces
            you to just that one person at a time.
          </p>
        </Reveal>
        <Reveal delay={120} variant="scale" className="relative">
          {/* Same soft glow treatment as the Hero's own photo card above —
              ties this section back to the page's opening visual instead of
              the photo just sitting flat on the cream background. */}
          <div className="pointer-events-none absolute -inset-5 bg-gradient-to-br from-brand/20 via-indigo-400/10 to-transparent blur-2xl rounded-[2.5rem]" />
          <div className="relative rounded-3xl overflow-hidden shadow-card ring-1 ring-black/5 dark:ring-white/10 aspect-[5/3]">
            <img
              src="/about-match-scene.webp"
              alt="A founder and an investor talking at a table, with floating Founder and Investor profile cards connected by a verified match badge above them"
              className="w-full h-full object-cover"
            />
          </div>
        </Reveal>
      </div>

      <div className="mt-14 space-y-5">
        {ABOUT_ITEMS.map(({ Icon, title, body }, i) => (
          <Reveal key={title} delay={i * 100} variant="left">
            <div className="flex items-start gap-4 rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-black/5 dark:ring-white/10 shadow-sm p-5">
              <span className="shrink-0 grid place-items-center w-11 h-11 rounded-xl bg-brand-soft text-brand dark:bg-blue-500/10 dark:text-blue-400">
                <Icon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-[15px] font-bold text-ink dark:text-slate-100">{title}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted dark:text-slate-400">{body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={300} className="mt-8 max-w-2xl">
        <p className="text-[13.5px] leading-relaxed text-muted dark:text-slate-400 italic">
          In short: Kavan is matchmaking for startups and investors — verified, focused on one real fit at a time,
          and built to actually go somewhere instead of sitting in an inbox.
        </p>
      </Reveal>
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

const BENEFITS_FOUNDERS = [
  'Investors come to you once you’re ready — no more cold emailing them.',
  'You get noticed for your real work (GitHub, your MVP), not just a fancy pitch.',
  'You’re told exactly what to build next.',
  'No wasted meetings — the investor already likes your idea before you talk.',
]

const BENEFITS_INVESTORS = [
  'No inbox full of random pitches.',
  'You only see real startups with real work already done.',
  'You’re shown one strong match at a time, not a big pile to sort through.',
  'A fast path from a first chat to paperwork, with AI help writing the term sheet.',
]

/**
 * "What you actually get" — deliberately distinct from Features below, which
 * covers what the product DOES (multi-agent matching, verified data, ...).
 * This is the outcome-framed version of the same facts, split by role like
 * DualAudience above, so a visitor sees the personal payoff right after
 * seeing which side of the table they're on.
 */
function Benefits() {
  return (
    <section id="benefits" className="max-w-6xl mx-auto px-6 py-16 lg:py-20 scroll-mt-24">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <Reveal variant="left" className="lg:order-2">
          {/* Emerald, not the usual blue brand-hover — echoes the Kavan
              mark's own green pineapple leaves visible in the photo's
              center badge, and is already this site's established
              "verified" accent color (CheckCircleIcon, MVP Ready, ...)
              rather than an invented new one. */}
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Why join</span>
          <h2 className="mt-2 text-page text-ink dark:text-slate-100 tracking-tight">What you actually get</h2>
          <p className="mt-2 text-[14.5px] text-muted dark:text-slate-400">Not features — the real difference it makes for you.</p>
        </Reveal>
        <Reveal delay={120} variant="scale" className="relative lg:order-1">
          {/* Same soft glow treatment as the About section's photo card above
              (and the Hero's before that) — one consistent visual language
              for every photo on this page, not a one-off overlay banner. */}
          <div className="pointer-events-none absolute -inset-5 bg-gradient-to-br from-brand/20 via-indigo-400/10 to-transparent blur-2xl rounded-[2.5rem]" />
          <div className="relative rounded-3xl overflow-hidden shadow-card ring-1 ring-black/5 dark:ring-white/10 aspect-[5/3]">
            <img
              src="/benefits-match-scene.webp"
              alt="A founder's desk with a laptop and a Kavan mug, with floating Founder and Investor profile cards connected through the Kavan pineapple mark above it"
              className="w-full h-full object-cover"
            />
          </div>
        </Reveal>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-6">
        <Reveal variant="left" className="rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-black/5 dark:ring-white/10 shadow-sm p-7">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-soft text-brand dark:bg-blue-500/10 dark:text-blue-400"><BulbIcon className="w-5 h-5" /></span>
          <h3 className="mt-4 text-title text-ink dark:text-slate-100">If you're a founder</h3>
          <ul className="mt-3 space-y-2.5">
            {BENEFITS_FOUNDERS.map((t) => (
              <li key={t} className="flex gap-2.5 text-[13.5px] text-slate-600 dark:text-slate-300">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120} variant="right" className="rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-black/5 dark:ring-white/10 shadow-sm p-7">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-soft text-brand dark:bg-blue-500/10 dark:text-blue-400"><BriefcaseIcon className="w-5 h-5" /></span>
          <h3 className="mt-4 text-title text-ink dark:text-slate-100">If you're an investor</h3>
          <ul className="mt-3 space-y-2.5">
            {BENEFITS_INVESTORS.map((t) => (
              <li key={t} className="flex gap-2.5 text-[13.5px] text-slate-600 dark:text-slate-300">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="why-different" className="relative scroll-mt-24">
      {/* Soft gradient seams instead of hard borders on either side, so the
          page reads as one continuous flow rather than a stack of
          rectangles stapled together. */}
      <div className="pointer-events-none h-16 bg-gradient-to-b from-cream dark:from-slate-950 to-white dark:to-slate-900/60" />
      <div className="bg-white dark:bg-slate-900/60">
        <div className="max-w-6xl mx-auto px-6 pb-16 lg:pb-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <Reveal>
              <h2 className="text-page text-ink dark:text-slate-100 tracking-tight">Why Kavan feels different</h2>
              <p className="mt-2 text-[14.5px] text-muted dark:text-slate-400">The same principles running under every match, every time.</p>
            </Reveal>
            <Reveal delay={120} variant="scale" className="relative">
              {/* Same glow-card treatment as About/Benefits' photos — one
                  consistent visual language for every photo on this page. */}
              <div className="pointer-events-none absolute -inset-5 bg-gradient-to-br from-brand/20 via-indigo-400/10 to-transparent blur-2xl rounded-[2.5rem]" />
              <div className="relative rounded-3xl overflow-hidden shadow-card ring-1 ring-black/5 dark:ring-white/10 aspect-[5/3]">
                <img
                  src="/why-different-scene.webp"
                  alt="A blue verified shield with a checkmark, next to a faded rejected X card, on a desk with a 'Good Principles Build Great Matches' poster behind it"
                  className="w-full h-full object-cover"
                />
              </div>
            </Reveal>
          </div>

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

const PRIVACY_ITEMS = [
  {
    Icon: LockIcon,
    title: 'Your identity stays private until you both say yes',
    body: "Neither side sees who the other actually is — just a confidential match — until a meeting is confirmed on both ends. No browsing to peek at who's who.",
  },
  {
    Icon: TrashIcon,
    title: "Delete your account anytime — and it's actually gone",
    body: 'One confirmed click permanently removes your account, ideas or shortlist, matches, meeting requests, and every message you’re part of. Nothing lingers behind.',
  },
  {
    Icon: ShieldIcon,
    title: 'Only you — and whoever you’re matched with — can see your data',
    body: "Your private details aren't visible to random visitors, or to other users you haven't actually been matched or messaged with.",
  },
]

/**
 * Deliberately doesn't repeat "profiles are real, verified" — that's already
 * covered by AboutKavan and Features above. This is specifically about data
 * handling: who can see what, and what happens when you leave. Every claim
 * here is real, enforced behavior (see DeleteAccountModal.jsx, the
 * confidential-match rendering in components/matches/*, and supabase/
 * schema.sql's RLS policies) — nothing here is a generic trust badge.
 */
function PrivacyTrust() {
  return (
    <section id="privacy-trust" className="max-w-6xl mx-auto px-6 py-16 lg:py-20 scroll-mt-24">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <Reveal variant="scale" className="relative">
          {/* Same glow-card treatment as every other photo on this page. */}
          <div className="pointer-events-none absolute -inset-5 bg-gradient-to-br from-brand/20 via-indigo-400/10 to-transparent blur-2xl rounded-[2.5rem]" />
          <div className="relative rounded-3xl overflow-hidden shadow-card ring-1 ring-black/5 dark:ring-white/10 aspect-[5/3]">
            <img
              src="/privacy-trust-scene.webp"
              alt="A laptop showing Kavan's privacy settings — private until both say yes, delete anytime, only you decide — next to a glowing shield and padlock"
              className="w-full h-full object-cover"
            />
          </div>
        </Reveal>
        <Reveal delay={120}>
          <span className="text-[11px] font-bold text-brand-hover dark:text-blue-400 uppercase tracking-wider">Privacy &amp; Trust</span>
          <h2 className="mt-2 text-page text-ink dark:text-slate-100 tracking-tight">Built to protect you, not just promise to</h2>
          <p className="mt-2 text-[14.5px] text-muted dark:text-slate-400">What actually happens with your data — not a vague "we take privacy seriously" line.</p>
        </Reveal>
      </div>

      <div className="mt-10 grid sm:grid-cols-3 gap-5">
        {PRIVACY_ITEMS.map(({ Icon, title, body }, i) => (
          <Reveal key={title} delay={i * 100} variant="scale">
            <div className="h-full rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-black/5 dark:ring-white/10 shadow-sm p-6">
              <span className="grid place-items-center w-11 h-11 rounded-2xl bg-accent-gradient text-white shadow-sm">
                <Icon className="w-[18px] h-[18px]" />
              </span>
              <h3 className="mt-4 text-[14.5px] font-bold text-ink dark:text-slate-100">{title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted dark:text-slate-400">{body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-16 lg:py-20 scroll-mt-16">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <Reveal>
          {/* text-brand-hover, not text-brand — at 11px bold directly on the
              cream background, text-brand's contrast ratio is 4.2:1, just
              under the 4.5:1 WCAG AA floor for text this small. */}
          <span className="text-[11px] font-bold text-brand-hover dark:text-blue-400 uppercase tracking-wider">How it works</span>
          <h2 className="mt-2 text-page text-ink dark:text-slate-100 tracking-tight">From sign-in to term sheet</h2>
        </Reveal>
        <Reveal delay={120} variant="scale" className="relative">
          {/* Same glow-card treatment as every other photo on this page. */}
          <div className="pointer-events-none absolute -inset-5 bg-gradient-to-br from-brand/20 via-indigo-400/10 to-transparent blur-2xl rounded-[2.5rem]" />
          {/* aspect-[4/3], not [5/3] like the others — this photo is a
              vertically-held phone shot, not a wide desk scene, so the
              wider ratio would crop off the top/bottom of the phone screen. */}
          <div className="relative rounded-3xl overflow-hidden shadow-card ring-1 ring-black/5 dark:ring-white/10 aspect-[4/3] max-w-[360px] mx-auto lg:max-w-none">
            <img
              src="/how-it-works-scene.webp"
              alt="A phone showing the Kavan sign-in screen with Continue with LinkedIn and Continue with GitHub buttons, next to a laptop showing the Kavan landing page"
              className="w-full h-full object-cover"
            />
          </div>
        </Reveal>
      </div>

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

const TRUST_PHOTOS = [
  {
    src: '/trust-intro.jpg',
    alt: 'Two founders and investors shaking hands, with their teams standing behind them',
    tag: 'Meet',
    ratio: 'aspect-[3/2]',
    caption: 'Real introductions, not cold outreach',
    sub: 'Every match starts with agents pairing you to someone worth meeting.',
  },
  {
    src: '/trust-collab.jpg',
    alt: 'A founding team gathered around a laptop, reviewing their product together',
    tag: 'Build',
    ratio: 'aspect-video',
    caption: "Real collaboration once you're matched",
  },
  {
    src: '/trust-close.jpg',
    alt: 'An investor and founder shaking hands to close a deal',
    tag: 'Close',
    ratio: 'aspect-video',
    caption: 'Real deals, closed on your terms',
  },
]

/**
 * Bento photo grid tying the marketing page back to what a match actually
 * leads to. Tint overlay pulls these (originally teal/gold) photos toward
 * the brand's blue/indigo so they don't clash with every button and badge
 * on the page — same trick as the Hero's own glow, just applied on top of a
 * photo instead of behind a card. Word tags (Meet/Build/Close), not numbers
 * — this sits directly under How It Works' own STEP 1-4 circles, and a
 * second 01/02/03 sequence there read as a confusing continuation of it.
 */
function TrustPhotoCard({ photo, delay, variant }) {
  return (
    <Reveal delay={delay} variant={variant} className="group relative rounded-3xl overflow-hidden shadow-card ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(15,23,42,0.25)]">
      <div className={`${photo.ratio} overflow-hidden`}>
        <img
          src={photo.src}
          alt={photo.alt}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(45,102,242,.4)_0%,rgba(79,70,229,.2)_55%,rgba(45,102,242,0)_100%)] dark:bg-[linear-gradient(135deg,rgba(91,140,255,.34)_0%,rgba(129,140,248,.22)_55%,rgba(91,140,255,0)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(2,6,23,.78)_0%,rgba(2,6,23,.32)_38%,transparent_68%)]" />
      <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-slate-950/55 backdrop-blur-sm ring-1 ring-white/35 text-white text-[10.5px] font-extrabold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {photo.tag}
      </span>
      <p className="absolute left-5 right-5 bottom-[18px] text-white font-bold text-[15px] leading-snug [text-shadow:0_1px_12px_rgba(0,0,0,0.25)]">
        {photo.caption}
        {photo.sub && <span className="block mt-1 text-[12.5px] font-medium text-white/80">{photo.sub}</span>}
      </p>
    </Reveal>
  )
}

function Trust() {
  const [lead, ...rest] = TRUST_PHOTOS
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-16 right-0 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(45,102,242,0.18)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(91,140,255,0.16)_0%,transparent_70%)] blur-2xl" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-[0.35] dark:opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(#E5DAC5 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 60% 100% at 50% 0%, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 100% at 50% 0%, black 0%, transparent 75%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 py-16 lg:py-20">
        <Reveal className="text-center max-w-xl mx-auto">
          <span className="text-[11px] font-bold text-brand-hover dark:text-blue-400 uppercase tracking-wider">After the match</span>
          <h2 className="mt-2 text-page text-ink dark:text-slate-100 tracking-tight">Where matches become deals</h2>
          <p className="mt-2 text-[14.5px] text-muted dark:text-slate-400">What happens once the algorithm makes the introduction.</p>
        </Reveal>

        <div className="mt-10">
          <TrustPhotoCard photo={lead} delay={0} variant="scale" />
          <div className="mt-4 md:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            {rest.map((photo, i) => (
              <TrustPhotoCard key={photo.tag} photo={photo} delay={(i + 1) * 90} variant="up" />
            ))}
          </div>
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
          {/* Two role-specific buttons, not one generic "Get Started Free" —
              by this point in the page a visitor already knows which side
              of the table they're on (the whole page has been split that
              way since DualAudience), so asking them to pick a role again
              after clicking through just adds a step this CTA can skip. */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup?role=founder"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-brand hover:bg-brand-hover text-white text-btn shadow-glow transition-all active:scale-[0.98]"
            >
              <RocketIcon className="w-4 h-4" /> I'm a Founder <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link
              href="/signup?role=investor"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl border border-white/15 text-white text-btn hover:bg-white/5 transition-all active:scale-[0.98]"
            >
              <BriefcaseIcon className="w-4 h-4" /> I'm an Investor <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
          <p className="mt-5 text-[12.5px] text-white/50">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-white hover:underline">Log in</Link>
          </p>
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
        <AboutKavan />
        <DualAudience />
        <Benefits />
        <Features />
        <PrivacyTrust />
        <HowItWorks />
        <Trust />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
