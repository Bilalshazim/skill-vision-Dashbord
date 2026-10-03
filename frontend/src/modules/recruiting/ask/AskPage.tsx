import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Textarea } from '@/components/ui/textarea'
import { ChatMessage } from '@/components/patterns/ChatMessage'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AskAnswerView } from '@/modules/recruiting/ask/AskAnswerView'
import { ScreeningResultView } from '@/modules/recruiting/ask/ScreeningResultView'
import type { AskAnswer, QuickQuestion, ScreeningResult } from '@/modules/recruiting/lib/ask'
import { QUICK_QUESTIONS, composeAnswer, isScreeningPrompt, runLocalScreeningQuery } from '@/modules/recruiting/lib/ask'
import { readCandidates, readCvMatchingState } from '@/modules/recruiting/lib/storage'

type FreeTextState = { kind: 'idle' } | { kind: 'pending' } | { kind: 'answer'; answer: AskAnswer } | { kind: 'screening'; result: ScreeningResult }

type ChatState = { kind: 'idle' } | { kind: 'pending'; index: number } | { kind: 'answered'; index: number; answer: AskAnswer }

const NO_CANDIDATES_ANSWER: AskAnswer = {
  blocks: [
    { type: 'title', parts: ['Nessun candidato in archivio'] },
    { type: 'paragraph', parts: ['Carica i primi CV dalla pagina ', { text: 'CV & Esportazione', bold: true }, ' (o importa in blocco un archivio storico) per vedere qui analisi calcolate sui dati reali.'] },
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
    // Una sola intestazione di pagina e il contenuto nella colonna di
    // lettura (720px): domande e risposte sono testo da leggere (CLAUDE.md,
    // Fase 6). Messaggi e bottoni dalla libreria (ChatMessage, Button).
    <div className="flex max-w-180 flex-col gap-4">
      <PageHeader level="page" className="mb-0" title="Assistente IA" description="Domande sui dati di Recruiting: le risposte sono calcolate sulla classifica attuale." />

      <Card>
        <CardHeader>
          <CardTitle>Domanda libera</CardTitle>
          <CardDescription>
            Un candidato specifico, un&apos;analisi comparativa, l&apos;interpretazione di una classifica…
          </CardDescription>
        </CardHeader>
        <Textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          rows={3}
          placeholder="Es. Quali sono i punti di forza principali di Angeloni Nicola? Chi è il candidato più adatto alla posizione di Assistenza clienti e perché?"
          size="sm"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={handleAnalyze} disabled={freeTextState.kind === 'pending'}>
            {freeTextState.kind === 'pending' ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
            Analizza
          </Button>
          <Button size="sm" variant="outline" onClick={handleClearFreeText}>
            Pulisci
          </Button>
          <span className="text-app-caption text-muted-foreground">Le risposte usano i dati locali della piattaforma</span>
        </div>

        {freeTextState.kind !== 'idle' && (
          <div className="mt-4 border-t border-border pt-4">
            {freeTextState.kind === 'pending' && (
              <p className="inline-flex items-center gap-2 text-app-small text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Analisi in corso…
              </p>
            )}
            {freeTextState.kind === 'answer' && <AskAnswerView answer={freeTextState.answer} />}
            {freeTextState.kind === 'screening' && <ScreeningResultView result={freeTextState.result} />}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domande rapide</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-3">
          {askedQuestions.length === 0 ? (
            <ChatMessage from="assistant">
              <p className="font-medium">Sono l&apos;assistente APEX 5D per la selezione.</p>
              Ho la classifica aggiornata dei candidati per la posizione che hai configurato. Scegli una domanda: le risposte si basano sui
              punteggi veri, non su frasi preconfezionate.
            </ChatMessage>
          ) : (
            <>
              {askedQuestions.map((q, i) => (
                <ChatMessage from="user" key={i}>
                  {q}
                </ChatMessage>
              ))}
              <ChatMessage from="assistant">
                {chatState.kind === 'pending' && (
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Sto pensando…
                  </span>
                )}
                {chatState.kind === 'answered' && (
                  <>
                    <AskAnswerView answer={chatState.answer} />
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => handleOpenSection(QUICK_QUESTIONS[chatState.index].actionTarget)}>
                      Apri la sezione collegata
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </>
                )}
              </ChatMessage>
            </>
          )}
        </div>

        {visibleChips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleChips.map(({ item, index }) => (
              <Button key={item.id} size="sm" variant="outline" onClick={() => handleAskQuick(index)}>
                {item.question}
              </Button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
