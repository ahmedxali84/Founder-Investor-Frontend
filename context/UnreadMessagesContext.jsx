'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './AuthContext.jsx'

const UnreadMessagesContext = createContext(null)

function readKey(userId) {
  return `techflix_messages_last_read_${userId}`
}

function loadLastRead(userId) {
  try {
    return JSON.parse(localStorage.getItem(readKey(userId)) || '{}')
  } catch {
    return {}
  }
}

function saveLastRead(userId, map) {
  try {
    localStorage.setItem(readKey(userId), JSON.stringify(map))
  } catch {
    // localStorage unavailable (private mode, quota) — read state just
    // won't persist across reloads; not worth surfacing an error for.
  }
}

/**
 * Per-contact unread direct-message counts, derived from full message
 * history against a "last read" timestamp persisted in localStorage — same
 * pattern as the notification bell's seen-tracking in AppShell.jsx. Mounted
 * once at the app root (see main.jsx) so the sidebar badge and the messages
 * page read the same counts off one subscription instead of each page
 * keeping its own tally that resets on navigation.
 */
export function UnreadMessagesProvider({ children }) {
  const { user } = useAuth()
  const [unreadCounts, setUnreadCounts] = useState({})
  const lastReadRef = useRef({})

  useEffect(() => {
    if (!user) {
      lastReadRef.current = {}
      setUnreadCounts({})
      return
    }

    lastReadRef.current = loadLastRead(user.id)
    let cancelled = false

    const recompute = (messages) => {
      const counts = {}
      for (const m of messages) {
        const lastRead = lastReadRef.current[m.sender_id]
        if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
          counts[m.sender_id] = (counts[m.sender_id] || 0) + 1
        }
      }
      if (!cancelled) setUnreadCounts(counts)
    }

    ;(async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('sender_id, created_at')
        .eq('recipient_id', user.id)
      if (!cancelled && data) recompute(data)
    })()

    const channel = supabase
      .channel('unread-direct-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload) => {
          const msg = payload.new
          if (msg.recipient_id !== user.id) return
          const lastRead = lastReadRef.current[msg.sender_id]
          if (lastRead && new Date(msg.created_at) <= new Date(lastRead)) return
          setUnreadCounts((prev) => ({ ...prev, [msg.sender_id]: (prev[msg.sender_id] || 0) + 1 }))
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [user])

  const markContactRead = (contactId) => {
    if (!user || !contactId) return
    lastReadRef.current = { ...lastReadRef.current, [contactId]: new Date().toISOString() }
    saveLastRead(user.id, lastReadRef.current)
    setUnreadCounts((prev) => {
      if (!prev[contactId]) return prev
      const next = { ...prev }
      delete next[contactId]
      return next
    })

    // Tells the server "I've seen this contact's messages" so their read_at
    // gets stamped — that's what drives the "Seen ..." label on *their* side
    // of the conversation. Best-effort: a failure here just means the sender
    // won't see a seen receipt yet, not a broken inbox for me.
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
