import { useState } from 'react'

import { Card, CardLabel } from '@/components/ui/card'
import { ChatMessage } from '@/components/patterns/ChatMessage'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { featuredQuestions, formatAIBlocks, localIntentMatch, splitEmphasis, suggestedQuestions, type AiTextBlock } from '@/modules/assessment/lib/ai-answers'

type LogMessage = { role: 'user' | 'bot'; text: string }

// Groups consecutive 'li' blocks into a single <ul>, matching legacy's
// formatAIText() (which only opens/closes one <ul> per contiguous run of
// "•" lines rather than one <ul> per bullet).
function groupBlocks(blocks: AiTextBlock[]): (AiTextBlock | { type: 'ul'; items: string[] })[] {
  const out: (AiTextBlock | { type: 'ul'; items: string[] })[] = []
  for (const b of blocks) {
    if (b.type === 'li') {
      const last = out[out.length - 1]
      if (last && last.type === 'ul') last.items.push(b.text)
      else out.push({ type: 'ul', items: [b.text] })
    } else {
      out.push(b)
    }
  }
  return out
}
function renderEmphasized(text: string) {
  return splitEmphasis(text).map((p, k) => (typeof p === 'string' ? <span key={k}>{p}</span> : <b key={k}>{p.bold}</b>))
}

// Migrated from renderAI()/addAIMessage()/askFromList()/sendAIInput()
// (js/assessment.js ~8049-8123). The quick-question buttons and all of
// localIntentMatch()'s keyword-matched answers are ported and fully
// functional/offline (calculations.ts already implements every ans*()
// formula behind them).
//
// PHASE 24 SCOPE NOTE / SECURITY: legacy's handleFreeform() fallback
// (js/assessment.js ~8143-8179) calls `fetch('https://api.anthropic.com/v1/
// messages', ...)` directly from the browser with NO api key/auth header at
// all — it was already non-functional in legacy (Anthropic rejects
// unauthenticated requests) and, if ever "fixed" by embedding a real key in
// client code, would leak that key to anyone opening devtools. Per this
// phase's explicit instructions, that call is NOT ported and NO key/backend
// is invented here. Freeform text that isn't matched by localIntentMatch()
// (which covers everything the suggested-question buttons already ask)
// falls straight through to legacy's own UI.aiCantReachMsg string — an
// honest, pre-existing legacy message that already tells the user to
// rephrase or use the buttons, rather than a fake "thinking…" delay ending
// in a network call that could never succeed anyway.
export default function AssessmentAiPage() {
  const { state, lang, ui } = useAssessment()
  const [log, setLog] = useState<LogMessage[]>(() => [{ role: 'bot', text: ui.aiGreeting }])
  const [input, setInput] = useState('')

  const featured = featuredQuestions(lang)
  const suggested = suggestedQuestions(lang)

  function ask(label: string, handler: (s: typeof state, l: typeof lang) => string) {
    const answer = handler(state, lang)
    setLog((prev) => [...prev, { role: 'user', text: label }, { role: 'bot', text: answer }])
  }

  function send() {
    const text = input.trim()
    if (!text) return
    setInput('')
    const local = localIntentMatch(text, state, lang)
    setLog((prev) => [...prev, { role: 'user', text }, { role: 'bot', text: local ?? ui.aiCantReachMsg }])
  }

  return (
    <div>
      {/* Legacy renderAI() has no in-page title/header of its own —
          the Topbar's h1/sub (from PAGE_META_TEXT_EN/IT.ai, already wired
          in AssessmentLayout) is the only heading for this screen. */}
      {/* La pagina occupa l'altezza dello schermo a ogni larghezza e la chat
          tutta la larghezza accanto alle domande (richiesta di Bilal,
          2026-10-13: prima la colonna era fissa a 45rem e restava una casella
          piccola). Messaggi e campo restano centrati alla colonna di lettura
          (max-w-3xl, CLAUDE.md cap. 6): le risposte lunghe non diventano
          righe da un capo all'altro dello schermo. Su schermi stretti le
          domande scorrono in una fascia bassa e la chat prende il resto. */}
      <div className="grid h-[calc(100dvh-12rem)] min-h-96 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:grid-rows-1">
        <div className="flex max-h-48 flex-col gap-2 overflow-y-auto lg:max-h-none">
          <div className="mb-2 flex flex-col gap-2 border-b border-border pb-4">
            <CardLabel>{ui.aiQuickQuestions}</CardLabel>
            {featured.map((q, i) => (
              <Button key={i} variant="outline" className="h-auto justify-start py-2 text-left whitespace-normal" onClick={() => ask(q.label, q.handler)}>
                {q.label}
              </Button>
            ))}
          </div>
          <CardLabel>{ui.aiMoreQuestions}</CardLabel>
          {suggested.map((q, i) => (
            <Button key={i} variant="outline" size="sm" className="h-auto justify-start py-2 text-left whitespace-normal" onClick={() => ask(q.label, q.handler)}>
              {q.label}
            </Button>
          ))}
        </div>
        <Card padding="none" className="min-h-0">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6" aria-live="polite">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            {log.map((m, i) => (
              <ChatMessage from={m.role === 'user' ? 'user' : 'assistant'} key={i}>
                {m.role === 'bot'
                  ? groupBlocks(formatAIBlocks(m.text)).map((b, j) =>
                      b.type === 'ul' ? (
                        <ul key={j}>
                          {b.items.map((item, k) => (
                            <li key={k}>{renderEmphasized(item)}</li>
                          ))}
                        </ul>
                      ) : (
                        <p key={j}>{renderEmphasized(b.text)}</p>
                      ),
                    )
                  : m.text}
              </ChatMessage>
            ))}
            </div>
          </div>
          <div className="border-t border-border p-4">
            <div className="mx-auto flex w-full max-w-3xl gap-3">
            <Input
              type="text"
              aria-label={ui.aiInputPh}
              placeholder={ui.aiInputPh}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send()
              }}
            />
            <Button variant="default" onClick={send}>
              {ui.aiSendBtn}
            </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
