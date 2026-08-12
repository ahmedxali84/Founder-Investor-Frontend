'use client'

import { ChatBubbleIcon, DocIcon } from '../icons.jsx'

/**
 * Shown once a meeting is confirmed, instead of auto-opening the live chat
 * panel inline — the founder/investor decide when to actually step into
 * chat, and can jump straight to the term sheet either way.
 */
export default function ChatAndAgreementBar({ chatOpen, onToggleChat, onOpenAgreement }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={onToggleChat}
        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-all shadow-sm shadow-blue-200"
      >
        <ChatBubbleIcon className="w-4 h-4" />
        {chatOpen ? 'Hide Chat' : 'Chat Now'}
      </button>
      <button
        onClick={onOpenAgreement}
        className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold inline-flex items-center gap-2 transition-all"
      >
        <DocIcon className="w-4 h-4" />
        Agreement
      </button>
    </div>
  )
}
