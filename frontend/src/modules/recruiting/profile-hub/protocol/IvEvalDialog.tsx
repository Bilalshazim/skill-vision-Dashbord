import { NotebookPen } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { IV_SOFT_SKILLS, calcIvEval, clearIvEval, loadIvEvalDraft, loadIvEvalRecord, saveIvEval } from '@/modules/recruiting/lib/interview-protocol'
import type { IvEvalDraft } from '@/modules/recruiting/lib/interview-protocol'
import type { IvEvalSoftRow, IvEvalTecRow } from '@/modules/recruiting/lib/interview-protocol-types'
import { CompareRowsTable } from '@/modules/recruiting/profile-hub/protocol/CompareRowsTable'
import { CheckRow, Field, Grid2, ModalEyebrow, SectionLabel } from '@/modules/recruiting/profile-hub/protocol/protocol-ui'
import { dangerBtnClass, ghostBtnClass, inputClass, primaryBtnClass, selectClass, tableClass, tableWrapClass, tdClass, textareaClass, thClass, totalRowClass } from '@/modules/recruiting/profile-hub/protocol/protocol-styles'

const RECO_KEYS = ['reco_procedi', 'reco_riserva', 'reco_confronta', 'reco_no'] as const
type RecoKey = (typeof RECO_KEYS)[number]
const TEC_ROWS = ['row1', 'row2', 'row3', 'row4'] as const
const SCORE_1_5 = ['1', '2', '3', '4', '5']

