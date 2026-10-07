import { Trash2 } from 'lucide-react'

import { InlineAlert } from '@/components/patterns/InlineAlert'
import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { fmtDec } from '@/lib/format'
import { IV_EVAL_BANDS, IV_EVAL_PHASES, IV_SOFT_SKILLS, calcIvEval } from '@/modules/recruiting/lib/interview-protocol'
import type { IvEvalDraft } from '@/modules/recruiting/lib/interview-protocol'
import type { IvEvalPhase, IvEvalReview, IvEvalSoftRow, IvEvalTecRow, IvExtraQuestion } from '@/modules/recruiting/lib/interview-protocol-types'
import { CompareRowsTable } from '@/modules/recruiting/profile-hub/protocol/CompareRowsTable'
import { AddQuestionButton, QuestionLabelInput } from '@/modules/recruiting/profile-hub/protocol/EditableQuestions'
import { CheckBox, CheckRow, ChoiceGroup, DocSection, ScoreSelect } from '@/modules/recruiting/profile-hub/protocol/protocol-ui'

const RECO_KEYS = ['reco_procedi', 'reco_riserva', 'reco_confronta', 'reco_no'] as const
type RecoKey = (typeof RECO_KEYS)[number]
const TEC_ROWS = ['row1', 'row2', 'row3', 'row4'] as const
const SCALE = [
  { n: '1', name: 'Insufficiente', text: 'non soddisfa i requisiti' },
  { n: '2', name: 'Parziale', text: 'li soddisfa in minima parte' },
  { n: '3', name: 'Adeguato', text: 'requisiti minimi attesi' },
  { n: '4', name: 'Buono', text: 'soddisfa pienamente' },
  { n: '5', name: 'Eccellente', text: 'supera le aspettative' },
]
const REVIEW_TITLES = ['1° colloquio', '2° colloquio', '3° colloquio / altro']
type PhaseKey = 'score' | 'score2' | 'score3'
const PHASE_KEYS: PhaseKey[] = ['score', 'score2', 'score3']

