/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FDF6EE',
        ink: '#1E2334',
        muted: '#6B7280',
        brand: {
          DEFAULT: '#2F6BFF',
          hover: '#2457DB',
          soft: '#EAF0FF',
        },
        line: '#E5E7EB',
        // In-app pages (Dashboard, Matches, Profile, Pitch Upload, Agents) use
        // this palette instead of `brand` — intentionally close in hue
        // (#2563EB vs #2F6BFF) so shared components (Notice, password meter)
        // never clash when they show up in both the pre-auth and in-app zones.
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          soft: '#EFF6FF',
        },
      },
      fontFamily: {
        // Inter — the same typeface family used across Google's and OpenAI's
        // product UIs, self-hosted via next/font/google (app/layout.jsx),
        // which exposes it as the --font-inter CSS variable rather than a
        // literal family name. System fonts stay as fallbacks for the brief
        // window before the webfont loads.
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      // App-wide typography scale. `-lg` variants are the upper end of the
      // size range, applied at a breakpoint (e.g. `text-hero xl:text-hero-lg`)
      // for the two most prominent, page-defining headings (hero, page title).
      // Everything else (card titles, nav, buttons, meta) uses a single fixed
      // size from within its range, matching how this codebase already sizes
      // that tier of text (no breakpoint variants on card/label-level text).
      fontSize: {
        hero: ['48px', { lineHeight: '1.05', fontWeight: '800' }],
        'hero-lg': ['64px', { lineHeight: '1.05', fontWeight: '800' }],
        page: ['32px', { lineHeight: '1.15', fontWeight: '700' }],
        'page-lg': ['40px', { lineHeight: '1.15', fontWeight: '700' }],
        title: ['20px', { lineHeight: '1.3', fontWeight: '700' }],
        body: ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        nav: ['14px', { lineHeight: '1.4', fontWeight: '600' }],
        btn: ['14px', { lineHeight: '1.4', fontWeight: '700' }],
        meta: ['13px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      boxShadow: {
        card: '0 24px 60px -20px rgba(30, 35, 52, 0.18), 0 4px 14px -6px rgba(30, 35, 52, 0.08)',
        // Softer, tighter elevation for in-app cards — one level up from
        // shadow-sm without jumping straight to `card`'s big hero shadow.
        soft: '0 8px 24px -10px rgba(15, 23, 42, 0.12), 0 2px 6px -2px rgba(15, 23, 42, 0.06)',
        glow: '0 0 0 1px rgba(37, 99, 235, 0.08), 0 8px 30px -8px rgba(37, 99, 235, 0.25)',
      },
      borderRadius: {
        xl2: '18px',
      },
      backgroundImage: {
        // Subtle accent gradient for hero/spotlight surfaces and primary CTAs —
        // used sparingly, not on every button, so it still reads as an accent.
        'accent-gradient': 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
        'brand-gradient': 'linear-gradient(135deg, #2F6BFF 0%, #6D5BFF 100%)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
