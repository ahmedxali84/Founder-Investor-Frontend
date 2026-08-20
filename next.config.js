/** @type {import('next').NextConfig} */

// script-src/style-src need 'unsafe-inline' — Tailwind's inline `style={{...}}`
// usage (e.g. Dashboard's conic-gradient ring) and the theme-init script rely
// on it; removing it would need a nonce-based CSP this app doesn't have set
// up. Everything else here is locked down: no framing, no plugins,
// connect/img restricted to this origin plus the actual external hosts the
// app talks to (Supabase, Google Fonts, GitHub/ui-avatars avatar images,
// LinkedIn's media CDN for OAuth-verified profile photos).
// Dev-only: Next's Fast Refresh / dev-mode error overlay uses eval() for
// stack-frame reconstruction, which a strict script-src blocks (React itself
// never calls eval() in production, so prod keeps no 'unsafe-eval').
const isDev = process.env.NODE_ENV !== 'production'

// Derived from NEXT_PUBLIC_API_URL (the same env var apiClient.js/authApi.js
// etc. already read) rather than hardcoded, so connect-src always matches
// wherever the backend is actually deployed — e.g. Render — without needing
// a second value kept in sync by hand. Same-origin '/api' rewrite (local dev)
// needs nothing extra here since 'self' already covers it.
let backendOrigin = ''
try {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  if (/^https?:\/\//.test(apiUrl)) backendOrigin = new URL(apiUrl).origin
} catch {
  // Malformed NEXT_PUBLIC_API_URL — leave backendOrigin empty rather than
  // fail the build over it; the app's own apiClient.js already surfaces a
  // clear "can't reach the server" error at runtime in that case.
}

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://ui-avatars.com https://avatars.githubusercontent.com https://*.supabase.co https://media.licdn.com",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co${backendOrigin ? ` ${backendOrigin}` : ''}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
    ]
  },
  async rewrites() {
    // Local-dev convenience, matches the old vite.config.js proxy. In prod,
    // set NEXT_PUBLIC_API_URL to the backend's absolute URL instead —
    // lib/apiClient.js already falls back to relative '/api' when unset.
    return [{ source: '/api/:path*', destination: 'http://localhost:8000/api/:path*' }]
  },
}

module.exports = nextConfig
