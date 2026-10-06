import { fmtDec } from '@/lib/format'
import { FileBarChart2 } from 'lucide-react'
import { useState } from 'react'

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { useDirty } from '@/hooks/use-dirty'
import { SelectField } from '@/components/patterns/SelectField'
import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { calcIvReportTotal, clearIvReport, loadIvReportDraft, loadIvReportRecord, saveIvReport } from '@/modules/recruiting/lib/interview-protocol'
import type { IvReportDraft } from '@/modules/recruiting/lib/interview-protocol'
import type { IvReportStep } from '@/modules/recruiting/lib/interview-protocol-types'
import { CompareRowsTable } from '@/modules/recruiting/profile-hub/protocol/CompareRowsTable'
import { SheetBrand } from '@/modules/recruiting/profile-hub/protocol/SheetBrand'
import { CheckRow, ModalEyebrow, SectionLabel } from '@/modules/recruiting/profile-hub/protocol/protocol-ui'
import { dangerBtnClass, ghostBtnClass, primaryBtnClass } from '@/modules/recruiting/profile-hub/protocol/protocol-styles'

const RECO_KEYS = ['reco_offerta', 'reco_riserva', 'reco_ulteriore', 'reco_nonProcedere'] as const
type RecoKey = (typeof RECO_KEYS)[number]
const STEP_ROWS: { key: 'step1' | 'step2' | 'step3' | 'step4'; label: string }[] = [
  { key: 'step1', label: 'Preselezione CV' },
  { key: 'step2', label: '1° colloquio HR' },
  { key: 'step3', label: 'Colloquio tecnico' },
  { key: 'step4', label: 'Colloquio finale' },
]
const SCORE_1_5 = ['1', '2', '3', '4', '5']
const AGG_ROWS: { key: 'tec' | 'soft' | 'motiv' | 'culture'; noteKey: 'tecNote' | 'softNote' | 'motivNote' | 'cultureNote'; label: string }[] = [
  { key: 'tec', noteKey: 'tecNote', label: 'Competenze tecniche' },
  { key: 'soft', noteKey: 'softNote', label: 'Competenze trasversali' },
  { key: 'motiv', noteKey: 'motivNote', label: 'Motivazione' },
  { key: 'culture', noteKey: 'cultureNote', label: 'Adeguatezza all’organizzazione' },
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
  const dirty = useDirty(draft, open)

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
        <button type="button" className={primaryBtnClass}>
          {savedAt != null ? 'Modifica report →' : 'Compila report →'}
        </button>
      </DialogTrigger>
      <DialogContent size="lg" dirty={dirty}>
        <DialogHeader>
          <SheetBrand />
          <ModalEyebrow>Documento riservato — Processo di selezione</ModalEyebrow>
          <DialogTitle className="flex items-center gap-2">
            <FileBarChart2 className="size-4 shrink-0" aria-hidden="true" />
            Report Finale di Valutazione
          </DialogTitle>
          <DialogDescription>
            Posizione: <b className="font-semibold text-foreground">&quot;{role}&quot;</b>
          </DialogDescription>
        </DialogHeader>

        <FieldGrid>
          <Field label="Posizione ricercata">
            <Input type="text" value={draft.posizione} onChange={(e) => set('posizione', e.target.value)} />
          </Field>
          <Field label="Rif. candidatura">
            <Input type="text" value={draft.rifCandidatura} onChange={(e) => set('rifCandidatura', e.target.value)} placeholder="Es. REF-2026-014" />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <Field label="Candidato" hint="Nome, codice e data.">
            <Input type="text" value={draft.nominativo} onChange={(e) => set('nominativo', e.target.value)} placeholder="Es. CAND-014" />
          </Field>
          <Field label="Data report">
            <Input type="date" value={draft.dataReport} onChange={(e) => set('dataReport', e.target.value)} />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <Field label="A cura di">
            <Input type="text" value={draft.aCuraDi} onChange={(e) => set('aCuraDi', e.target.value)} placeholder="Nome e ruolo" />
          </Field>
          <Field label="Fasi svolte" hint="Numero di step.">
            <Input type="text" value={draft.fasiSvolte} onChange={(e) => set('fasiSvolte', e.target.value)} placeholder="Es. preselezione CV, colloquio HR, colloquio tecnico" />
          </Field>
        </FieldGrid>

        <SectionLabel>1. Executive summary</SectionLabel>
        <Field label="Giudizio complessivo" hint="3–5 righe.">
          <Textarea
            value={draft.summary}
            onChange={(e) => set('summary', e.target.value)}
            placeholder="Idoneità del candidato rispetto alla posizione, elementi distintivi, eventuale raccomandazione anticipata…"
            
 />
        </Field>

        <SectionLabel>2. Percorso di selezione svolto</SectionLabel>
        <p className="text-app-caption text-muted-foreground">Riepilogo delle fasi effettuate, con date e responsabili.</p>
        <Table frame size="sm" minWidth="lg">
            <TableHeader>
              <TableRow>
                <TableHead>Fase</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Interlocutore</TableHead>
                <TableHead>Esito</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STEP_ROWS.map(({ key, label }) => (
                <TableRow key={key}>
                  <TableCell>{label}</TableCell>
                  <TableCell>
                    <Input type="date" value={draft.steps[key].date} onChange={(e) => setStep(key, { date: e.target.value })} size="sm" />
                  </TableCell>
                  <TableCell>
                    <Input type="text" value={draft.steps[key].interlocutore} onChange={(e) => setStep(key, { interlocutore: e.target.value })} size="sm" />
                  </TableCell>
                  <TableCell>
                    <SelectField value={draft.steps[key].esito} onValueChange={(v) => setStep(key, { esito: v })} size="sm">
                      <option value="">—</option>
                      <option>Superato</option>
                      <option>Non superato</option>
                      <option>In corso</option>
                    </SelectField>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

        <SectionLabel>3. Profilo del candidato</SectionLabel>
        <Field label="Percorso rilevante" hint="Esperienze e formazione rilevanti per la posizione.">
          <Textarea value={draft.profiloCandidato} onChange={(e) => set('profiloCandidato', e.target.value)} />
        </Field>

        <SectionLabel>4. Valutazione complessiva per area</SectionLabel>
        <p className="text-app-caption text-muted-foreground">Sintesi qualitativa aggregata da tutti i colloqui e strumenti di valutazione utilizzati (verbali, schede di scoring, eventuali assessment/test).</p>
        <Table frame size="sm" minWidth="lg">
            <TableHeader>
              <TableRow>
                <TableHead>Area</TableHead>
                <TableHead>Esito sintetico (1–5)</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AGG_ROWS.map(({ key, noteKey, label }) => (
                <TableRow key={key}>
                  <TableCell>{label}</TableCell>
                  <TableCell>
                    <SelectField value={draft.aggregate[key]} onValueChange={(v) => setAgg({ [key]: v } as Partial<IvReportDraft['aggregate']>)} size="sm">
                      <option value="">—</option>
                      {SCORE_1_5.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </SelectField>
                  </TableCell>
                  <TableCell>
                    <Input type="text" value={draft.aggregate[noteKey]} onChange={(e) => setAgg({ [noteKey]: e.target.value } as Partial<IvReportDraft['aggregate']>)} size="sm" />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-medium">
                <TableCell>Media complessiva</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{fmtDec(total, 2)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>

        <SectionLabel>5. Punti di forza chiave</SectionLabel>
        <Textarea value={draft.strengths} onChange={(e) => set('strengths', e.target.value)} placeholder={'• Punto di forza 1\n• Punto di forza 2\n• Punto di forza 3'} size="sm" />

        <SectionLabel>6. Aree di sviluppo e possibili rischi</SectionLabel>
        <Textarea value={draft.risks} onChange={(e) => set('risks', e.target.value)} placeholder={'• Area di sviluppo / rischio 1\n• Area di sviluppo / rischio 2'} size="sm" />

        <SectionLabel>7. Adeguatezza alla posizione e all&apos;organizzazione</SectionLabel>
        <Field label="Coerenza con la posizione" hint="Con le responsabilità, il team di inserimento e la cultura aziendale.">
          <Textarea value={draft.fitOrganizzativo} onChange={(e) => set('fitOrganizzativo', e.target.value)} />
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
        <Field label="Condizioni economiche" hint="Proposta e note per la negoziazione.">
          <Textarea value={draft.condizioniEconomiche} onChange={(e) => set('condizioniEconomiche', e.target.value)} />
        </Field>
        <Field label="Prossimi passi" hint="Per esempio data dell'offerta, onboarding, referenze da verificare.">
          <Textarea value={draft.nextSteps} onChange={(e) => set('nextSteps', e.target.value)} />
        </Field>

        <SectionLabel>10. Riferimenti e allegati</SectionLabel>
        <FieldGrid columns={3}>
          <Field label="Verbale/i di colloquio">
            <Input type="text" value={draft.refVerbale} onChange={(e) => set('refVerbale', e.target.value)} placeholder="Riferimento" />
          </Field>
          <Field label="Scheda/e di valutazione">
            <Input type="text" value={draft.refScheda} onChange={(e) => set('refScheda', e.target.value)} placeholder="Riferimento" />
          </Field>
          <Field label="Referenze e test">
            <Input type="text" value={draft.refAltro} onChange={(e) => set('refAltro', e.target.value)} placeholder="Riferimento" />
          </Field>
        </FieldGrid>

        <SectionLabel>11. Approvazione</SectionLabel>
        <FieldGrid>
          <Field label="Firma HR" hint="Data e firma.">
            <Input type="text" value={draft.signHr} onChange={(e) => set('signHr', e.target.value)} placeholder="Nome, data e firma" />
          </Field>
          <Field label="Firma direzione" hint="Responsabile dell’assunzione o direzione: data e firma.">
            <Input type="text" value={draft.signHm} onChange={(e) => set('signHm', e.target.value)} placeholder="Nome, data e firma" />
          </Field>
        </FieldGrid>

        <DialogFooter>
          <button type="button" onClick={() => setOpen(false)} className={ghostBtnClass}>
            Annulla
          </button>
          <button type="button" onClick={handleClear} className={dangerBtnClass}>
            Svuota report
          </button>
          <button type="button" onClick={handleSave} className={primaryBtnClass}>
            Salva report
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
