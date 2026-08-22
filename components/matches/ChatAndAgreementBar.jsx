'use client'

import Link from 'next/link'
import { ChatBubbleIcon, DocIcon, CheckCircleIcon, SpinnerIcon, ArrowUpRightIcon } from '../icons.jsx'

/**
 * Shown once a meeting is confirmed.
 *
 * "Chat Now" goes straight to the Messaging page rather than opening an
 * inline chat box on this page. This app has two separate chat systems —
 * a deal-scoped one (conversations/messages tables, one thread per
 * founder+investor+idea) that used to render here inline, and the general
 * Messaging page (profiles/direct_messages, one thread per person pair
 * with no per-deal separation). Keeping both around meant two different
 * chat UIs with two different sets of bugs; consolidating to one — the
 * Messaging page, which already handles every other conversation in the
 * app — removes that duplication even though it means a person's chat
 * history isn't automatically split per deal there.
 *
 * "Mark as Done" is the other action here: a confirmed deal used to have no
 * further lifecycle state at all — nothing ever released it, so it
 * permanently occupied this investor's/founder's one-deal slot even once
 * the two had actually finished building together. Either side can mark it
 * done unilaterally (same one-sided pattern "Reject" already uses
 * elsewhere), which frees both of them up for a new match.
 */
export default function ChatAndAgreementBar({ counterpartUserId, onOpenAgreement, completed, markingDone, onMarkDone }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Link
        href={`/messaging?to=${counterpartUserId}`}
        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-all shadow-sm shadow-blue-200"
      >
        <ChatBubbleIcon className="w-4 h-4" />
        Chat Now
        <ArrowUpRightIcon className="w-3.5 h-3.5" />
      </Link>
      <button
        onClick={onOpenAgreement}
        className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold inline-flex items-center gap-2 transition-all"
      >
        <DocIcon className="w-4 h-4" />
        Agreement
      </button>
      {completed ? (
        <span className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold inline-flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4" />
          Deal Completed
        </span>
      ) : (
        <button
          onClick={onMarkDone}
          disabled={markingDone}
          title="Mark this deal as finished — frees you both up to be matched again"
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold inline-flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {markingDone ? <SpinnerIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
          Mark as Done
        </button>
      )}
    </div>
  )
}
