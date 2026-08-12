import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Regression test for the race condition fixed earlier this session:
// handleSendMessage's success handler used to merge the just-sent message
// into whatever `conversation` state happened to be current, with no check
// against which contact is actually open — so switching contacts while a
// send was still in flight could attach a message meant for contact A onto
// contact B's now-open thread. See the `selectedIdRef.current === selectedId`
// guard in page.jsx's handleSendMessage.

const AUTH_USER = { id: 'me', email: 'me@test.local', user_metadata: { full_name: 'Me' } }
const CONTACT_A = { id: 'contact-a', full_name: 'Contact A', email: 'a@test.local' }
const CONTACT_B = { id: 'contact-b', full_name: 'Contact B', email: 'b@test.local' }

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/messaging',
}))
vi.mock('../../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: AUTH_USER }),
}))
vi.mock('../../../context/UnreadMessagesContext.jsx', () => ({
  useUnreadMessages: () => ({ unreadCounts: {}, markContactRead: vi.fn() }),
}))
vi.mock('../../../hooks/useAgentStatus.js', () => ({
  useAgentStatus: () => ({
    loading: false, userType: 'founder', userName: 'Me', userRole: 'Founder',
    avatarUrl: null, signOut: vi.fn(),
  }),
}))
vi.mock('../../../components/AppShell.jsx', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

function makeChainable(resolver) {
  const state = { op: 'select' }
  const chain = {
    select: () => chain,
    eq: () => chain,
    neq: () => chain,
    or: (expr) => { state.orExpr = expr; return chain },
    order: () => chain,
    single: () => chain,
    upsert: () => Promise.resolve({ data: null, error: null }),
    insert: (payload) => {
      state.op = 'insert'
      state.payload = Array.isArray(payload) ? payload[0] : payload
      return chain
    },
    then: (resolve, reject) => resolver(state).then(resolve, reject),
  }
  return chain
}

describe('MessagingPage — conversation-switch race', () => {
  let resolveSendA
  let supabaseMock

  beforeEach(() => {
    resolveSendA = null

    const messagesByContact = {
      [CONTACT_A.id]: [{ id: 'm-a-1', sender_id: CONTACT_A.id, recipient_id: AUTH_USER.id, text: 'hi from A', created_at: '2026-01-01T00:00:00Z' }],
      [CONTACT_B.id]: [{ id: 'm-b-1', sender_id: CONTACT_B.id, recipient_id: AUTH_USER.id, text: 'hi from B', created_at: '2026-01-01T00:00:01Z' }],
    }
    const allMessages = [...messagesByContact[CONTACT_A.id], ...messagesByContact[CONTACT_B.id]]

    supabaseMock = {
      from: (table) =>
        makeChainable(async (state) => {
          if (table === 'profiles') {
            if (state.op === 'select') return { data: [CONTACT_A, CONTACT_B], error: null }
            return { data: null, error: null }
          }
          if (table === 'direct_messages') {
            if (state.op === 'insert') {
              // Deliberately left pending — the test resolves this manually
              // after switching conversations, to reproduce the race window.
              return new Promise((resolve) => {
                resolveSendA = () =>
                  resolve({
                    data: { id: 'm-a-sent', sender_id: AUTH_USER.id, recipient_id: state.payload.recipient_id, text: state.payload.text, created_at: '2026-01-01T00:10:00Z' },
                    error: null,
                  })
              })
            }
            // Two distinct select shapes hit this table: the init effect's
            // "all my messages" query (a flat sender/recipient .or(), used
            // only to seed the sidebar's last-message preview) and the
            // per-conversation effect's "and(...),and(...)" .or() (used to
            // populate whichever thread is actually open) — must return
            // only that contact's messages, or switching to contact B would
            // incorrectly load contact A's messages into B's thread too,
            // making the test unable to tell which contact's messages are
            // actually showing.
            const expr = state.orExpr || ''
            if (expr.includes(`and(`)) {
              const contactId = expr.includes(CONTACT_A.id) ? CONTACT_A.id : CONTACT_B.id
              return { data: messagesByContact[contactId], error: null }
            }
            return { data: allMessages, error: null }
          }
          return { data: [], error: null }
        }),
      channel: () => {
        const ch = { on: () => ch, subscribe: (cb) => { cb?.('SUBSCRIBED'); return ch } }
        return ch
      },
      removeChannel: () => {},
    }
  })

  it('does not attach a message meant for contact A onto contact B\'s now-open thread', async () => {
    vi.resetModules()
    vi.doMock('../../../lib/supabaseClient.js', () => ({ supabase: supabaseMock }))
    const { default: MessagingPageFresh } = await import('./page.jsx')

    const user = userEvent.setup()
    render(<MessagingPageFresh />)

    // Open contact A's thread and send a message — the send is left pending.
    await waitFor(() => expect(screen.getByRole('button', { name: /contact a/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /contact a/i }))
    await waitFor(() => expect(screen.getByPlaceholderText(/message contact a/i)).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText(/message contact a/i), 'hello A')
    await user.click(screen.getByRole('button', { name: /^send$/i }))

    // Switch to contact B while A's send is still unresolved.
    await user.click(screen.getByRole('button', { name: /contact b/i }))
    await waitFor(() => expect(screen.getByPlaceholderText(/message contact b/i)).toBeInTheDocument())

    // Now let A's send resolve.
    expect(resolveSendA).toBeTruthy()
    resolveSendA()

    // Give React time to process the resolved promise's state update — a
    // plain waitFor() poll wasn't reliably catching this without an explicit
    // macrotask tick first, since the promise resolves outside of any
    // testing-library-tracked interaction.
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Scoped to the message-thread area specifically (the composer form's
    // previous sibling) — NOT the whole document. "hello A" legitimately
    // still appears elsewhere on the page (contact A's own last-message
    // preview in the sidebar correctly still shows it, regardless of which
    // conversation is currently open) — the bug this test guards against is
    // specifically about it leaking into the wrong THREAD, not existing
    // anywhere on the page at all.
    const composerForm = screen.getByPlaceholderText(/message contact b/i).closest('form')
    const messageThread = within(composerForm.previousElementSibling)

    await waitFor(() => expect(messageThread.queryByText(/hello a/i)).not.toBeInTheDocument())
    expect(messageThread.getByText(/hi from b/i)).toBeInTheDocument()
  })
})
