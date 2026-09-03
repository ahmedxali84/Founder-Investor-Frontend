'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import { useUnreadMessages } from '../../../context/UnreadMessagesContext.jsx'
import { useAgentStatus } from '../../../hooks/useAgentStatus.js'
import AppShell from '../../../components/AppShell.jsx'
import { PageSkeleton } from '../../../components/Skeleton.jsx'
import { PaperclipIcon, CloseIcon, ArrowLeftIcon, SendIcon } from '../../../components/icons.jsx'
import { timeAgo } from '../../../lib/format.js'

const ATTACHMENTS_BUCKET = 'message-attachments'
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']

const AVATAR_COLORS = [
  'bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400',
  'bg-violet-400', 'bg-pink-400', 'bg-teal-400', 'bg-orange-400',
]

function formatMessageTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  if (isToday) return timeStr
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return `${dateStr} · ${timeStr}`
}

function isSameDay(isoA, isoB) {
  if (!isoA || !isoB) return false
  return new Date(isoA).toDateString() === new Date(isoB).toDateString()
}

function formatDateDivider(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === now.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function displayName(profile) {
  if (!profile) return 'Unknown'
  return profile.full_name || profile.email || 'Unknown'
}

function initialsFor(profile) {
  const name = displayName(profile)
  return name.trim().charAt(0).toUpperCase()
}

function colorForId(id) {
  if (!id) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function isImageAttachment(name) {
  if (!name) return false
  const lower = name.toLowerCase()
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

function previewFor(msg) {
  if (!msg) return ''
  if (msg.deleted_at) return 'Message deleted'
  if (msg.attachment_name) return `Attachment: ${msg.attachment_name}`
  return msg.text
}

function PlusIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function PencilIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

function MessagingPageInner() {
  const { user: authUser } = useAuth()
  const { unreadCounts, markContactRead } = useUnreadMessages()
  const { loading: agentLoading, userType, userName, userRole, avatarUrl, signOut, profileData, statusData } = useAgentStatus()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [contacts, setContacts] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [conversation, setConversation] = useState([])
  const [lastMessages, setLastMessages] = useState({})
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [sendError, setSendError] = useState('')
  const [channelStatus, setChannelStatus] = useState('connecting')
  const [searchQuery, setSearchQuery] = useState('')
  const [signedUrls, setSignedUrls] = useState({})
  const [mobileView, setMobileView] = useState('list')
  const [lightboxImage, setLightboxImage] = useState(null)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [newChatQuery, setNewChatQuery] = useState('')
  const [newChatResults, setNewChatResults] = useState([])
  const [newChatLoading, setNewChatLoading] = useState(false)
  const [newChatSearched, setNewChatSearched] = useState(false)
  const messagesEndRef = useRef(null)
  const selectedIdRef = useRef(null)
  const contactsRef = useRef([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    contactsRef.current = contacts
  }, [contacts])

  // Ask for notification permission once, so we can alert on new messages
  // that arrive while this tab isn't focused.
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // 1. Load my profile (creating it if it doesn't exist yet), load contacts + last messages.
  // Auth itself is already enforced by <ProtectedRoute> at the route level.
  useEffect(() => {
    if (!authUser) return

    const init = async () => {
      const myProfile = {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || authUser.email,
        email: authUser.email,
      }

      // Self-healing: make sure a profile row exists for this account,
      // whether they signed up before or after this feature existed.
      await supabase.from('profiles').upsert(myProfile)

      setCurrentUser(myProfile)

      const { data: contactsData, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', authUser.id)

      if (!error && contactsData) {
        setContacts(contactsData)
      }

      const { data: allMessages } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${authUser.id},recipient_id.eq.${authUser.id}`)
        .order('created_at', { ascending: false })

      const lastMap = {}
      ;(allMessages || []).forEach((m) => {
        const other = m.sender_id === authUser.id ? m.recipient_id : m.sender_id
        if (!lastMap[other]) lastMap[other] = m
      })
      setLastMessages(lastMap)

      setLoading(false)
    }

    init()
  }, [authUser])

  // 1a. Deep link from the matches flow: /messaging?to=<userId> opens that
  // conversation directly. Fetch the profile if they're not already a contact,
  // then clear the param so a refresh doesn't force it again.
  useEffect(() => {
    if (!currentUser) return
    const toId = searchParams.get('to')
    if (!toId || toId === currentUser.id) return

    let cancelled = false
    ;(async () => {
      let profile = contactsRef.current.find((c) => c.id === toId)
      if (!profile) {
        const { data } = await supabase.from('profiles').select('*').eq('id', toId).single()
        if (data) {
          profile = data
          if (!cancelled) {
            setContacts((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, data]))
          }
        }
      }
      if (profile && !cancelled) {
        setSelectedId(toId)
        markContactRead(toId)
        setMobileView('chat')
      }
      const next = new URLSearchParams(searchParams.toString())
      next.delete('to')
      router.replace(next.toString() ? `${pathname}?${next}` : pathname)
    })()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  // 1b. Keep the contact list live — new sign-ups appear without a reload
  useEffect(() => {
    if (!currentUser) return

    const contactsChannel = supabase
      .channel('profiles-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.new.id === currentUser.id) return
          setContacts((prev) =>
            prev.some((c) => c.id === payload.new.id) ? prev : [...prev, payload.new]
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(contactsChannel)
    }
  }, [currentUser])

  // 1c. Safety net: if a live update is ever missed (e.g. a brief disconnect),
  // re-sync contacts and the open conversation whenever the tab regains focus.
  useEffect(() => {
    if (!currentUser) return

    const resync = async () => {
      const { data: freshContacts } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser.id)
      if (freshContacts) setContacts(freshContacts)

      if (selectedIdRef.current) {
        const { data: freshConversation } = await supabase
          .from('direct_messages')
          .select('*')
          .or(
            `and(sender_id.eq.${currentUser.id},recipient_id.eq.${selectedIdRef.current}),and(sender_id.eq.${selectedIdRef.current},recipient_id.eq.${currentUser.id})`
          )
          .order('created_at', { ascending: true })
        if (freshConversation) setConversation(freshConversation)
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') resync()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', resync)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', resync)
    }
  }, [currentUser])

  // Close the image lightbox on Escape
  useEffect(() => {
    if (!lightboxImage) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxImage(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [lightboxImage])

  // Close the new-chat modal on Escape
  useEffect(() => {
    if (!showNewChatModal) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowNewChatModal(false)
        setNewChatQuery('')
        setNewChatResults([])
        setNewChatSearched(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [showNewChatModal])

  // New-chat search — queries the profiles table directly (not just the preloaded
  // contact list), so it always reflects who's actually in the database.
  useEffect(() => {
    if (!showNewChatModal || !currentUser) return

    const q = newChatQuery.trim()
    if (!q) {
      setNewChatResults([])
      setNewChatSearched(false)
      setNewChatLoading(false)
      return
    }

    setNewChatLoading(true)
    const timeout = setTimeout(async () => {
      // ilike patterns treat % and _ as wildcards, and .or() splits on commas/parens —
      // strip/escape those so a raw search term can't break the filter.
      const safeQ = q.replace(/[,()]/g, '').replace(/[%_]/g, '\\$&')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser.id)
        .or(`full_name.ilike.%${safeQ}%,email.ilike.%${safeQ}%`)
        .limit(20)

      setNewChatResults(!error && data ? data : [])
      setNewChatSearched(true)
      setNewChatLoading(false)
    }, 350)

    return () => clearTimeout(timeout)
  }, [newChatQuery, showNewChatModal, currentUser])

  // 2. One realtime subscription covers every conversation I'm part of —
  // Row Level Security means I only ever receive messages where I'm sender or recipient.
  useEffect(() => {
    if (!currentUser) return

    setChannelStatus('connecting')

    const channel = supabase
      .channel('direct-messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload) => {
          const msg = payload.new
          const otherParty = msg.sender_id === currentUser.id ? msg.recipient_id : msg.sender_id

          setLastMessages((prev) => ({ ...prev, [otherParty]: msg }))

          if (otherParty === selectedIdRef.current) {
            setConversation((prev) =>
              prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
            )
            // This conversation is open right now, so the message is being
            // read live — don't let it register as unread in the sidebar.
            if (msg.sender_id !== currentUser.id) markContactRead(otherParty)
          }

          const isFromSomeoneElse = msg.sender_id !== currentUser.id
          const shouldNotify = isFromSomeoneElse && (document.hidden || otherParty !== selectedIdRef.current)
          if (shouldNotify && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const sender = contactsRef.current.find((c) => c.id === msg.sender_id)
            new Notification(displayName(sender) || 'New message', {
              body: msg.attachment_name ? `Attachment: ${msg.attachment_name}` : msg.text,
            })
          }
        }
      )
      .on(
        // Covers both edits and soft-deletes (a delete just sets deleted_at) —
        // keeps the open conversation and sidebar preview in sync for both sides.
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'direct_messages' },
        (payload) => {
          const msg = payload.new
          const otherParty = msg.sender_id === currentUser.id ? msg.recipient_id : msg.sender_id

          setConversation((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)))
          setLastMessages((prev) =>
            prev[otherParty]?.id === msg.id ? { ...prev, [otherParty]: msg } : prev
          )
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setChannelStatus('live')
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setChannelStatus('error')
        else if (status === 'CLOSED') setChannelStatus('closed')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  // 3. Load message history whenever the open conversation changes
  useEffect(() => {
    if (!selectedId || !currentUser) return

    // Guards against switching contacts quickly: if this fetch is still in
    // flight when selectedId changes again, its result must not overwrite
    // the newer conversation that's now open.
    let cancelled = false

    const fetchConversation = async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${currentUser.id},recipient_id.eq.${selectedId}),and(sender_id.eq.${selectedId},recipient_id.eq.${currentUser.id})`
        )
        .order('created_at', { ascending: true })
      if (!cancelled) setConversation(data || [])
    }

    fetchConversation()

    return () => {
      cancelled = true
    }
  }, [selectedId, currentUser])

  // 3b. Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  // 3c. Resolve signed URLs for any attachments in view (bucket is private)
  useEffect(() => {
    const missing = conversation.filter((m) => m.attachment_url && !signedUrls[m.id] && !m.pending)
    if (missing.length === 0) return

    ;(async () => {
      const updates = {}
      for (const m of missing) {
        const { data } = await supabase.storage
          .from(ATTACHMENTS_BUCKET)
          .createSignedUrl(m.attachment_url, 3600)
        if (data?.signedUrl) updates[m.id] = data.signedUrl
      }
      if (Object.keys(updates).length) {
        setSignedUrls((prev) => ({ ...prev, ...updates }))
      }
    })()
  }, [conversation, signedUrls])

  // Clear any stale send error when switching conversations
  useEffect(() => {
    setSendError('')
  }, [selectedId])

  const currentContact = contacts.find((c) => c.id === selectedId)

  // Index of the last message that's mine — not "the last message in the
  // thread," which flips to the other person's the instant they reply, even
  // though my own last-sent message is still genuinely my most recent one.
  const lastMineIndex = conversation.reduce(
    (acc, m, i) => (m.sender_id === currentUser?.id ? i : acc), -1
  )

  const handleSelectContact = (id) => {
    setSelectedId(id)
    markContactRead(id)
    setMobileView('chat')
  }

  const closeNewChatModal = () => {
    setShowNewChatModal(false)
    setNewChatQuery('')
    setNewChatResults([])
    setNewChatSearched(false)
    setNewChatLoading(false)
  }

  const handleStartNewChat = (profile) => {
    setContacts((prev) => (prev.some((c) => c.id === profile.id) ? prev : [...prev, profile]))
    closeNewChatModal()
    handleSelectContact(profile.id)
  }

  // 4c. Edit — sender-only, enforced again server-side via RLS (eq sender_id)
  const handleEditMessage = async (messageId, newText) => {
    const editedAt = new Date().toISOString()
    const original = conversation.find((m) => m.id === messageId)
    setConversation((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, text: newText, edited_at: editedAt } : m))
    )
    setLastMessages((prev) =>
      prev[selectedId]?.id === messageId
        ? { ...prev, [selectedId]: { ...prev[selectedId], text: newText, edited_at: editedAt } }
        : prev
    )

    const { error } = await supabase
      .from('direct_messages')
      .update({ text: newText, edited_at: editedAt })
      .eq('id', messageId)
      .eq('sender_id', currentUser.id)
    if (error) {
      console.error('Error editing message:', error.message)
      // The database update never happened — undo the optimistic change so
      // the UI doesn't keep showing an edit that isn't actually saved.
      if (original) {
        setConversation((prev) => prev.map((m) => (m.id === messageId ? original : m)))
        setLastMessages((prev) =>
          prev[selectedId]?.id === messageId ? { ...prev, [selectedId]: original } : prev
        )
      }
    }
  }

  // 4d. Delete — soft delete, so both sides see a "deleted" placeholder instead
  // of the conversation silently losing a message.
  const handleDeleteMessage = async (messageId) => {
    const deletedAt = new Date().toISOString()
    const original = conversation.find((m) => m.id === messageId)
    setConversation((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, deleted_at: deletedAt } : m))
    )
    setLastMessages((prev) =>
      prev[selectedId]?.id === messageId
        ? { ...prev, [selectedId]: { ...prev[selectedId], deleted_at: deletedAt } }
        : prev
    )

    const { error } = await supabase
      .from('direct_messages')
      .update({ deleted_at: deletedAt })
      .eq('id', messageId)
      .eq('sender_id', currentUser.id)
    if (error) {
      console.error('Error deleting message:', error.message)
      // The database update never happened — undo the optimistic change so
      // the UI doesn't keep showing the message as deleted when it isn't.
      if (original) {
        setConversation((prev) => prev.map((m) => (m.id === messageId ? original : m)))
        setLastMessages((prev) =>
          prev[selectedId]?.id === messageId ? { ...prev, [selectedId]: original } : prev
        )
      }
    }
  }

  // 4. Send Message Pipeline — optimistic UI, reconciled against the realtime echo
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedId || sending || !currentUser) return

    const userText = newMessage
    const tempId = `temp-${Date.now()}`
    setNewMessage('')
    setSendError('')
    setSending(true)

    setConversation((prev) => [
      ...prev,
      {
        id: tempId,
        sender_id: currentUser.id,
        recipient_id: selectedId,
        text: userText,
        created_at: new Date().toISOString(),
        pending: true,
      },
    ])

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert([{ sender_id: currentUser.id, recipient_id: selectedId, text: userText }])
        .select()
        .single()

      if (error) throw error

      // If the user switched to a different contact while this insert was
      // still in flight, `conversation` now holds THAT contact's thread
      // (replaced by the effect that reacts to selectedId changing) — merging
      // this response in unconditionally would attach a message meant for
      // the original recipient onto whatever thread happens to be open now.
      // The temp-message removal for the original thread already happened
      // implicitly when it got replaced, so there's nothing left to reconcile.
      if (selectedIdRef.current === selectedId) {
        setConversation((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempId)
          const alreadyPresent = withoutTemp.some((m) => m.id === data.id)
          const next = alreadyPresent ? withoutTemp : [...withoutTemp, data]
          return next.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        })
      }
      setLastMessages((prev) => ({ ...prev, [selectedId]: data }))
    } catch (err) {
      console.error('Error sending message:', err.message)
      setSendError("Message couldn't be sent. Please try again.")
      setNewMessage(userText)
      if (selectedIdRef.current === selectedId) {
        setConversation((prev) => prev.filter((m) => m.id !== tempId))
      }
    } finally {
      setSending(false)
    }
  }

  // 4b. Attachment upload pipeline — same optimistic pattern as text sends
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !selectedId || !currentUser || uploading) return

    const tempId = `temp-${Date.now()}`
    setUploading(true)
    setSendError('')

    setConversation((prev) => [
      ...prev,
      {
        id: tempId,
        sender_id: currentUser.id,
        recipient_id: selectedId,
        text: '',
        attachment_name: file.name,
        created_at: new Date().toISOString(),
        pending: true,
      },
    ])

    try {
      const path = `${currentUser.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .upload(path, file)
      if (uploadError) throw uploadError

      const { data, error } = await supabase
        .from('direct_messages')
        .insert([{
          sender_id: currentUser.id,
          recipient_id: selectedId,
          text: '',
          attachment_url: path,
          attachment_name: file.name,
        }])
        .select()
        .single()
      if (error) throw error

      // Same guard as handleSendMessage — don't attach this attachment's
      // message onto whatever thread happens to be open now if the user
      // switched contacts while the upload/insert was still in flight.
      if (selectedIdRef.current === selectedId) {
        setConversation((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempId)
          const alreadyPresent = withoutTemp.some((m) => m.id === data.id)
          const next = alreadyPresent ? withoutTemp : [...withoutTemp, data]
          return next.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        })
      }
      setLastMessages((prev) => ({ ...prev, [selectedId]: data }))
    } catch (err) {
      console.error('Error sending attachment:', err.message)
      setSendError("Attachment couldn't be sent. Please try again.")
      if (selectedIdRef.current === selectedId) {
        setConversation((prev) => prev.filter((m) => m.id !== tempId))
      }
    } finally {
      setUploading(false)
    }
  }

  const handleComposerKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  // The sidebar is a conversation list, not a full directory — only people you've
  // actually exchanged messages with (or the chat you currently have open) belong here.
  // Everyone else in the database is reachable via the "+ New" search modal instead.
  const filteredContacts = contacts.filter((contact) => {
    const hasHistory = Boolean(lastMessages[contact.id]) || contact.id === selectedId
    if (!hasHistory) return false
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return displayName(contact).toLowerCase().includes(q) || (contact.email || '').toLowerCase().includes(q)
  })

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const aTime = lastMessages[a.id]?.created_at
    const bTime = lastMessages[b.id]?.created_at
    if (aTime && bTime) return new Date(bTime) - new Date(aTime)
    if (aTime) return -1
    if (bTime) return 1
    return displayName(a).localeCompare(displayName(b))
  })

  if (agentLoading) return <PageSkeleton />

  return (
    <AppShell active="messages" userType={userType} userName={userName} userRole={userRole} avatarUrl={avatarUrl} onSignOut={signOut} profileData={profileData} statusData={statusData}>
      {loading || !currentUser ? (
        <div className="grid md:grid-cols-12 gap-6 h-[75vh] min-h-[560px] animate-pulse">
          <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-800 space-y-3">
            <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded mb-4" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
            ))}
          </div>
          <div className="hidden md:flex md:col-span-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-800 flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
              <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
            <div className="flex-1 p-4 space-y-3">
              <div className="h-10 w-2/3 bg-slate-100 dark:bg-slate-800/60 rounded-2xl ml-auto" />
              <div className="h-10 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
              <div className="h-10 w-3/5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl ml-auto" />
            </div>
          </div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex items-center justify-center h-[75vh] min-h-[560px]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200/70 dark:border-slate-800 max-w-md text-center">
            <h2 className="text-title text-slate-800 dark:text-slate-100 mb-2">No one else has joined yet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Once another account signs up on Kavan, they'll show up here and you can start messaging them in real time.
            </p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold pl-3 pr-4 py-2 rounded-full shadow-sm shadow-blue-200 transition-all"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Search for someone
            </button>
          </div>
          {showNewChatModal && (
            <NewChatModal
              query={newChatQuery}
              setQuery={setNewChatQuery}
              results={newChatResults}
              loading={newChatLoading}
              searched={newChatSearched}
              onClose={closeNewChatModal}
              onSelect={handleStartNewChat}
            />
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-12 gap-6 h-[75vh] min-h-[560px]">

          {/* LEFT PANEL: Contacts */}
          <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} md:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-800 flex-col overflow-y-auto`}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-title text-slate-800 dark:text-slate-100">Messages</h2>
                <p className={`text-[11px] font-semibold flex items-center gap-1 ${
                  channelStatus === 'live' ? 'text-emerald-500' : channelStatus === 'error' ? 'text-rose-500' : 'text-amber-500'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    channelStatus === 'live' ? 'bg-emerald-500 animate-pulse' : channelStatus === 'error' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                  }`}></span>
                  {channelStatus === 'live' ? 'Real-time Connected' : channelStatus === 'error' ? 'Connection Error' : 'Connecting...'}
                </p>
              </div>
              <button
                onClick={() => setShowNewChatModal(true)}
                title="Start a new chat"
                className="shrink-0 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[11px] font-semibold pl-2 pr-3 py-1.5 rounded-full shadow-sm shadow-blue-200 transition-all"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                New
              </button>
            </div>

            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-3 px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            />

            <div className="space-y-2 flex-1">
              {sortedContacts.length === 0 ? (
                searchQuery.trim() ? (
                  <p className="text-xs text-slate-400 dark:text-slate-400 text-center mt-4">No one matches &quot;{searchQuery}&quot;.</p>
                ) : (
                  <div className="text-center mt-6 px-2">
                    <p className="text-xs text-slate-400 dark:text-slate-400 mb-3">No conversations yet.</p>
                    <button
                      onClick={() => setShowNewChatModal(true)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1">
                      Start a new chat
                    </button>
                  </div>
                )
              ) : (
                sortedContacts.map((contact) => {
                  const last = lastMessages[contact.id]
                  return (
                    <button
                      key={contact.id}
                      onClick={() => handleSelectContact(contact.id)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                        selectedId === contact.id
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-500/10 shadow-sm'
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full ${colorForId(contact.id)} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                        {initialsFor(contact)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                            {displayName(contact)}
                          </span>
                          {last && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 shrink-0">{formatMessageTime(last.created_at)}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate min-w-0 flex-1">
                            {last ? previewFor(last) : contact.email}
                          </span>
                          {unreadCounts[contact.id] > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shrink-0">
                              {unreadCounts[contact.id]}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Live Chat Window */}
          <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} md:col-span-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-800 flex-col overflow-hidden h-full`}>
            {!currentContact ? (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <p className="text-sm text-slate-400 dark:text-slate-400">Select someone from the list to start messaging.</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-3">
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-1"
                    aria-label="Back to messages"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <div className={`w-9 h-9 rounded-full ${colorForId(currentContact.id)} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                    {initialsFor(currentContact)}
                  </div>
                  {/* min-w-0 lets this shrink inside the flex row — the email
                      below is one unbreakable token, so without it the header
                      forces the whole bar wider than the viewport on mobile. */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-title text-slate-800 dark:text-slate-100 truncate">{displayName(currentContact)}</h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">{currentContact.email}</p>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto bg-slate-50/60 dark:bg-slate-800/30">
                  {conversation.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                      <p className="text-xs text-slate-400 dark:text-slate-400 max-w-[220px]">
                        Start the conversation with {displayName(currentContact)}.
                      </p>
                    </div>
                  ) : (
                    conversation.map((msg, index) => {
                      const isMine = msg.sender_id === currentUser.id
                      const prevMsg = conversation[index - 1]
                      const nextMsg = conversation[index + 1]
                      const showDateDivider = !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at)
                      const isLastInGroup =
                        !nextMsg || nextMsg.sender_id !== msg.sender_id || !isSameDay(nextMsg.created_at, msg.created_at)
                      // "Seen" only ever applies to my own most recent message in the
                      // thread — showing it on an older one would misleadingly imply
                      // everything since was read too. This has to be "the last
                      // message I sent," not "the last message in the thread": the
                      // instant the other person replies, that reply becomes the
                      // thread's last message, so checking against the thread's end
                      // made the indicator vanish off a message that's genuinely
                      // still my most recent one and still genuinely read.
                      const showSeen = isMine && index === lastMineIndex && Boolean(msg.read_at)

                      return (
                        <div key={msg.id}>
                          {showDateDivider && (
                            <div className="flex items-center justify-center my-3">
                              <span className="text-[10px] text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                                {formatDateDivider(msg.created_at)}
                              </span>
                            </div>
                          )}
                          <MessageBubble
                            msg={msg}
                            isMine={isMine}
                            isLastInGroup={isLastInGroup}
                            showSeen={showSeen}
                            currentContact={currentContact}
                            currentUser={currentUser}
                            signedUrls={signedUrls}
                            onImageClick={(src, name) => setLightboxImage({ src, name })}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                          />
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2">
                  {sendError && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 px-1">{sendError}</p>
                  )}
                  <div className="flex gap-2 items-end">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || sending}
                      title="Attach a file"
                      className="flex items-center justify-center text-slate-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/40 disabled:opacity-50 w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 shrink-0 transition-all"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                    <textarea
                      rows={1}
                      placeholder={`Message ${displayName(currentContact)}...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-blue-500 resize-none max-h-24"
                    />
                    <button
                      type="submit"
                      disabled={sending || uploading || !newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-btn transition-all shadow-sm inline-flex items-center gap-1.5"
                    >
                      {sending ? 'Sending…' : <>Send <SendIcon className="w-3.5 h-3.5" /></>}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

        </div>
      )}

      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
          <img
            src={lightboxImage.src}
            alt={lightboxImage.name}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}

      {showNewChatModal && contacts.length > 0 && (
        <NewChatModal
          query={newChatQuery}
          setQuery={setNewChatQuery}
          results={newChatResults}
          loading={newChatLoading}
          searched={newChatSearched}
          onClose={closeNewChatModal}
          onSelect={handleStartNewChat}
        />
      )}
    </AppShell>
  )
}

function MessageBubble({
  msg,
  isMine,
  isLastInGroup,
  showSeen,
  currentContact,
  currentUser,
  signedUrls,
  onImageClick,
  onEdit,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(msg.text || '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isDeleted = Boolean(msg.deleted_at)
  const canEdit = isMine && !isDeleted && !msg.attachment_name && !msg.pending
  const canDelete = isMine && !isDeleted && !msg.pending

  const startEdit = () => {
    setEditValue(msg.text || '')
    setIsEditing(true)
  }

  const submitEdit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== msg.text) onEdit(msg.id, trimmed)
    setIsEditing(false)
  }

  const hoverToggleClass = 'opacity-60 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity'

  return (
    <div className={`group flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-3' : 'mb-1'}`}>
      {!isMine && (
        <div className="w-6 h-6 shrink-0">
          {isLastInGroup && (
            <div className={`w-6 h-6 rounded-full ${colorForId(currentContact.id)} text-white text-[10px] font-bold flex items-center justify-center`}>
              {initialsFor(currentContact)}
            </div>
          )}
        </div>
      )}

      {isMine && (canEdit || canDelete) && (
        <div className={`flex items-center gap-0.5 mb-1 ${hoverToggleClass}`}>
          {canEdit && (
            <button
              onClick={startEdit}
              title="Edit"
              className="text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <PencilIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && (
            confirmDelete ? (
              <span className="flex items-center gap-1 text-[10px] bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-1 rounded-full whitespace-nowrap">
                Delete?
                <button onClick={() => { onDelete(msg.id); setConfirmDelete(false) }} className="font-bold hover:underline">Yes</button>
                <button onClick={() => setConfirmDelete(false)} className="hover:underline">No</button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                title="Delete"
                className="text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      )}

      <div className="flex flex-col gap-1 max-w-[75%]">
        {isEditing ? (
          <div className="flex flex-col gap-1">
            <textarea
              autoFocus
              rows={2}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit() }
                if (e.key === 'Escape') { setIsEditing(false); setEditValue(msg.text || '') }
              }}
              className="text-xs p-2 rounded-xl border border-blue-300 dark:border-blue-500/40 dark:bg-slate-800 dark:text-slate-100 focus:outline-none resize-none"
            />
            <div className="flex gap-3 justify-end text-[10px]">
              <button onClick={() => { setIsEditing(false); setEditValue(msg.text || '') }} className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                Cancel
              </button>
              <button onClick={submitEdit} className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300">
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl text-xs leading-relaxed ${
            msg.attachment_name && !isDeleted ? 'p-2' : 'p-3'
          } ${
            isMine
              ? `bg-blue-600 text-white rounded-tr-none ${msg.pending ? 'opacity-60' : ''}`
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm rounded-tl-none'
          } ${isDeleted ? 'italic opacity-70' : ''}`}>
            {isDeleted ? (
              'This message was deleted'
            ) : msg.attachment_name ? (
              msg.pending ? (
                <div className="flex items-center gap-2 px-1 py-1">
                  <span className="inline-flex items-center gap-1.5"><PaperclipIcon className="w-3.5 h-3.5" />{msg.attachment_name}</span>
                  <span className="opacity-70">Uploading...</span>
                </div>
              ) : isImageAttachment(msg.attachment_name) && signedUrls[msg.id] ? (
                <img
                  src={signedUrls[msg.id]}
                  alt={msg.attachment_name}
                  onClick={() => onImageClick(signedUrls[msg.id], msg.attachment_name)}
                  className="rounded-xl max-w-full max-h-60 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                />
              ) : (
                <a
                  href={signedUrls[msg.id] || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-1 py-1 underline ${isMine ? 'text-white' : 'text-blue-600'}`}
                >
                  <PaperclipIcon className="w-3.5 h-3.5" /> {msg.attachment_name}
                </a>
              )
            ) : (
              msg.text
            )}
          </div>
        )}

        {isLastInGroup && !isEditing && (
          <span className={`text-[10px] text-slate-400 dark:text-slate-400 flex items-center gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
            {msg.pending ? 'Sending...' : formatMessageTime(msg.created_at)}
            {msg.edited_at && !isDeleted && <span className="italic">(edited)</span>}
            {showSeen && <span className="text-blue-500 font-semibold">· Seen {timeAgo(msg.read_at)}</span>}
          </span>
        )}
      </div>

      {isMine && (
        <div className="w-6 h-6 shrink-0">
          {isLastInGroup && (
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {initialsFor(currentUser)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NewChatModal({ query, setQuery, results, loading, searched, onClose, onSelect }) {
  const trimmed = query.trim()
  const showEmptyState = !loading && searched && trimmed && results.length === 0

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-24"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/70 dark:border-slate-800 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <h3 className="text-title text-slate-800 dark:text-slate-100">New message</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 w-7 h-7 rounded-full flex items-center justify-center"
            aria-label="Close"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <input
            type="text"
            autoFocus
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="max-h-72 overflow-y-auto px-2 pb-4">
          {!trimmed ? (
            <p className="text-xs text-slate-400 dark:text-slate-400 text-center py-6">Start typing to search for someone to message.</p>
          ) : loading ? (
            <p className="text-xs text-slate-400 dark:text-slate-400 text-center py-6">Searching...</p>
          ) : showEmptyState ? (
            <p className="text-xs text-slate-400 dark:text-slate-400 text-center py-6">User not found. Double-check the name or email.</p>
          ) : (
            <div className="space-y-1">
              {results.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => onSelect(profile)}
                  className="w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className={`w-9 h-9 rounded-full ${colorForId(profile.id)} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                    {initialsFor(profile)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate block">{displayName(profile)}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">{profile.email}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MessagingPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MessagingPageInner />
    </Suspense>
  )
}
