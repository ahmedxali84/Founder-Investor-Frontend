import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import FounderMatchesView from './FounderMatchesView.jsx'

// Regression coverage for a live user report: a new investor's raised hand
// showed up on the Overview dashboard but not on the Matches page. Root
// cause: marking a deal "Done" (completeDeal) frees the investor up to be
// matched again, but current_match itself is never reset — the Matches
// page kept the finished deal's spotlight showing forever, and the
// fallback that surfaces real new interest only ever ran when
// current_match was completely empty, so it stayed hidden underneath a
// stale, already-completed match.

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { id: 'founder-1' }, accessToken: 'fake-token' }),
}))
vi.mock('./MvpGateBanner.jsx', () => ({ default: () => null }))
vi.mock('./CurrentMatchSpotlight.jsx', () => ({
  default: () => <div data-testid="current-match-spotlight">Stale completed match</div>,
}))
vi.mock('./RealtimeChatPanel.jsx', () => ({ default: () => null }))
vi.mock('./ChatAndAgreementBar.jsx', () => ({ default: () => null }))
vi.mock('./TermSheetModal.jsx', () => ({ default: () => null }))

describe('FounderMatchesView — new interest after a deal completes', () => {
  it('shows a new investor\'s raised hand instead of the stale completed match spotlight', () => {
    const completedInvestor = { id: 'inv_old', name: 'Old Investor', owner_user_id: 'old-owner' }
    const newInvestorSlot = {
      id: 'inv_new',
      investor_raised: true,
      both_opted_in: false,
      investor: { id: 'inv_new', name: 'New Investor' },
    }

    render(
      <FounderMatchesView
        mvpUrlValid
        currentMatch={{ investor: completedInvestor }}
        meetingRequests={[
          { id: 'inv_old', both_opted_in: true, completed: true, investor: completedInvestor },
          newInvestorSlot,
        ]}
        founderDomain="AI"
        myIdeaId="idea_1"
        onRefetch={() => {}}
      />
    )

    expect(screen.queryByTestId('current-match-spotlight')).not.toBeInTheDocument()
    expect(screen.getByText(/interested investor/i)).toBeInTheDocument()
  })

  it('still shows the current match spotlight when it is not completed', () => {
    const activeInvestor = { id: 'inv_active', name: 'Active Investor', owner_user_id: 'active-owner' }

    render(
      <FounderMatchesView
        mvpUrlValid
        currentMatch={{ investor: activeInvestor }}
        meetingRequests={[{ id: 'inv_active', both_opted_in: true, completed: false, investor: activeInvestor }]}
        founderDomain="AI"
        myIdeaId="idea_1"
        onRefetch={() => {}}
      />
    )

    expect(screen.getByTestId('current-match-spotlight')).toBeInTheDocument()
  })
})
