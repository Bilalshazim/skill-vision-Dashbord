import { calcIvEval, normalizeIvEvalDraft, normalizeIvNotesDraft } from '@/modules/recruiting/lib/interview-protocol'
import type { IvEvalDraft, IvNotesDraft } from '@/modules/recruiting/lib/interview-protocol'

// Le due schede compilate da un valutatore esterno viaggiano insieme dentro
// `Evaluation.scores` (Json sul server): `{ verbale, valutazione }`. I campi
// riassuntivi dell'Evaluation (punteggio, raccomandazione, note) si ricavano
// dalla Scheda di Valutazione Candidato, così chi guarda l'elenco dei
// valutatori li ha senza aprire le schede.
export type EvaluationForms = { verbale: IvNotesDraft; valutazione: IvEvalDraft }

type RecommendationValue = 'PROCEDI' | 'RISERVA' | 'CONFRONTA' | 'NO'

export const RECOMMENDATION_LABEL: Record<RecommendationValue, string> = { PROCEDI: 'Procedi', RISERVA: 'Riserva', CONFRONTA: 'Confronta', NO: 'No' }

export function formsFromScores(scores: Record<string, unknown> | undefined, defaults: { posizione: string; candidato: string; valutatore: string }): EvaluationForms {
  const verbale = normalizeIvNotesDraft(scores?.verbale as Partial<IvNotesDraft> | undefined, defaults.posizione)
  const valutazione = normalizeIvEvalDraft(scores?.valutazione as Partial<IvEvalDraft> | undefined, defaults.posizione)
  return {
    verbale: { ...verbale, nominativo: verbale.nominativo || defaults.candidato },
    valutazione: { ...valutazione, candidateId: valutazione.candidateId || defaults.candidato, evaluatorName: valutazione.evaluatorName || defaults.valutatore },
  }
}

export function summaryFromForms(forms: EvaluationForms): { finalScore?: number; recommendation?: RecommendationValue; notes?: string } {
  const calc = calcIvEval(forms.valutazione)
  const v = forms.valutazione
  const recommendation: RecommendationValue | undefined = v.reco_procedi ? 'PROCEDI' : v.reco_riserva ? 'RISERVA' : v.reco_confronta ? 'CONFRONTA' : v.reco_no ? 'NO' : undefined
  const notes = (v.motivazione || forms.verbale.motivazioneDecisione || '').trim()
  return {
    finalScore: calc.finalScore == null ? undefined : Math.round(calc.finalScore * 100) / 100,
    recommendation,
    notes: notes || undefined,
  }
}

export function scoresPayload(forms: EvaluationForms): Record<string, unknown> {
  const calc = calcIvEval(forms.valutazione)
  return { verbale: forms.verbale, valutazione: { ...forms.valutazione, finalScore: calc.finalScore == null ? '' : calc.finalScore.toFixed(2) } }
}
