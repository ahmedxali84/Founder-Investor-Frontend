'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// Single source of truth for the browser tab title — every route below
// must appear here or it falls back to the bare brand name.
export const PAGE_TITLES = {
  '/login': 'Log in',
  '/signup': 'Sign up',
  '/forgot-password': 'Forgot password',
  '/reset-password': 'Reset password',
  '/onboarding': 'Onboarding',
  '/dashboard': 'Dashboard',
  '/matches': 'Matches',
  '/search': 'Location Search',
  '/profile': 'Profile',
  '/ideas': 'Ideas',
  '/agents': 'AI Agents',
  '/messaging': 'Messages',
}

export function useDocumentTitle() {
  const pathname = usePathname()
  useEffect(() => {
    const label = PAGE_TITLES[pathname]
    document.title = label ? `Techflix — ${label}` : 'Techflix'
  }, [pathname])
}
