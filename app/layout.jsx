import Script from 'next/script'
import { Inter } from 'next/font/google'
import Providers from './providers.jsx'
import './globals.css'

// Self-hosted via next/font (rather than a <link> to Google Fonts) so the
// font ships from this origin with the rest of the build instead of being a
// separate render-blocking request — Lighthouse flagged the old <link>
// approach as ~730ms of render-blocking time. `variable` exposes it as
// --font-inter for tailwind.config.js's fontFamily.sans, since next/font
// doesn't register a literal 'Inter' family name the way the Google Fonts
// stylesheet did.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'Kavan',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/*
          Applies the dark class before first paint, mirroring
          ThemeContext.jsx's loadInitialTheme() (same 'techflix_theme'
          localStorage key) — ThemeProvider only sets this class in a
          useEffect, which runs after React hydrates and the browser has
          already painted the default (light) markup, so every load/reload
          for a dark-mode user would flash light-then-dark without this.
          beforeInteractive runs before hydration, matching the old
          index.html blocking <script>.
        */}
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function () {
            try {
              var stored = localStorage.getItem('techflix_theme')
              var dark = stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
              if (dark) document.documentElement.classList.add('dark')
            } catch (e) {}
          })()
        `}</Script>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
