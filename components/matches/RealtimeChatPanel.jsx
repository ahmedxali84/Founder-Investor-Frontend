'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient.js'
import { getOrCreateConversation, fetchMessages, sendMessage } from '../../lib/conversations.js'
import Notice from '../Notice.jsx'
import { SpinnerIcon, ArrowUpRightIcon } from '../icons.jsx'

/**
 * Genuine human-to-human chat over Supabase Realtime — opens the instant
 * both sides confirm a match. Requires the one-time schema/Realtime/bucket
 * setup in frontend/supabase/schema.sql to actually have been run against
 * the live Supabase project; if that hasn't happened, the Notice below
 * explains what's missing instead of failing silently.
 */
export default function RealtimeChatPanel({ selfUserId, counterpartUserId, counterpartName, ideaRef, isFounder = true }) {
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    let channel = null

    async function init() {
      if (!supabase) {
        setError('Supabase is not configured — real chat needs NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY.')
        setLoading(false)
        return
      }
      try {
        const founderId = isFounder ? selfUserId : counterpartUserId
        const investorId = isFounder ? counterpartUserId : selfUserId
        const convo = await getOrCreateConversation(founderId, investorId, ideaRef)
        if (cancelled) return
        setConversation(convo)

        const existing = await fetchMessages(convo.id)
        if (cancelled) return
        setMessages(existing)

        channel = supabase
          .channel(`chat_${convo.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convo.id}` },
            (payload) => setMessages((prev) => [...prev, payload.new])
          )
          .subscribe()
      } catch (err) {
        if (!cancelled) {
          setError(
            err.code === 'CONVERSATION_NOT_YET_CREATED'
              ? err.message
              : `Real chat isn't set up on this Supabase project yet (${err.message}). Run the SQL in ` +
                `frontend/supabase/schema.sql and enable Realtime replication on "messages".`
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [selfUserId, counterpartUserId, ideaRef, isFounder])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || !conversation) return
    try {
      await sendMessage(conversation.id, selfUserId, text.trim())
      setText('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 animate-card-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-title text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Chat — {counterpartName}
        </h3>
        <Link
          href={`/messaging?to=${counterpartUserId}`}
          className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[11px] font-bold transition-all inline-flex items-center gap-1.5"
        >
          Open in Messages <ArrowUpRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {loading ? (
        <div className="flex justify-center py-10">
          <SpinnerIcon className="w-6 h-6 text-blue-600" />
        </div>
      ) : (
        <>
          <div className="h-64 overflow-y-auto space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            {messages.length === 0 ? (
              <p className="text-[11.5px] text-slate-400 dark:text-slate-400 text-center pt-8">Say hello — you're both really here now.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_user_id === selfUserId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs ${
                    m.sender_user_id === selfUserId ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 h-10 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 transition-all duration-150"
            />
            <button
              type="submit"
              className="btn-accent shrink-0"
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  )
}
