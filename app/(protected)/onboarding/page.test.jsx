import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Onboarding from './page.jsx'

// Regression test for the bug fixed earlier this session: Step 2's form and
// the "submitting" overlay used to co-render (both visible at once) instead
// of the overlay replacing the form, and the Back button stayed clickable
// mid-submit. See page.jsx's `step === 2 && !submitting` guard.

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/onboarding',
}))

vi.mock('../../../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 'test-user', user_metadata: { user_type: 'founder' } },
    accessToken: 'fake-token',
    signOut: vi.fn(),
  }),
}))

function renderOnboarding() {
  return render(<Onboarding />)
}

describe('Onboarding — founder step 2 submitting overlay', () => {
  beforeEach(() => {
    // /api/profile "already onboarded?" check — say no, so the form renders
    // instead of redirecting to /dashboard. The actual /founder/profile
    // submission is left pending deliberately so `submitting` stays true
    // for the assertion window below.
    global.fetch = vi.fn((url) => {
      if (String(url).includes('/profile') && !String(url).includes('/founder/profile')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ onboarded: false }) })
      }
      return new Promise(() => {}) // never resolves — keeps submitting=true
    })
  })

  it('replaces the step-2 form with the submitting overlay instead of co-rendering both', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    await waitFor(() => expect(screen.queryByText(/connect your linkedin/i)).toBeInTheDocument())

    // Step 1 -> Step 2: goToLinkedInStep requires both a valid LinkedIn URL
    // (no OAuth session in this test) and the pasted bio text — LinkedIn's
    // Sign In API never returns About/Experience content, verified or not.
    await user.type(screen.getByLabelText(/linkedin profile url/i), 'https://linkedin.com/in/testuser')
    await user.type(screen.getByLabelText(/paste your real linkedin about/i), 'Founder with 5 years building fintech products.')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => expect(screen.queryByText(/connect your github/i)).toBeInTheDocument())

    // Trigger the submit — the mocked fetch above never resolves, so
    // submitting stays true for us to assert against.
    await user.type(screen.getByLabelText(/github profile url/i), 'https://github.com/testuser')
    await user.click(screen.getByRole('button', { name: /complete & post your idea/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: /building your profile/i })).toBeInTheDocument())

    // The bug: step-2's own form (GitHub URL field, Back button) used to
    // still be in the DOM at the same time as this overlay.
    expect(screen.queryByLabelText(/github profile url/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^back$/i })).not.toBeInTheDocument()
  })
})

describe('Onboarding — recovers when /founder/profile errors but actually saved', () => {
  it('does not show an error when a follow-up /profile check confirms onboarding actually completed', async () => {
    const user = userEvent.setup()
    // Keyed off what actually happened, not call order — the page-load
    // "already onboarded?" pre-check may run more than once in a test
    // environment, so a simple call counter is fragile. Real behavior:
    // onboarded only flips true once the founder/profile POST below has
    // actually been attempted.
    let founderProfilePosted = false
    let recoveryCheckRan = false

    global.fetch = vi.fn((url) => {
      const urlStr = String(url)
      if (urlStr.includes('/founder/profile')) {
        founderProfilePosted = true
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ detail: 'Profile error — please try again.' }),
        })
      }
      if (urlStr.includes('/profile')) {
        if (founderProfilePosted) recoveryCheckRan = true
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ onboarded: founderProfilePosted }) })
      }
      return Promise.reject(new Error(`unexpected fetch in test: ${urlStr}`))
    })

    renderOnboarding()

    await waitFor(() => expect(screen.queryByText(/connect your linkedin/i)).toBeInTheDocument())

    await user.type(screen.getByLabelText(/linkedin profile url/i), 'https://linkedin.com/in/testuser')
    await user.type(screen.getByLabelText(/paste your real linkedin about/i), 'Founder with 5 years building fintech products.')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => expect(screen.queryByText(/connect your github/i)).toBeInTheDocument())

    await user.type(screen.getByLabelText(/github profile url/i), 'https://github.com/testuser')
    await user.click(screen.getByRole('button', { name: /complete & post your idea/i }))

    // Wait for the recovery check to actually run, then confirm the error
    // banner this used to show unconditionally never rendered.
    await waitFor(() => expect(recoveryCheckRan).toBe(true))
    expect(screen.queryByText(/profile error/i)).not.toBeInTheDocument()
  })
})
