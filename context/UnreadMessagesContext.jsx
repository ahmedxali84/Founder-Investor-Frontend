'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './AuthContext.jsx'

const UnreadMessagesContext = createContext(null)

/**
 * Per-contact unread direct-message counts, derived from the server's
 * `read_at` column (see frontend/supabase/message_read_receipts.sql) —
 * previously this was tracked purely via a "last read" timestamp in
 * localStorage, which meant reading a conversation on one device/browser
 * never cleared the badge on another (or after clearing site data): nothing
 * about "read" was ever server-authoritative, only remembered locally.
 * Mounted once at the app root so the sidebar badge and the messages page
 * read the same counts off one subscription instead of each page keeping
 * its own tally that resets on navigation.
 */
export function UnreadMessagesProvider({ children }) {
  const { user } = useAuth()
  const [unreadCounts, setUnreadCounts] = useState({})

  useEffect(() => {
    if (!user || !supabase) {
      setUnreadCounts({})
      return
    }

    let cancelled = false

    async function recompute() {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('sender_id')
        .eq('recipient_id', user.id)
        .is('read_at', null)
      if (cancelled || error || !data) return
      const counts = {}
      for (const m of data) counts[m.sender_id] = (counts[m.sender_id] || 0) + 1
      setUnreadCounts(counts)
    }

    recompute()

    // Both a new message (read_at starts null) and a read-state change
    // (read_at flips from null to set — on this device or any other) need
    // to recompute the count. A full refetch on either event is simplest
    // and correct here; this app's per-user message volume doesn't warrant
    // delta bookkeeping against a locally-held row cache. No `filter:`
    // string — same pattern as useMeetingRequestsRealtime.js — relying on
    // direct_messages' own RLS to scope events to rows this user can see.
    const channel = supabase
      .channel('unread-direct-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
        if (payload.new.recipient_id === user.id) recompute()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages' }, (payload) => {
        if (payload.new.recipient_id === user.id) recompute()
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [user])

  const markContactRead = (contactId) => {
    if (!user || !contactId || !supabase) return
    // Optimistic clear so the badge doesn't sit stale for the round-trip —
    // the UPDATE event from mark_messages_read's own write (via the
    // subscription above) reconciles this against the server shortly after
    // regardless, on every device with this context mounted.
    setUnreadCounts((prev) => {
      if (!prev[contactId]) return prev
      const next = { ...prev }
      delete next[contactId]
      return next
    })

    supabase.rpc('mark_messages_read', { p_sender_id: contactId }).then(({ error }) => {
      if (error) console.error('Failed to mark messages read:', error.message)
    })
  }

  const value = {
    unreadCounts,
    unreadContactsCount: Object.keys(unreadCounts).length,
    markContactRead,
  }

  return <UnreadMessagesContext.Provider value={value}>{children}</UnreadMessagesContext.Provider>
}

export function useUnreadMessages() {
  const ctx = useContext(UnreadMessagesContext)
  if (!ctx) throw new Error('useUnreadMessages must be used inside <UnreadMessagesProvider>')
  return ctx
}
