import Script from 'next/script'
import Providers from './providers.jsx'
import './globals.css'

export const metadata = {
  title: 'Techflix',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
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