// Migrated from the "Scheda di Valutazione Candidato" modal (ivEvalModalOv,
// modules/recruiting.html ~815-913, openIvEvalModal()/collectIvEvalForm()/
// saveIvEvalForm()/clearIvEvalForm() ~4641-4701, ivEvalRecalc() ~4596-4624).
// Role-scoped only — `candidateId` is a free-text field the evaluator
// types (e.g. "CAND-014"), never a real Pipeline/CANDIDATES reference.
//
// The weighted-average calculation (calcIvEval, lib/interview-protocol.ts)
// is PROTOCOLLO-SPECIFIC and entirely independent of scoring.ts — recomputed
// live on every render from the current draft, exactly mirroring legacy's
// live oninput/onchange -> ivEvalRecalc() re-render on every keystroke.
export function IvEvalDialog({ role, savedAt, onSavedAtChange }: { role: string; savedAt: number | null; onSavedAtChange: (savedAt: number | null) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<IvEvalDraft>(() => loadIvEvalDraft(role))

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setDraft(loadIvEvalDraft(role))
  }

  function set<K extends keyof IvEvalDraft>(key: K, value: IvEvalDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }
  function setTec(rowKey: (typeof TEC_ROWS)[number], patch: Partial<IvEvalTecRow>) {
    setDraft((prev) => ({ ...prev, tecnica: { ...prev.tecnica, [rowKey]: { ...prev.tecnica[rowKey], ...patch } } }))
  }
  function setSoft(name: string, patch: Partial<IvEvalSoftRow>) {
    setDraft((prev) => ({ ...prev, soft: { ...prev.soft, [name]: { ...(prev.soft[name] || { score: '', note: '' }), ...patch } } }))
  }
  // Ported verbatim from iveExclusiveReco() (~4637-4640).
  function setExclusive(key: RecoKey, checked: boolean) {
    if (!checked) {
      set(key, false)
      return
    }
    setDraft((prev) => ({ ...prev, reco_procedi: false, reco_riserva: false, reco_confronta: false, reco_no: false, [key]: true }))
  }

  function handleSave() {
    saveIvEval(role, draft)
    onSavedAtChange(loadIvEvalRecord(role)?.savedAt ?? null)
    setOpen(false)
  }
  function handleClear() {
    clearIvEval(role)
    onSavedAtChange(null)
    setOpen(false)
  }

  const calc = calcIvEval(draft.tecnica, draft.soft, draft.areaWeightTec, draft.areaWeightSoft)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" onClick={(e) => e.stopPropagation()} className={primaryBtnClass}>
          {savedAt != null ? 'Modifica scheda →' : 'Compila scheda →'}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl lg:max-w-4xl">
        <DialogHeader>
          <ModalEyebrow>Documento interno — Selezione del personale</ModalEyebrow>
          <DialogTitle className="flex items-center gap-2">
            <NotebookPen className="size-4 shrink-0" aria-hidden="true" />
            Scheda di Valutazione Candidato
          </DialogTitle>
          <DialogDescription>
            Ruolo: <b className="font-semibold text-foreground">&quot;{role}&quot;</b>
          </DialogDescription>
        </DialogHeader>

        <Grid2>
          <Field label="Posizione ricercata">
            <input type="text" value={draft.posizione} onChange={(e) => set('posizione', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Rif. candidatura">
            <input type="text" value={draft.rifCandidatura} onChange={(e) => set('rifCandidatura', e.target.value)} placeholder="Es. REF-2026-014" className={inputClass} />
          </Field>
        </Grid2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Nominativo candidato [cod./data]">
            <input type="text" value={draft.candidateId} onChange={(e) => set('candidateId', e.target.value)} placeholder="Es. CAND-014" className={inputClass} />
          </Field>
          <Field label="Data valutazione">
            <input type="date" value={draft.dataValutazione} onChange={(e) => set('dataValutazione', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Valutatore">
            <input type="text" value={draft.evaluatorName} onChange={(e) => set('evaluatorName', e.target.value)} placeholder="Nome e ruolo" className={inputClass} />
          </Field>
        </div>

        <SectionLabel>1. Legenda della scala di valutazione</SectionLabel>
        <div className="text-[12px] leading-[1.9] text-muted-foreground">
          <p>
            <b className="text-foreground">1</b> Insufficiente — non soddisfa i requisiti richiesti
          </p>
          <p>
            <b className="text-foreground">2</b> Parziale — soddisfa solo in minima parte i requisiti
          </p>
          <p>
            <b className="text-foreground">3</b> Adeguato — soddisfa i requisiti minimi attesi
          </p>
          <p>
            <b className="text-foreground">4</b> Buono — soddisfa pienamente le aspettative
          </p>
          <p>
            <b className="text-foreground">5</b> Eccellente — supera le aspettative del ruolo
          </p>
        </div>

        <SectionLabel>2. Matrice di valutazione — Competenze tecniche</SectionLabel>
        <p className="text-[11.5px] text-muted-foreground">Adattare le righe e i pesi (%) in base al ruolo specifico. La somma dei pesi in quest&apos;area deve essere pari a 100%.</p>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Area / criterio</th>
                <th className={thClass}>Peso %</th>
                <th className={thClass}>Punteggio (1–5)</th>
                <th className={thClass}>Punteggio pesato</th>
                <th className={thClass}>Note</th>
              </tr>
            </thead>
            <tbody>
              {TEC_ROWS.map((rowKey, i) => (
                <tr key={rowKey}>
                  <td className={tdClass}>
                    <input type="text" value={draft.tecnica[rowKey].label} onChange={(e) => setTec(rowKey, { label: e.target.value })} placeholder={`Es. Competenza tecnica ${i + 1}`} className={inputClass} />
                  </td>
                  <td className={tdClass}>
                    <input type="number" min={0} max={100} value={draft.tecnica[rowKey].weight} onChange={(e) => setTec(rowKey, { weight: e.target.value })} className={cn(inputClass, 'w-20')} />
                  </td>
                  <td className={tdClass}>
                    <select value={draft.tecnica[rowKey].score} onChange={(e) => setTec(rowKey, { score: e.target.value })} className={selectClass}>
                      <option value="">—</option>
                      {SCORE_1_5.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={cn(tdClass, 'text-right font-mono tabular-nums')}>{calc.tecRowWeighted[i].toFixed(2)}</td>
                  <td className={tdClass}>
                    <input type="text" value={draft.tecnica[rowKey].note} onChange={(e) => setTec(rowKey, { note: e.target.value })} className={inputClass} />
                  </td>
                </tr>
              ))}
              <tr className={totalRowClass}>
                <td className={tdClass}>Subtotale area tecnica</td>
                <td className={cn(tdClass, 'font-mono tabular-nums')}>
                  {calc.tecWeightSum}%{calc.tecWeightSum !== 100 && ' ⚠'}
                </td>
                <td className={tdClass} />
                <td className={cn(tdClass, 'text-right font-mono tabular-nums')}>{calc.tecScoreSum.toFixed(2)}</td>
                <td className={tdClass} />
              </tr>
            </tbody>
          </table>
        </div>

        <SectionLabel>3. Matrice di valutazione — Soft skills / competenze trasversali</SectionLabel>
        <p className="text-[11.5px] text-muted-foreground">Aree comuni a qualsiasi ruolo; i pesi indicati sono un punto di partenza modificabile.</p>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Area / criterio</th>
                <th className={thClass}>Peso %</th>
                <th className={thClass}>Punteggio (1–5)</th>
                <th className={thClass}>Punteggio pesato</th>
                <th className={thClass}>Note</th>
              </tr>
            </thead>
            <tbody>
              {IV_SOFT_SKILLS.map((name, i) => {
                const row = draft.soft[name] || { score: '', note: '' }
                return (
                  <tr key={name}>
                    <td className={tdClass}>{name}</td>
                    <td className={cn(tdClass, 'font-mono tabular-nums')}>20%</td>
                    <td className={tdClass}>
                      <select value={row.score} onChange={(e) => setSoft(name, { score: e.target.value })} className={selectClass}>
                        <option value="">—</option>
                        {SCORE_1_5.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={cn(tdClass, 'text-right font-mono tabular-nums')}>{calc.softRowWeighted[i].toFixed(2)}</td>
                    <td className={tdClass}>
                      <input type="text" value={row.note} onChange={(e) => setSoft(name, { note: e.target.value })} className={inputClass} />
                    </td>
                  </tr>
                )
              })}
              <tr className={totalRowClass}>
                <td className={tdClass}>Subtotale area soft skills</td>
                <td className={cn(tdClass, 'font-mono tabular-nums')}>100%</td>
                <td className={tdClass} />
                <td className={cn(tdClass, 'text-right font-mono tabular-nums')}>{calc.softScoreSum.toFixed(2)}</td>
                <td className={tdClass} />
              </tr>
            </tbody>
          </table>
        </div>

        <SectionLabel>4. Calcolo del punteggio complessivo</SectionLabel>
        <p className="text-[11.5px] text-muted-foreground">Ponderazione tra le due aree secondo la rilevanza per il ruolo (esempio: 60% tecnica / 40% soft skills, da adattare).</p>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Area</th>
                <th className={thClass}>Peso area %</th>
                <th className={thClass}>Subtotale pesato</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={tdClass}>Competenze tecniche</td>
                <td className={tdClass}>
                  <input type="number" min={0} max={100} value={draft.areaWeightTec} onChange={(e) => set('areaWeightTec', e.target.value)} placeholder="60" className={cn(inputClass, 'w-20')} />
                </td>
                <td className={cn(tdClass, 'text-right font-mono tabular-nums')}>{calc.tecScoreSum.toFixed(2)}</td>
              </tr>
              <tr>
                <td className={tdClass}>Soft skills</td>
                <td className={tdClass}>
                  <input type="number" min={0} max={100} value={draft.areaWeightSoft} onChange={(e) => set('areaWeightSoft', e.target.value)} placeholder="40" className={cn(inputClass, 'w-20')} />
                </td>
                <td className={cn(tdClass, 'text-right font-mono tabular-nums')}>{calc.softScoreSum.toFixed(2)}</td>
              </tr>
              <tr className={totalRowClass}>
                <td className={tdClass} colSpan={2}>
                  Punteggio finale (0–5)
                </td>
                <td className={cn(tdClass, 'text-right font-mono tabular-nums')}>{calc.finalScore == null ? '—' : calc.finalScore.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="rounded-md border border-border bg-secondary px-3 py-2 text-[12px] text-foreground">{calc.suitabilityText}</p>

        <SectionLabel>5. Fascia di idoneità</SectionLabel>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <tbody>
              <tr>
                <td className={cn(tdClass, 'w-[110px] font-semibold text-foreground')}>4,0 – 5,0</td>
                <td className={tdClass}>Eccellente — procedere con la fase successiva</td>
              </tr>
              <tr>
                <td className={cn(tdClass, 'font-semibold text-foreground')}>3,0 – 3,9</td>
                <td className={tdClass}>Buono — idoneo, da valutare in comparazione con altri candidati</td>
              </tr>
              <tr>
                <td className={cn(tdClass, 'font-semibold text-foreground')}>2,0 – 2,9</td>
                <td className={tdClass}>Sufficiente — idoneità marginale, profilo di riserva</td>
              </tr>
              <tr>
                <td className={cn(tdClass, 'font-semibold text-foreground')}>&lt; 2,0</td>
                <td className={tdClass}>Non idoneo per la posizione</td>
              </tr>
            </tbody>
          </table>
        </div>

        <SectionLabel>6. Confronto tra candidati (facoltativo)</SectionLabel>
        <p className="text-[11.5px] text-muted-foreground">Da compilare quando più candidati vengono valutati per la stessa posizione, ai fini della comparazione e del ranking finale.</p>
        <CompareRowsTable scoreLabel="Punteggio finale" scoreKind="number" rows={draft.compareRows} onChange={(rows) => set('compareRows', rows)} />

        <SectionLabel>7. Raccomandazione finale</SectionLabel>
        <div className="flex flex-col gap-2">
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
        </div>
        <Field label="Motivazione della raccomandazione">
          <textarea value={draft.motivazione} onChange={(e) => set('motivazione', e.target.value)} className={textareaClass} />
        </Field>
        <Grid2>
          <Field label="Data">
            <input type="date" value={draft.dataFirma} onChange={(e) => set('dataFirma', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Firma valutatore">
            <input type="text" value={draft.firma} onChange={(e) => set('firma', e.target.value)} placeholder="Nome e cognome" className={inputClass} />
          </Field>
        </Grid2>

        <DialogFooter>
          <button type="button" onClick={() => setOpen(false)} className={ghostBtnClass}>
            Annulla
          </button>
          <button type="button" onClick={handleClear} className={dangerBtnClass}>
            Svuota scheda
          </button>
          <button type="button" onClick={handleSave} className={primaryBtnClass}>
            Salva scheda ✓
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
