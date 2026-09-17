import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { AskAnswerView } from '@/modules/recruiting/ask/AskAnswerView'
import { ScreeningResultView } from '@/modules/recruiting/ask/ScreeningResultView'
import type { AskAnswer, QuickQuestion, ScreeningResult } from '@/modules/recruiting/lib/ask'
import { QUICK_QUESTIONS, composeAnswer, isScreeningPrompt, runLocalScreeningQuery } from '@/modules/recruiting/lib/ask'
import { readCandidates, readCvMatchingState } from '@/modules/recruiting/lib/storage'

const textareaClass =
  'w-full min-h-[70px] resize-y rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
const primaryBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[12px] font-bold text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60'
const ghostBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3.5 py-1.5 text-[12px] font-bold text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
const chipClass =
  'rounded-full border border-border bg-secondary px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-ring hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

type FreeTextState = { kind: 'idle' } | { kind: 'pending' } | { kind: 'answer'; answer: AskAnswer } | { kind: 'screening'; result: ScreeningResult }

type ChatState = { kind: 'idle' } | { kind: 'pending'; index: number } | { kind: 'answered'; index: number; answer: AskAnswer }

const NO_CANDIDATES_ANSWER: AskAnswer = {
  blocks: [
    { type: 'title', parts: ['Nessun candidato in archivio'] },
    { type: 'paragraph', parts: ['Carica i primi CV dalla pagina ', { text: 'CV & Export', bold: true }, ' (o importa in blocco un archivio storico) per vedere qui analisi calcolate sui dati reali.'] },
  ],
}
const INSUFFICIENT_DATA_ANSWER: AskAnswer = {
  blocks: [
    { type: 'title', parts: ['Dati insufficienti'] },
    { type: 'paragraph', parts: ['Servono più candidati o valutazioni per calcolare questa risposta.'] },
  ],
}

// PHASE 22 — every actionTarget now has a real React route (the last gap,
// 'profilo', was filled by Phase 20's Profilo della ricerca hub), so this
// is a plain lookup, not the optional map with a legacy-bridge fallback it
// used to be.
const ACTION_ROUTES: Record<QuickQuestion['actionTarget'], string> = {
  ranking: '/recruiting/ranking',
  match: '/recruiting/match',
  formule: '/recruiting/metodo',
  profilo: '/recruiting/profile',
}

