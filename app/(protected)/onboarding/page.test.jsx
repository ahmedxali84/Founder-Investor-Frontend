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

    // Step 1 -> Step 2: a valid LinkedIn URL is required for goToLinkedInStep
    // to actually advance (no OAuth session in this test).
    await user.type(screen.getByLabelText(/linkedin profile url/i), 'https://linkedin.com/in/testuser')
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