// Il corpo della Scheda di valutazione candidato, senza cornice, sul modello
// del cliente: lo usano il dialog dell'Area Valutatore e la pagina dei
// valutatori esterni. Le medie e la fascia si ricalcolano a ogni modifica
// (calcIvEval).
export function IvEvalForm({ draft, onChange }: { draft: IvEvalDraft; onChange: (next: IvEvalDraft) => void }) {
  function set<K extends keyof IvEvalDraft>(key: K, value: IvEvalDraft[K]) {
    onChange({ ...draft, [key]: value })
  }
  function setTec(rowKey: (typeof TEC_ROWS)[number], patch: Partial<IvEvalTecRow>) {
    onChange({ ...draft, tecnica: { ...draft.tecnica, [rowKey]: { ...draft.tecnica[rowKey], ...patch } } })
  }
  function setSoft(name: string, patch: Partial<IvEvalSoftRow>) {
    onChange({ ...draft, soft: { ...draft.soft, [name]: { ...(draft.soft[name] || { score: '', note: '' }), ...patch } } })
  }
  function setExtra(id: string, patch: Partial<IvExtraQuestion>) {
    set('extraQuestions', (draft.extraQuestions ?? []).map((q) => (q.id === id ? { ...q, ...patch } : q)))
  }
  function setPhase(i: number, patch: Partial<IvEvalPhase>) {
    set('percorso', draft.percorso.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  }
  function setReview(i: number, patch: Partial<IvEvalReview>) {
    set('considerazioni', draft.considerazioni.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  }
  // Una sola raccomandazione alla volta.
  function setExclusive(key: RecoKey, checked: boolean) {
    if (!checked) {
      set(key, false)
      return
    }
    onChange({ ...draft, reco_procedi: false, reco_riserva: false, reco_confronta: false, reco_no: false, [key]: true })
  }

  const calc = calcIvEval(draft)
  const needsReason = calc.keysBelow.length > 0 && draft.percorso.some((p) => p.esito === 'Avanti') && !draft.motivazione.trim()

  const scoreCells = (values: string[], onScore: (key: PhaseKey, v: string) => void, label: string) =>
    PHASE_KEYS.map((k, i) => (
      <TableCell key={k}>
        <ScoreSelect value={values[i]} onChange={(v) => onScore(k, v)} label={`${label}, ${IV_EVAL_PHASES[i]} fase`} />
      </TableCell>
    ))

  return (
    <div className="flex flex-col gap-6">
      <DocSection n={1} title="Candidato e posizione">
        <FieldGrid>
          <Field label="Candidato">
            <Input type="text" value={draft.candidateId} onChange={(e) => set('candidateId', e.target.value)} placeholder="Nome e cognome" />
          </Field>
          <Field label="Codice">
            <Input type="text" value={draft.rifCandidatura} onChange={(e) => set('rifCandidatura', e.target.value)} placeholder="Es. CAND-014" />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <Field label="Posizione / ruolo">
            <Input type="text" value={draft.posizione} onChange={(e) => set('posizione', e.target.value)} />
          </Field>
          <Field label="Data apertura scheda">
            <Input type="date" value={draft.dataValutazione} onChange={(e) => set('dataValutazione', e.target.value)} />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <Field label="Referente HR">
            <Input type="text" value={draft.evaluatorName} onChange={(e) => set('evaluatorName', e.target.value)} placeholder="Nome e ruolo" />
          </Field>
          <Field label="Responsabile di linea">
            <Input type="text" value={draft.respLinea} onChange={(e) => set('respLinea', e.target.value)} placeholder="Nome e ruolo" />
          </Field>
        </FieldGrid>
      </DocSection>

      <DocSection n={2} title="Come si usa e scala di valutazione">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SCALE.map((s) => (
            <li key={s.n} className="flex flex-col gap-1 rounded-sm border border-border bg-muted p-3">
              <span className="flex items-baseline gap-2">
                <span className="font-mono text-app-section text-foreground tabular-nums">{s.n}</span>
                <span className="text-app-small font-semibold text-foreground">{s.name}</span>
              </span>
              <span className="text-app-caption text-muted-foreground">{s.text}</span>
            </li>
          ))}
        </ul>
        <ol className="flex flex-col gap-1 text-app-small text-foreground">
          <li>
            <span className="mr-2 font-mono text-muted-foreground">1.</span>Dopo ogni colloquio compili la colonna della fase (sez. 4) e scriva le sue considerazioni (sez. 6).
          </li>
          <li>
            <span className="mr-2 font-mono text-muted-foreground">2.</span>Alla fase successiva parta da ciò che ha scritto: i dubbi aperti diventano le domande da fare.
          </li>
          <li>
            <span className="mr-2 font-mono text-muted-foreground">3.</span>A fine processo compili fascia (sez. 5), raccomandazione (sez. 7) e confronto (sez. 8).
          </li>
        </ol>
      </DocSection>

      <DocSection n={3} title="Percorso del candidato" hint="Una riga per ogni fase svolta.">
        <Table frame size="sm" minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>Fase</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Con chi</TableHead>
              <TableHead>Esito della fase</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draft.percorso.map((p, i) => (
              // eslint-disable-next-line react/no-array-index-key -- le fasi sono quattro righe fisse, il nome è modificabile
              <TableRow key={i}>
                <TableCell>
                  <Input type="text" size="sm" aria-label={`Nome della fase ${i + 1}`} value={p.fase} onChange={(e) => setPhase(i, { fase: e.target.value })} />
                </TableCell>
                <TableCell>
                  <Input type="date" size="sm" aria-label={`Data, fase ${i + 1}`} value={p.data} onChange={(e) => setPhase(i, { data: e.target.value })} />
                </TableCell>
                <TableCell>
                  <Input type="text" size="sm" aria-label={`Con chi, fase ${i + 1}`} value={p.conChi} onChange={(e) => setPhase(i, { conChi: e.target.value })} />
                </TableCell>
                <TableCell>
                  <ChoiceGroup hideLabel label={`Esito, fase ${i + 1}`} value={p.esito} onChange={(v) => setPhase(i, { esito: v })} options={['Avanti', 'Stand-by', 'Non idoneo']} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-app-caption text-muted-foreground">Nella prima colonna può modificare il nome della fase in base al processo reale di questa selezione.</p>
      </DocSection>

      <DocSection n={4} title="Matrice di valutazione" hint="Punteggio 1–5 per ogni fase; lasci vuoto ciò che non è stato valutato.">
        <Table frame size="sm" minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>Criterio</TableHead>
              <TableHead>Chiave</TableHead>
              {IV_EVAL_PHASES.map((p) => (
                <TableHead key={p}>{p}</TableHead>
              ))}
              <TableHead>Note e considerazioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted">
              <TableCell colSpan={6} className="label-mono text-muted-foreground">
                Competenze tecniche · scriva i criteri del ruolo (dalla sezione 5 del verbale di colloquio)
              </TableCell>
            </TableRow>
            {TEC_ROWS.map((rowKey, i) => {
              const r = draft.tecnica[rowKey]
              return (
                <TableRow key={rowKey} className="align-top">
                  <TableCell>
                    <Input type="text" size="sm" aria-label={`Criterio tecnico ${i + 1}`} value={r.label} onChange={(e) => setTec(rowKey, { label: e.target.value })} placeholder={`Es. Competenza tecnica ${i + 1}`} />
                  </TableCell>
                  <TableCell>
                    <Checkbox aria-label={`Criterio chiave: tecnico ${i + 1}`} checked={!!r.key} onCheckedChange={(c) => setTec(rowKey, { key: c === true })} />
                  </TableCell>
                  {PHASE_KEYS.map((k, p) => (
                    <TableCell key={k}>
                      <ScoreSelect value={r[k] ?? ''} onChange={(v) => setTec(rowKey, { [k]: v })} label={`Criterio tecnico ${i + 1}, ${IV_EVAL_PHASES[p]} fase`} />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Input type="text" size="sm" aria-label={`Note, criterio tecnico ${i + 1}`} value={r.note} onChange={(e) => setTec(rowKey, { note: e.target.value })} />
                  </TableCell>
                </TableRow>
              )
            })}
            <TableRow className="bg-muted">
              <TableCell colSpan={6} className="label-mono text-muted-foreground">
                Competenze trasversali e attitudinali · comuni a ogni ruolo, modificabili
              </TableCell>
            </TableRow>
            {IV_SOFT_SKILLS.map((name) => {
              const r = draft.soft[name] || { score: '', note: '' }
              return (
                <TableRow key={name} className="align-top">
                  <TableCell>
                    <QuestionLabelInput original={name} labels={draft.softLabels} onChange={(softLabels) => set('softLabels', softLabels)} />
                  </TableCell>
                  <TableCell>
                    <Checkbox aria-label={`Criterio chiave: ${name}`} checked={!!r.key} onCheckedChange={(c) => setSoft(name, { key: c === true })} />
                  </TableCell>
                  {PHASE_KEYS.map((k, p) => (
                    <TableCell key={k}>
                      <ScoreSelect value={r[k] ?? ''} onChange={(v) => setSoft(name, { [k]: v })} label={`${name}, ${IV_EVAL_PHASES[p]} fase`} />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Input type="text" size="sm" aria-label={`Note: ${name}`} value={r.note} onChange={(e) => setSoft(name, { note: e.target.value })} />
                  </TableCell>
                </TableRow>
              )
            })}
            {(draft.extraQuestions ?? []).map((q, i) => (
              <TableRow key={q.id} className="align-top">
                <TableCell>
                  <Input type="text" size="sm" aria-label={`Testo del criterio aggiunto ${i + 1}`} placeholder="Scrivi il criterio" value={q.label} onChange={(e) => setExtra(q.id, { label: e.target.value })} />
                </TableCell>
                <TableCell className="text-app-caption text-muted-foreground">Aggiunto</TableCell>
                {scoreCells([q.score, q.score2 ?? '', q.score3 ?? ''], (k, v) => setExtra(q.id, { [k]: v }), `Criterio aggiunto ${i + 1}`)}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input type="text" size="sm" aria-label={`Note, criterio aggiunto ${i + 1}`} value={q.note} onChange={(e) => setExtra(q.id, { note: e.target.value })} />
                    <Button type="button" variant="ghost" size="icon" aria-label="Rimuovi il criterio" onClick={() => set('extraQuestions', (draft.extraQuestions ?? []).filter((x) => x.id !== q.id))}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted font-semibold">
              <TableCell className="label-mono text-foreground">Media della fase</TableCell>
              <TableCell />
              {calc.phaseAverage.map((m, i) => (
                <TableCell key={IV_EVAL_PHASES[i]} className="font-mono tabular-nums">
                  {m == null ? '—' : fmtDec(m, 2)}
                </TableCell>
              ))}
              <TableCell className="text-app-caption font-normal text-muted-foreground">Somma dei punteggi ÷ numero di criteri valutati</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <AddQuestionButton rows={draft.extraQuestions} onChange={(q) => set('extraQuestions', q)} label="Aggiungi un criterio" />
        <p className="text-app-caption text-muted-foreground">
          <b className="font-medium text-foreground">Chiave</b> = criterio indispensabile per il ruolo: se in una fase scende sotto 3, l’esito non può essere “Avanti” senza una motivazione scritta.
        </p>
        {needsReason && (
          <InlineAlert tone="warning" layout="text">
            {calc.keysBelow.join(', ')}: criterio chiave sotto 3 con un esito “Avanti”. Scrivi la motivazione alla sezione 7.
          </InlineAlert>
        )}
      </DocSection>

      <DocSection n={5} title="Fascia di idoneità" hint="In base alla media dell’ultima fase e ai criteri chiave.">
        <Table frame size="sm" minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>Media</TableHead>
              <TableHead>Significato</TableHead>
              <TableHead>Fascia attuale</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {IV_EVAL_BANDS.map((b, i) => (
              <TableRow key={b.range} data-state={calc.band === i ? 'selected' : undefined}>
                <TableCell className="font-mono font-semibold text-foreground tabular-nums">{b.range}</TableCell>
                <TableCell>
                  <b className="font-medium text-foreground">{b.label}</b> — {b.text}
                </TableCell>
                <TableCell>{calc.band === i && <Badge tone="strong">Fascia attuale</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-app-small text-foreground">
          <b className="font-semibold">Media finale:</b> <span className="font-mono tabular-nums">{calc.finalScore == null ? '—' : fmtDec(calc.finalScore, 2)}</span> / 5
          <span className="mx-3 text-muted-foreground">·</span>
          <b className="font-semibold">Criteri chiave sotto 3:</b> {calc.finalScore == null ? '—' : calc.keysBelow.length ? `Sì → ${calc.keysBelow.join(', ')}` : 'Nessuno'}
        </p>
      </DocSection>

      <DocSection n={6} title="Considerazioni dell’HR" hint="Il diario del processo: cosa è emerso, cosa resta da chiarire.">
        <div className="flex flex-col gap-4">
          {draft.considerazioni.map((r, i) => (
            // eslint-disable-next-line react/no-array-index-key -- tre blocchi fissi, uno per colloquio
            <div key={i} className="flex flex-col gap-3 rounded-sm border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="label-mono text-foreground">{REVIEW_TITLES[i] ?? `Colloquio ${i + 1}`}</span>
                <Field label="Data" className="w-44">
                  <Input type="date" size="sm" value={r.data} onChange={(e) => setReview(i, { data: e.target.value })} />
                </Field>
              </div>
              <FieldGrid>
                <Field label="Cosa è emerso">
                  <Textarea value={r.emerso} onChange={(e) => setReview(i, { emerso: e.target.value })} />
                </Field>
                <Field label="Da approfondire nella fase successiva">
                  <Textarea value={r.approfondire} onChange={(e) => setReview(i, { approfondire: e.target.value })} />
                </Field>
              </FieldGrid>
              <ChoiceGroup label="Andamento rispetto alla fase precedente" value={r.andamento} onChange={(v) => setReview(i, { andamento: v })} options={['Migliora', 'Stabile', 'Cala', 'n.a.']} />
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection n={7} title="Raccomandazione finale">
        <CheckBox>
          <CheckRow checked={draft.reco_procedi} onChange={(c) => setExclusive('reco_procedi', c)}>
            Procedere con l&apos;assunzione / fase successiva
          </CheckRow>
          <CheckRow checked={draft.reco_riserva} onChange={(c) => setExclusive('reco_riserva', c)}>
            Inserire in lista di riserva (idoneo non prioritario)
          </CheckRow>
          <CheckRow checked={draft.reco_confronta} onChange={(c) => setExclusive('reco_confronta', c)}>
            Confrontare con altri candidati prima della decisione
          </CheckRow>
          <CheckRow checked={draft.reco_no} onChange={(c) => setExclusive('reco_no', c)}>
            Non idoneo per la posizione
          </CheckRow>
        </CheckBox>
        <Field label="Motivazione della decisione (in parole sue)">
          <Textarea value={draft.motivazione} onChange={(e) => set('motivazione', e.target.value)} />
        </Field>
        <Field label="Punti da definire prima dell’offerta / condizioni">
          <Textarea value={draft.puntiDaDefinire} onChange={(e) => set('puntiDaDefinire', e.target.value)} />
        </Field>
      </DocSection>

      <DocSection n={8} title="Confronto tra candidati" hint="Facoltativo: solo se più candidati per la stessa posizione.">
        <CompareRowsTable scoreLabel="Media" noteLabel="Punto distintivo" note2Label="Dubbio / rischio" scoreKind="number" rows={draft.compareRows} onChange={(rows) => set('compareRows', rows)} />
      </DocSection>

      <FieldGrid>
        <Field label="Referente HR (nome e firma)">
          <Input type="text" value={draft.firma} onChange={(e) => set('firma', e.target.value)} placeholder="Nome e cognome" />
        </Field>
        <Field label="Responsabile di linea / direzione (visto)">
          <Input type="text" value={draft.vistoLinea} onChange={(e) => set('vistoLinea', e.target.value)} placeholder="Nome e cognome" />
        </Field>
      </FieldGrid>
      <Field label="Data" className="sm:max-w-xs">
        <Input type="date" value={draft.dataFirma} onChange={(e) => set('dataFirma', e.target.value)} />
      </Field>
    </div>
  )
}
