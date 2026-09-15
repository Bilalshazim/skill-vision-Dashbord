import { FileBarChart2 } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { calcIvReportTotal, clearIvReport, loadIvReportDraft, loadIvReportRecord, saveIvReport } from '@/modules/recruiting/lib/interview-protocol'
import type { IvReportDraft } from '@/modules/recruiting/lib/interview-protocol'
import type { IvReportStep } from '@/modules/recruiting/lib/interview-protocol-types'
import { CompareRowsTable } from '@/modules/recruiting/profile-hub/protocol/CompareRowsTable'
import { CheckRow, Field, Grid2, Grid3, ModalEyebrow, SectionLabel } from '@/modules/recruiting/profile-hub/protocol/protocol-ui'
import { dangerBtnClass, ghostBtnClass, inputClass, primaryBtnClass, selectClass, tableClass, tableWrapClass, tdClass, textareaClass, thClass, totalRowClass } from '@/modules/recruiting/profile-hub/protocol/protocol-styles'

const RECO_KEYS = ['reco_offerta', 'reco_riserva', 'reco_ulteriore', 'reco_nonProcedere'] as const
type RecoKey = (typeof RECO_KEYS)[number]
const STEP_ROWS: { key: 'step1' | 'step2' | 'step3' | 'step4'; label: string }[] = [
  { key: 'step1', label: 'Screening CV' },
  { key: 'step2', label: '1° colloquio HR' },
  { key: 'step3', label: 'Colloquio tecnico' },
  { key: 'step4', label: 'Colloquio finale' },
]
const SCORE_1_5 = ['1', '2', '3', '4', '5']
const AGG_ROWS: { key: 'tec' | 'soft' | 'motiv' | 'culture'; noteKey: 'tecNote' | 'softNote' | 'motivNote' | 'cultureNote'; label: string }[] = [
  { key: 'tec', noteKey: 'tecNote', label: 'Competenze tecniche' },
  { key: 'soft', noteKey: 'softNote', label: 'Soft skills' },
  { key: 'motiv', noteKey: 'motivNote', label: 'Motivazione' },
  { key: 'culture', noteKey: 'cultureNote', label: 'Fit organizzativo' },
]