// Migrated from modules/recruiting.html #scr-ai ("Chiedi a Skill-Vision AI" +
// "Chiedi al Recruiting Lab", ~578-602) — askAI()/_composeAnswer() and the
// QS quick-question chips (~3316-3382, ~5037-5163), plus the local
// pre-screening query engine (~5165-5370, via lib/ask.ts). See that file's
// header comment for the two things deliberately NOT reproduced (the
// Claude API branch and the backend /api/prescreen fetch) and why. 100%
// read-only: no writes, no localStorage keys touched by this screen.
export default function AskPage() {
  const navigate = useNavigate()
  const candidates = useMemo(() => readCandidates(), [])
  const cvState = useMemo(() => readCvMatchingState(), [])

  const [freeText, setFreeText] = useState('')
  const [freeTextState, setFreeTextState] = useState<FreeTextState>({ kind: 'idle' })

  const [askedQuestions, setAskedQuestions] = useState<string[]>([])
  const [chatState, setChatState] = useState<ChatState>({ kind: 'idle' })

  function handleAnalyze() {
    const q = freeText.trim()
    if (!q) {
      setFreeTextState({ kind: 'idle' })
      return
    }
    setFreeTextState({ kind: 'pending' })
    setTimeout(() => {
      if (isScreeningPrompt(q)) {
        setFreeTextState({ kind: 'screening', result: runLocalScreeningQuery(q, candidates, cvState) })
      } else {
        setFreeTextState({ kind: 'answer', answer: composeAnswer(q, candidates) })
      }
    }, 300)
  }
  function handleClearFreeText() {
    setFreeText('')
    setFreeTextState({ kind: 'idle' })
  }

  function handleAskQuick(index: number) {
    if (chatState.kind === 'pending') return
    setAskedQuestions((prev) => [...prev, QUICK_QUESTIONS[index].question])
    setChatState({ kind: 'pending', index })
    setTimeout(() => {
      if (!candidates.length) {
        setChatState({ kind: 'answered', index, answer: NO_CANDIDATES_ANSWER })
        return
      }
      try {
        setChatState({ kind: 'answered', index, answer: QUICK_QUESTIONS[index].build(candidates) })
      } catch {
        setChatState({ kind: 'answered', index, answer: INSUFFICIENT_DATA_ANSWER })
      }
    }, 900)
  }

  function handleOpenSection(target: QuickQuestion['actionTarget']) {
    navigate(ACTION_ROUTES[target])
  }

  const allChips = QUICK_QUESTIONS.map((item, index) => ({ item, index }))
  const visibleChips = chatState.kind === 'pending' ? [] : chatState.kind === 'answered' ? allChips.filter((c) => c.index !== chatState.index) : allChips

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card shadow-sm p-4">
        <h3 className="text-[15px] font-semibold">💬 Chiedi a Skill-Vision AI</h3>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Fai una domanda libera sui dati della piattaforma: un candidato specifico, un'analisi comparativa, l'interpretazione di un ranking…
        </p>
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          rows={3}
          placeholder="Es. Quali sono i punti di forza principali di Angeloni Nicola? Chi è il candidato più adatto al ruolo di ASSISTENZA CLIENTI e perché?"
          className={cn(textareaClass, 'mt-3')}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleAnalyze} disabled={freeTextState.kind === 'pending'} className={primaryBtnClass}>
            {freeTextState.kind === 'pending' ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />}
            Analizza
          </button>
          <button type="button" onClick={handleClearFreeText} className={ghostBtnClass}>
            Pulisci
          </button>
          <span className="text-[11px] text-muted-foreground">Le risposte usano dati locali della piattaforma</span>
        </div>

        {freeTextState.kind !== 'idle' && (
          <div className="mt-4 border-t border-border pt-4">
            {freeTextState.kind === 'pending' && <p className="text-[12.5px] text-muted-foreground">⏳ Analisi in corso…</p>}
            {freeTextState.kind === 'answer' && <AskAnswerView answer={freeTextState.answer} />}
            {freeTextState.kind === 'screening' && <ScreeningResultView result={freeTextState.result} />}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary">
          <Sparkles className="size-[22px] text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Chiedi al Recruiting Lab</h2>
          <p className="text-[13px] text-muted-foreground">Le risposte sono calcolate sui dati reali della classifica attuale</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm p-4">
        <div className="flex flex-col gap-3">
          {askedQuestions.length === 0 ? (
            <div className="rounded-md bg-secondary px-3.5 py-2.5 text-[13px]">
              <div className="font-semibold">Sono l'assistente APEX 5D per la selezione.</div>
              Ho la classifica aggiornata dei candidati per il ruolo che hai configurato. Tocca una domanda — le risposte si basano sui punteggi veri,
              non su frasi preconfezionate.
            </div>
          ) : (
            <>
              {askedQuestions.map((q, i) => (
                <div key={i} className="ml-auto max-w-[85%] rounded-md bg-primary/10 px-3.5 py-2 text-[13px] font-medium text-foreground">
                  {q}
                </div>
              ))}
              <div className="max-w-[85%] rounded-md bg-secondary px-3.5 py-2.5 text-[13px]">
                {chatState.kind === 'pending' && (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
                    Sto pensando…
                  </span>
                )}
                {chatState.kind === 'answered' && (
                  <>
                    <AskAnswerView answer={chatState.answer} />
                    <button type="button" onClick={() => handleOpenSection(QUICK_QUESTIONS[chatState.index].actionTarget)} className={cn(primaryBtnClass, 'mt-3.5')}>
                      Apri la sezione collegata
                      <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {visibleChips.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-2">
            {visibleChips.map(({ item, index }) => (
              <button key={item.id} type="button" onClick={() => handleAskQuick(index)} className={chipClass}>
                {item.question}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
