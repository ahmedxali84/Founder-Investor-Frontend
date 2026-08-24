'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../../context/AuthContext.jsx'
import { getOrCreateConversation, fetchMessages } from '../../lib/conversations.js'
import { generateAgreement } from '../../lib/matchesApi.js'
import Notice from '../Notice.jsx'
import { SpinnerIcon, DocIcon, CloseIcon } from '../icons.jsx'

/**
 * Modal that renders the real Agent 7 term sheet (POST /api/agreement),
 * drafted from the real chat transcript plus the deal terms below — equity
 * share and investment amount are asked directly here rather than left for
 * Agent 7 to infer from the chat log, which used to misread ambiguous
 * back-and-forth negotiation into the wrong numbers.
 */
export default function TermSheetModal({ slotId, selfUserId, counterpartUserId, isFounder = true, onClose }) {
  const { accessToken } = useAuth()
  const [equityPercent, setEquityPercent] = useState('')
  const [amountUsd, setAmountUsd] = useState('')
  const [formError, setFormError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  function handleSubmitTerms(e) {
    e.preventDefault()
    const equity = Number(equityPercent)
    const amount = Number(amountUsd)
    if (!equityPercent || Number.isNaN(equity) || equity <= 0 || equity > 100) {
      setFormError('Enter a valid equity share between 0 and 100%.')
      return
    }
    if (!amountUsd || Number.isNaN(amount) || amount <= 0) {
      setFormError('Enter a valid investment amount in USD.')
      return
    }
    setFormError('')
    setSubmitted(true)
  }

  useEffect(() => {
    if (!submitted) return
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        let transcript = []
        if (selfUserId && counterpartUserId) {
          try {
            const founderId = isFounder ? selfUserId : counterpartUserId
            const investorId = isFounder ? counterpartUserId : selfUserId
            const convo = await getOrCreateConversation(founderId, investorId, slotId)
            const raw = await fetchMessages(convo.id)
            transcript = raw.map((m) => ({
              sender: m.sender_user_id === founderId ? 'Founder' : 'Investor',
              text: m.text,
            }))
          } catch {
            // The deal-scoped chat transcript is a nice-to-have for Agent 7
            // to draft from — never let it block generating a term sheet
            // outright (e.g. the conversation row genuinely hasn't been
            // created yet, or never was for an older deal). Falls back to
            // drafting from the equity/amount fields alone.
          }
        }
        const data = await generateAgreement(slotId, transcript, accessToken, {
          equityPercent: Number(equityPercent),
          amountUsd: Number(amountUsd),
        })
        if (!cancelled) setMarkdown(data.agreement || '')
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted])

  function handleCopy() {
    navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleDownload() {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'term-sheet.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card w-full max-w-2xl max-h-[85vh] flex flex-col animate-card-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-title text-slate-800 dark:text-slate-100 inline-flex items-center gap-2"><DocIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Term sheet — drafted automatically</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" aria-label="Close"><CloseIcon className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!submitted && (
            <form onSubmit={handleSubmitTerms} className="space-y-4 max-w-sm mx-auto py-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Enter the agreed deal terms — Agent 7 will draft the rest of the agreement from your negotiation history.
              </p>
              <div>
                <label htmlFor="equity-percent" className="block text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Equity share (%)
                </label>
                <input
                  id="equity-percent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  inputMode="decimal"
                  value={equityPercent}
                  onChange={(e) => setEquityPercent(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="amount-usd" className="block text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount to invest (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">$</span>
                  <input
                    id="amount-usd"
                    type="number"
                    min="0"
                    step="1000"
                    inputMode="numeric"
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(e.target.value)}
                    placeholder="e.g. 250000"
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              {formError && <Notice tone="error">{formError}</Notice>}
              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-btn transition-all">
                Generate term sheet
              </button>
            </form>
          )}
          {submitted && loading && (
            <div className="flex flex-col items-center py-12 gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <SpinnerIcon className="w-6 h-6 text-blue-600" />
              Drafting agreement from your negotiation history...
            </div>
          )}
          {submitted && error && <Notice tone="error">{error}</Notice>}
          {submitted && !loading && !error && (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-p:text-slate-600 dark:prose-p:text-slate-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </div>
          )}
        </div>

        {submitted && !loading && !error && (
          <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={handleCopy} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={handleDownload} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all">
              Download .md
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