// Migrated from the "Report Finale di Valutazione" modal (ivReportModalOv,
// modules/recruiting.html ~916-1015, openIvReportModal()/collectIvReportForm()/
// saveIvReportForm()/clearIvReportForm() ~4727-4819, ivReportRecalc()
// ~4705-4711). Role-scoped only. The step-table "Esito" selects have no
// recalc trigger in legacy (only the section-4 aggregate scores do) —
// reproduced exactly, not added.
export function IvReportDialog({ role, savedAt, onSavedAtChange }: { role: string; savedAt: number | null; onSavedAtChange: (savedAt: number | null) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<IvReportDraft>(() => loadIvReportDraft(role))

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setDraft(loadIvReportDraft(role))
  }

  function set<K extends keyof IvReportDraft>(key: K, value: IvReportDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }
  function setStep(stepKey: (typeof STEP_ROWS)[number]['key'], patch: Partial<IvReportStep>) {
    setDraft((prev) => ({ ...prev, steps: { ...prev.steps, [stepKey]: { ...prev.steps[stepKey], ...patch } } }))
  }
  function setAgg(patch: Partial<IvReportDraft['aggregate']>) {
    setDraft((prev) => ({ ...prev, aggregate: { ...prev.aggregate, ...patch } }))
  }
  // Ported verbatim from ivrExclusiveReco() (~4712-4715).
  function setExclusive(key: RecoKey, checked: boolean) {
    if (!checked) {
      set(key, false)
      return
    }
    setDraft((prev) => ({ ...prev, reco_offerta: false, reco_riserva: false, reco_ulteriore: false, reco_nonProcedere: false, [key]: true }))
  }

  function handleSave() {
    saveIvReport(role, draft)
    onSavedAtChange(loadIvReportRecord(role)?.savedAt ?? null)
    setOpen(false)
  }
  function handleClear() {
    clearIvReport(role)
    onSavedAtChange(null)
    setOpen(false)
  }

  const total = calcIvReportTotal(draft.aggregate)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" onClick={(e) => e.stopPropagation()} className={primaryBtnClass}>
          {savedAt != null ? 'Modifica report →' : 'Compila report →'}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl">
        <DialogHeader>
          <ModalEyebrow>Documento riservato — Processo di selezione</ModalEyebrow>
          <DialogTitle className="flex items-center gap-2">
            <FileBarChart2 className="size-4 shrink-0" aria-hidden="true" />
            Report Finale di Valutazione
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
        <Grid2>
          <Field label="Nominativo candidato [cod./data]">
            <input type="text" value={draft.nominativo} onChange={(e) => set('nominativo', e.target.value)} placeholder="Es. CAND-014" className={inputClass} />
          </Field>
          <Field label="Data report">
            <input type="date" value={draft.dataReport} onChange={(e) => set('dataReport', e.target.value)} className={inputClass} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="A cura di">
            <input type="text" value={draft.aCuraDi} onChange={(e) => set('aCuraDi', e.target.value)} placeholder="Nome e ruolo" className={inputClass} />
          </Field>
          <Field label="Fasi svolte [n. step]">
            <input type="text" value={draft.fasiSvolte} onChange={(e) => set('fasiSvolte', e.target.value)} placeholder="Es. screening CV, colloquio HR, colloquio tecnico" className={inputClass} />
          </Field>
        </Grid2>

        <SectionLabel>1. Executive summary</SectionLabel>
        <Field label="Giudizio complessivo in sintesi (3–5 righe)">
          <textarea
            value={draft.summary}
            onChange={(e) => set('summary', e.target.value)}
            placeholder="Idoneità del candidato rispetto al ruolo, elementi distintivi, eventuale raccomandazione anticipata…"
            className={textareaClass}
          />
        </Field>

        <SectionLabel>2. Percorso di selezione svolto</SectionLabel>
        <p className="text-[11.5px] text-muted-foreground">Riepilogo delle fasi effettuate, con date e responsabili.</p>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Fase</th>
                <th className={thClass}>Data</th>
                <th className={thClass}>Interlocutore</th>
                <th className={thClass}>Esito</th>
              </tr>
            </thead>
            <tbody>
              {STEP_ROWS.map(({ key, label }) => (
                <tr key={key}>
                  <td className={tdClass}>{label}</td>
                  <td className={tdClass}>
                    <input type="date" value={draft.steps[key].date} onChange={(e) => setStep(key, { date: e.target.value })} className={inputClass} />
                  </td>
                  <td className={tdClass}>
                    <input type="text" value={draft.steps[key].interlocutore} onChange={(e) => setStep(key, { interlocutore: e.target.value })} className={inputClass} />
                  </td>
                  <td className={tdClass}>
                    <select value={draft.steps[key].esito} onChange={(e) => setStep(key, { esito: e.target.value })} className={selectClass}>
                      <option value="">—</option>
                      <option>Superato</option>
                      <option>Non superato</option>
                      <option>In corso</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionLabel>3. Profilo del candidato</SectionLabel>
        <Field label="Sintesi del percorso professionale e formativo rilevante rispetto al ruolo">
          <textarea value={draft.profiloCandidato} onChange={(e) => set('profiloCandidato', e.target.value)} className={textareaClass} />
        </Field>

        <SectionLabel>4. Valutazione complessiva per area</SectionLabel>
        <p className="text-[11.5px] text-muted-foreground">Sintesi qualitativa aggregata da tutti i colloqui e strumenti di valutazione utilizzati (verbali, schede di scoring, eventuali assessment/test).</p>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Area</th>
                <th className={thClass}>Esito sintetico (1–5)</th>
                <th className={thClass}>Note</th>
              </tr>
            </thead>
            <tbody>
              {AGG_ROWS.map(({ key, noteKey, label }) => (
                <tr key={key}>
                  <td className={tdClass}>{label}</td>
                  <td className={tdClass}>
                    <select value={draft.aggregate[key]} onChange={(e) => setAgg({ [key]: e.target.value } as Partial<IvReportDraft['aggregate']>)} className={selectClass}>
                      <option value="">—</option>
                      {SCORE_1_5.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={tdClass}>
                    <input type="text" value={draft.aggregate[noteKey]} onChange={(e) => setAgg({ [noteKey]: e.target.value } as Partial<IvReportDraft['aggregate']>)} className={inputClass} />
                  </td>
                </tr>
              ))}
              <tr className={totalRowClass}>
                <td className={tdClass}>Media complessiva</td>
                <td className={cn(tdClass, 'text-right font-mono tabular-nums')}>{total.toFixed(2)}</td>
                <td className={tdClass} />
              </tr>
            </tbody>
          </table>
        </div>

        <SectionLabel>5. Punti di forza chiave</SectionLabel>
        <textarea value={draft.strengths} onChange={(e) => set('strengths', e.target.value)} placeholder={'• Punto di forza 1\n• Punto di forza 2\n• Punto di forza 3'} className={textareaClass} />

        <SectionLabel>6. Aree di sviluppo e possibili rischi</SectionLabel>
        <textarea value={draft.risks} onChange={(e) => set('risks', e.target.value)} placeholder={'• Area di sviluppo / rischio 1\n• Area di sviluppo / rischio 2'} className={textareaClass} />

        <SectionLabel>7. Fit con il ruolo e con l&apos;organizzazione</SectionLabel>
        <Field label="Coerenza tra il profilo, le responsabilità del ruolo, il team di inserimento e la cultura aziendale">
          <textarea value={draft.fitOrganizzativo} onChange={(e) => set('fitOrganizzativo', e.target.value)} className={textareaClass} />
        </Field>

        <SectionLabel>8. Confronto con altri candidati finalisti (se applicabile)</SectionLabel>
        <CompareRowsTable scoreLabel="Punteggio/giudizio" scoreKind="text" rows={draft.compareRows} onChange={(rows) => set('compareRows', rows)} />

        <SectionLabel>9. Raccomandazione finale e prossimi passi</SectionLabel>
        <div className="flex flex-col gap-2">
          <CheckRow checked={draft.reco_offerta} onChange={(c) => setExclusive('reco_offerta', c)}>
            Procedere con l&apos;offerta
          </CheckRow>
          <CheckRow checked={draft.reco_riserva} onChange={(c) => setExclusive('reco_riserva', c)}>
            Inserire in lista di riserva
          </CheckRow>
          <CheckRow checked={draft.reco_ulteriore} onChange={(c) => setExclusive('reco_ulteriore', c)}>
            Richiedere ulteriore step di valutazione
          </CheckRow>
          <CheckRow checked={draft.reco_nonProcedere} onChange={(c) => setExclusive('reco_nonProcedere', c)}>
            Non procedere
          </CheckRow>
        </div>
        <Field label="Condizioni economiche proposte / note per la negoziazione">
          <textarea value={draft.condizioniEconomiche} onChange={(e) => set('condizioniEconomiche', e.target.value)} className={textareaClass} />
        </Field>
        <Field label="Prossimi passi operativi (es. data offerta, onboarding, referenze da verificare)">
          <textarea value={draft.nextSteps} onChange={(e) => set('nextSteps', e.target.value)} className={textareaClass} />
        </Field>

        <SectionLabel>10. Riferimenti e allegati</SectionLabel>
        <Grid3>
          <Field label="Verbale/i di colloquio">
            <input type="text" value={draft.refVerbale} onChange={(e) => set('refVerbale', e.target.value)} placeholder="Riferimento" className={inputClass} />
          </Field>
          <Field label="Scheda/e di valutazione">
            <input type="text" value={draft.refScheda} onChange={(e) => set('refScheda', e.target.value)} placeholder="Riferimento" className={inputClass} />
          </Field>
          <Field label="Referenze / test / assessment">
            <input type="text" value={draft.refAltro} onChange={(e) => set('refAltro', e.target.value)} placeholder="Riferimento" className={inputClass} />
          </Field>
        </Grid3>

        <SectionLabel>11. Approvazione</SectionLabel>
        <Grid2>
          <Field label="Responsabile HR — Data e firma">
            <input type="text" value={draft.signHr} onChange={(e) => set('signHr', e.target.value)} placeholder="Nome, data e firma" className={inputClass} />
          </Field>
          <Field label="Hiring Manager / Direzione — Data e firma">
            <input type="text" value={draft.signHm} onChange={(e) => set('signHm', e.target.value)} placeholder="Nome, data e firma" className={inputClass} />
          </Field>
        </Grid2>

        <DialogFooter>
          <button type="button" onClick={() => setOpen(false)} className={ghostBtnClass}>
            Annulla
          </button>
          <button type="button" onClick={handleClear} className={dangerBtnClass}>
            Svuota report
          </button>
          <button type="button" onClick={handleSave} className={primaryBtnClass}>
            Salva report ✓
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
