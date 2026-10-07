import { fmtDec } from '@/lib/format'
import { IV_SOFT_SKILLS, IVN_SOFT_SKILLS, IVN_SUMMARY_AREAS } from '@/modules/recruiting/lib/interview-protocol'
import type { IvEvalRecord, IvNotesRecord } from '@/modules/recruiting/lib/interview-protocol-types'

const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})
const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

function Line({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      <dt className="label-mono text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-app-small text-foreground">{value}</dd>
    </div>
  )
}

function ScoreRows({ rows }: { rows: { label: string; score: string; note: string }[] }) {
  const filled = rows.filter((r) => r.score || r.note)
  if (!filled.length) return null
  return (
    <table className="w-full border-collapse text-app-caption">
      <tbody>
        {filled.map((r) => (
          <tr key={r.label} className="border-b border-border last:border-b-0 align-top">
            <th scope="row" className="py-1 pr-3 text-left font-normal text-muted-foreground">
              {r.label}
            </th>
            <td className="py-1 pr-3 text-right font-mono tabular-nums text-foreground">{r.score ? `${r.score}/5` : '—'}</td>
            <td className="py-1 text-muted-foreground">{r.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const NOTES_ESITO: [keyof IvNotesRecord, string][] = [
  ['esitoProcedi', 'Procedere alla fase successiva'],
  ['esitoStandby', 'Stand-by (idoneo ma non prioritario)'],
  ['esitoAlternativo', 'Proporre per un ruolo alternativo'],
  ['esitoNonIdoneo', 'Non idoneo per la posizione'],
]
const EVAL_RECO: [keyof IvEvalRecord, string][] = [
  ['reco_procedi', 'Procedere con l’assunzione / fase successiva'],
  ['reco_riserva', 'Lista di riserva'],
  ['reco_confronta', 'Confrontare con altri candidati'],
  ['reco_no', 'Non idoneo'],
]

// Le due schede di una valutazione, in sola lettura: quello che un valutatore
// ha scritto, senza i campi di intestazione (nomi, riferimenti, firme). Lo usa
// la pagina del valutatore dopo l'invio e il responsabile nella vista
// multi-valutatore.
export type FormKind = 'verbale' | 'valutazione'

// Quali delle due schede un valutatore ha davvero compilato.
export function receivedForms(scores: Record<string, unknown> | undefined): Record<FormKind, boolean> {
  return { verbale: Object.keys(asRecord(scores?.verbale)).length > 0, valutazione: Object.keys(asRecord(scores?.valutazione)).length > 0 }
}

// `only`: mostra una sola delle due schede (i pulsanti "Apri verbale" /
// "Apri valutazione" del responsabile); senza, le mostra entrambe.
export function EvaluationFormsView({ scores, only }: { scores: Record<string, unknown> | undefined; only?: FormKind }) {
  const v = asRecord(scores?.verbale)
  const w = asRecord(scores?.valutazione)
  const hasAny = Object.keys(v).length > 0 || Object.keys(w).length > 0
  if (!hasAny) return <p className="text-app-caption text-muted-foreground">Nessuna scheda compilata: solo punteggio e raccomandazione.</p>

  const vSoft = asRecord(v.soft)
  const vTec = asRecord(v.tecnica)
  const wSoft = asRecord(w.soft)
  const wTec = asRecord(w.tecnica)
  const extras = (x: unknown) => (Array.isArray(x) ? x : []).map((q) => ({ label: text(asRecord(q).label) || 'Domanda aggiunta', score: text(asRecord(q).score), note: text(asRecord(q).note) }))
  const verbaleRows = [
    ...Object.values(vTec).map((r, i) => ({ label: text(asRecord(r).area) || `Competenza tecnica ${i + 1}`, score: text(asRecord(r).score), note: text(asRecord(r).note) })),
    ...IVN_SOFT_SKILLS.map((name) => ({ label: text(asRecord(v.softLabels)[name]) || name, score: text(asRecord(vSoft[name]).score), note: text(asRecord(vSoft[name]).note) })),
    ...extras(v.extraQuestions),
    ...IVN_SUMMARY_AREAS.map((name) => ({ label: `Riepilogo — ${name}`, score: text(asRecord(asRecord(v.riepilogo)[name]).score), note: text(asRecord(asRecord(v.riepilogo)[name]).note) })),
  ]
  const evalRows = [
    ...Object.values(wTec).map((r, i) => ({ label: text(asRecord(r).label) || `Competenza tecnica ${i + 1}`, score: text(asRecord(r).score), note: text(asRecord(r).note) })),
    ...IV_SOFT_SKILLS.map((name) => ({ label: text(asRecord(w.softLabels)[name]) || name, score: text(asRecord(wSoft[name]).score), note: text(asRecord(wSoft[name]).note) })),
    ...extras(w.extraQuestions),
  ]
  const esito = NOTES_ESITO.filter(([k]) => v[k] === true).map(([, l]) => l).join(', ')
  const reco = EVAL_RECO.filter(([k]) => w[k] === true).map(([, l]) => l).join(', ')
  const finalNum = parseFloat(text(w.finalScore))

  return (
    <div className="flex flex-col gap-5">
      {only !== 'valutazione' && (
      <section className="flex flex-col gap-3">
        <h4 className="text-app-small font-semibold text-foreground">Verbale di colloquio (intervista strutturata)</h4>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Line label="Data" value={text(v.data)} />
          <Line label="Ora" value={text(v.ora)} />
          <Line label="Modalità" value={text(v.modalita)} />
          <Line label="Durata" value={text(v.durata)} />
          <Line label="Canale di candidatura" value={text(v.canaleCandidatura)} />
          <Line label="Fase del processo" value={text(v.faseProcesso)} />
          <Line label="Intervistatori" value={text(v.intervistatori)} />
        </dl>
        <ScoreRows rows={verbaleRows} />
        <dl className="flex flex-col gap-3">
          <Line label="Domande e risposte" value={text(v.qa)} />
          <Line label="Punti di forza" value={text(v.puntiForza)} />
          <Line label="Miglioramenti e rischi" value={text(v.areeMiglioramento)} />
          <Line label="Giudizio sintetico" value={text(v.giudizioSintetico)} />
          <Line label="Punteggio complessivo" value={text(v.punteggioComplessivo) ? `${text(v.punteggioComplessivo)}/5` : ''} />
          <Line label="Esito del colloquio" value={esito} />
          <Line label="Prossimo passo" value={text(v.prossimoPasso)} />
          <Line label="Motivazione" value={text(v.motivazioneDecisione)} />
          <Line label="Note aggiuntive" value={text(v.noteAggiuntive)} />
        </dl>
      </section>
      )}
      {only !== 'verbale' && (
      <section className="flex flex-col gap-3">
        <h4 className="text-app-small font-semibold text-foreground">Scheda di valutazione candidato</h4>
        <dl className="grid grid-cols-2 gap-3">
          <Line label="Data valutazione" value={text(w.dataValutazione)} />
          <Line label="Valutatore" value={text(w.evaluatorName)} />
        </dl>
        <ScoreRows rows={evalRows} />
        <dl className="flex flex-col gap-3">
          <Line label="Punteggio finale (0–5)" value={Number.isNaN(finalNum) ? '' : fmtDec(finalNum, 2)} />
          <Line label="Raccomandazione" value={reco} />
          <Line label="Motivazione" value={text(w.motivazione)} />
          <Line label="Punti da definire prima dell’offerta" value={text(w.puntiDaDefinire)} />
        </dl>
      </section>
      )}
    </div>
  )
}
