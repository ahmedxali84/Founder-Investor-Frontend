'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient.js'

/**
 * Push-triggered instant refetch on top of useAgentStatus's existing 4s
 * poll — not a replacement for it. The poll stays as the safety net (same
 * reasoning as MessagingPage.jsx's visibilitychange/focus resync: a missed
 * Realtime event during a brief disconnect must not mean permanently stale
 * data). This just calls `onChange` the moment a meeting_requests row this
 * user is party to changes, instead of waiting up to 4s for the next tick.
 *
 * Follows the same pattern as RealtimeChatPanel.jsx (the one other
 * Realtime subscription in this codebase with its table, RLS, and
 * publication membership all present in frontend/supabase/schema.sql, so
 * it's fully auditable end-to-end) — no `filter:` string, relying on the
 * meeting_requests_select_participant RLS policy to scope events to only
 * rows this user is the founder or investor on.
 *
 * Known gap, not fixed here: main_app.py's writes to this table are
 * best-effort (swallow-and-log on failure, same as every other Postgres
 * write in this app) and not transactional with the in-memory state
 * /api/status actually serves. A silently failed write-through means this
 * subscription simply never fires for that change — invisible today since
 * nothing reads Postgres directly, but worth knowing if a confirmed
 * meeting is ever reported as "not showing up instantly."
 */
export function useMeetingRequestsRealtime(onChange, enabled) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!enabled || !supabase) return

    let debounceTimer = null
    const handleChange = () => {
      clearTimeout(debounceTimer)
      // Trailing-edge debounce: a founder's request and an investor's raise
      // can land within milliseconds of each other server-side, each
      // producing its own event — coalesce into one refetch.
      debounceTimer = setTimeout(() => onChangeRef.current?.(), 300)
    }

    const channel = supabase
      .channel('meeting-requests-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meeting_requests' }, handleChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'meeting_requests' }, handleChange)
      .subscribe()

    return () => {
      clearTimeout(debounceTimer)
      supabase.removeChannel(channel)
    }
  }, [enabled])
}
