import { describe, it, expect, vi, beforeEach } from 'vitest'

// Regression coverage for a live user report: two different confirmed
// deals between the same founder/investor pair were sharing one merged
// chat thread. Root cause: conversations were looked up (and, before this
// session, stored) keyed only on (founder_user_id, investor_user_id) — the
// idea/deal itself was never part of the lookup, which was harmless back
// when a confirmed deal was permanent (there could only ever be one), but
// broke once deals could be marked complete and a second one confirmed
// between the same two people.

const mockMaybeSingle = vi.fn()
const mockIs = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockEqIdea = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockEqInvestor = vi.fn(() => ({ eq: mockEqIdea, is: mockIs, maybeSingle: mockMaybeSingle }))
const mockEqFounder = vi.fn(() => ({ eq: mockEqInvestor }))
const mockSelect = vi.fn(() => ({ eq: mockEqFounder }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('./supabaseClient.js', () => ({
  supabase: { from: (...args) => mockFrom(...args) },
}))

describe('getOrCreateConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMaybeSingle.mockResolvedValue({ data: { id: 'convo-1' }, error: null })
  })

  it('filters by idea_ref when one is provided, not just the founder/investor pair', async () => {
    const { getOrCreateConversation } = await import('./conversations.js')

    await getOrCreateConversation('founder-1', 'investor-1', 'idea-a')

    expect(mockEqFounder).toHaveBeenCalledWith('founder_user_id', 'founder-1')
    expect(mockEqInvestor).toHaveBeenCalledWith('investor_user_id', 'investor-1')
    expect(mockEqIdea).toHaveBeenCalledWith('idea_ref', 'idea-a')
    expect(mockIs).not.toHaveBeenCalled()
  })

  it('a different idea_ref for the same pair is a distinct lookup, not reused', async () => {
    const { getOrCreateConversation } = await import('./conversations.js')

    await getOrCreateConversation('founder-1', 'investor-1', 'idea-a')
    await getOrCreateConversation('founder-1', 'investor-1', 'idea-b')

    expect(mockEqIdea).toHaveBeenNthCalledWith(1, 'idea_ref', 'idea-a')
    expect(mockEqIdea).toHaveBeenNthCalledWith(2, 'idea_ref', 'idea-b')
  })

  it('falls back to an is-null idea_ref match when no ideaRef is passed', async () => {
    const { getOrCreateConversation } = await import('./conversations.js')

    await getOrCreateConversation('founder-1', 'investor-1')

    expect(mockIs).toHaveBeenCalledWith('idea_ref', null)
    expect(mockEqIdea).not.toHaveBeenCalled()
  })
})
