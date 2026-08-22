import { supabase } from './supabaseClient.js'

/**
 * Looks up the one conversation row for a given founder/investor/idea
 * triple — real chat is keyed off their actual Supabase auth UUIDs (plus
 * which idea/deal), not the Python backend's in-memory "inv_01"/"idea_01"
 * ids used elsewhere.
 *
 * ideaRef matters: conversations used to be keyed on the (founder,
 * investor) pair alone, back when a confirmed deal between two people was
 * permanent. Now that a deal can be marked complete and the same two
 * people can go on to confirm a second deal on a different idea, omitting
 * ideaRef here would silently find/reuse the FIRST deal's conversation row
 * (via .maybeSingle() on a pair-only match) and merge unrelated messages
 * into it — or, once the DB's unique constraint below is widened to
 * include idea_ref, potentially match more than one row and make
 * .maybeSingle() throw outright.
 *
 * Read-only on purpose: the browser's anon-key client is not allowed to
 * insert conversations itself anymore (see frontend/supabase/schema.sql —
 * the old insert policy only checked "are you one of the two named
 * parties," never "did a real confirmed meeting actually happen," which let
 * any authenticated user open a chat with anyone just by naming them as the
 * counterpart). The backend creates this row itself, via the service-role
 * key, the instant both sides opt in — see _ensure_conversation in
 * main_app.py — so by the time this page can render RealtimeChatPanel
 * (which only happens once both_opted_in is true), it should already exist.
 * The couple of short retries below are just a cushion for read-replica /
 * request-ordering lag, not a substitute for that server-side creation.
 */
export async function getOrCreateConversation(founderUserId, investorUserId, ideaRef) {
  if (!supabase) throw new Error('Supabase is not configured.')
  if (!founderUserId || !investorUserId) throw new Error('Missing participant id for conversation lookup.')

  for (let attempt = 0; attempt < 3; attempt++) {
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('founder_user_id', founderUserId)
      .eq('investor_user_id', investorUserId)
    query = ideaRef ? query.eq('idea_ref', ideaRef) : query.is('idea_ref', null)
    const { data: existing, error: findError } = await query.maybeSingle()

    if (findError) throw findError
    if (existing) return existing
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 700))
  }

  const err = new Error('Chat is still being set up on the server — refresh in a moment.')
  // Distinguishes this ordinary timing race (server hasn't written the
  // conversation row yet) from a genuine "Supabase project isn't configured"
  // failure — callers like RealtimeChatPanel.jsx use this to avoid telling a
  // real end user to go run a SQL migration file over what's actually just a
  // few hundred milliseconds of normal lag.
  err.code = 'CONVERSATION_NOT_YET_CREATED'
  throw err
}

export async function fetchMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function sendMessage(conversationId, senderUserId, text) {
  const { error } = await supabase
    .from('messages')
    .insert([{ conversation_id: conversationId, sender_user_id: senderUserId, text }])
  if (error) throw error
}
