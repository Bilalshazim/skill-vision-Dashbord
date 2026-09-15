import { Mic } from 'lucide-react'
import { useState } from 'react'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { IVN_SOFT_SKILLS, clearIvNotes, loadIvNotesDraft, loadIvNotesRecord, saveIvNotes } from '@/modules/recruiting/lib/interview-protocol'
import type { IvNotesDraft } from '@/modules/recruiting/lib/interview-protocol'
import type { IvNotesSoftRow, IvNotesTecRow } from '@/modules/recruiting/lib/interview-protocol-types'
import { CheckRow, Field, Grid2, Grid3, ModalEyebrow, SectionLabel } from '@/modules/recruiting/profile-hub/protocol/protocol-ui'
import { dangerBtnClass, ghostBtnClass, inputClass, primaryBtnClass, selectClass, tableClass, tableWrapClass, tdClass, textareaClass, thClass } from '@/modules/recruiting/profile-hub/protocol/protocol-styles'

const EXCLUSIVE_KEYS = ['esitoProcedi', 'esitoStandby', 'esitoAlternativo', 'esitoNonIdoneo'] as const
type ExclusiveKey = (typeof EXCLUSIVE_KEYS)[number]
const TEC_ROWS = ['row1', 'row2', 'row3'] as const
const SCORE_1_5 = ['1', '2', '3', '4', '5']

// Migrated from the "Verbale di Colloquio" modal (ivNotesModalOv, modules/
// recruiting.html ~712-812, openIvNotesModal()/collectIvNotesForm()/
// saveIvNotesForm()/clearIvNotesForm() ~4502-4551). Role-scoped only
// (currentRole) — no candidateId, no Pipeline link; the "Rif. candidatura"
// fields are free text the interviewer types by hand (e.g. "CAND-014"),
// exactly as legacy has them.
export function IvNotesDialog({ role, savedAt, onSavedAtChange }: { role: string; savedAt: number | null; onSavedAtChange: (savedAt: number | null) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<IvNotesDraft>(() => loadIvNotesDraft(role))

  function handleOpenChange(next: boolean) {
    setOpen(next)
    // Fresh read every time the dialog opens — matches legacy re-populating
    // every field from INTERVIEW_DATA.verbale[currentRole] on every
    // openIvNotesModal() call, not just once at first mount.
    if (next) setDraft(loadIvNotesDraft(role))
  }

  function set<K extends keyof IvNotesDraft>(key: K, value: IvNotesDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }
  function setTec(rowKey: (typeof TEC_ROWS)[number], patch: Partial<IvNotesTecRow>) {
    setDraft((prev) => ({ ...prev, tecnica: { ...prev.tecnica, [rowKey]: { ...prev.tecnica[rowKey], ...patch } } }))
  }
  function setSoft(name: string, patch: Partial<IvNotesSoftRow>) {
    setDraft((prev) => ({ ...prev, soft: { ...prev.soft, [name]: { ...(prev.soft[name] || { score: '', note: '' }), ...patch } } }))
  }
  // Ported verbatim from ivnExclusiveOutcome() (~4484-4487): checking one
  // outcome unchecks the other 3; unchecking one just unchecks it (no
  // side effect on the others).
  function setExclusive(key: ExclusiveKey, checked: boolean) {
    if (!checked) {
      set(key, false)
      return
    }
    setDraft((prev) => ({ ...prev, esitoProcedi: false, esitoStandby: false, esitoAlternativo: false, esitoNonIdoneo: false, [key]: true }))
  }

  function handleSave() {
    saveIvNotes(role, draft)
    onSavedAtChange(loadIvNotesRecord(role)?.savedAt ?? null)
    setOpen(false)
  }
  function handleClear() {
    clearIvNotes(role)
    onSavedAtChange(null)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" onClick={(e) => e.stopPropagation()} className={primaryBtnClass}>
          {savedAt != null ? 'Modifica scheda →' : 'Compila scheda →'}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl">
        <DialogHeader>
          <ModalEyebrow>Documento interno — Selezione del personale</ModalEyebrow>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="size-4 shrink-0" aria-hidden="true" />
            Verbale di Colloquio
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
          <Field label="Nominativo candidato">
            <input type="text" value={draft.nominativo} onChange={(e) => set('nominativo', e.target.value)} placeholder="Nome e cognome" className={inputClass} />
          </Field>
          <Field label="Rif. candidatura [cod./data invio CV]">
            <input type="text" value={draft.codiceData} onChange={(e) => set('codiceData', e.target.value)} placeholder="Es. CAND-014 · 12/06/2026" className={inputClass} />
          </Field>
        </Grid2>
        <Grid3>
          <Field label="Data colloquio">
            <input type="date" value={draft.data} onChange={(e) => set('data', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Ora colloquio">
            <input type="time" value={draft.ora} onChange={(e) => set('ora', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Modalità">
            <select value={draft.modalita} onChange={(e) => set('modalita', e.target.value)} className={selectClass}>
              <option value="">Seleziona…</option>
              <option>In presenza</option>
              <option>Video call</option>
              <option>Telefonico</option>
            </select>
          </Field>
        </Grid3>
        <Grid3>
          <Field label="Sede / canale">
            <input type="text" value={draft.sede} onChange={(e) => set('sede', e.target.value)} placeholder="Es. Sede Milano / link Zoom" className={inputClass} />
          </Field>
          <Field label="Fase del processo">
            <select value={draft.faseProcesso} onChange={(e) => set('faseProcesso', e.target.value)} className={selectClass}>
              <option value="">Seleziona…</option>
              <option>1° colloquio</option>
              <option>2° colloquio</option>
              <option>Colloquio tecnico</option>
              <option>Finale</option>
            </select>
          </Field>
          <Field label="N. colloquio">
            <input type="text" value={draft.nColloquio} onChange={(e) => set('nColloquio', e.target.value)} placeholder="Es. 1" className={inputClass} />
          </Field>
        </Grid3>
        <Field label="Intervistatore/i [ruolo/funzione]">
          <input type="text" value={draft.intervistatori} onChange={(e) => set('intervistatori', e.target.value)} placeholder="Nomi e ruoli" className={inputClass} />
        </Field>

        <SectionLabel>1. Profilo ricercato (riepilogo)</SectionLabel>
        <Field label="Sintesi dei requisiti chiave della posizione">
          <textarea
            value={draft.profiloRicercato}
            onChange={(e) => set('profiloRicercato', e.target.value)}
            placeholder={'Requisito principale 1 (es. esperienza minima, area di competenza)\nRequisito principale 2\nRequisito principale 3'}
            className={textareaClass}
          />
        </Field>

        <SectionLabel>2. Percorso professionale e formativo</SectionLabel>
        <Field label="Sintesi emersa dal colloquio">
          <textarea value={draft.percorso} onChange={(e) => set('percorso', e.target.value)} className={textareaClass} />
        </Field>

        <SectionLabel>3. Valutazione competenze tecniche / hard skills</SectionLabel>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Area valutata</th>
                <th className={thClass}>Punteggio (1–5)</th>
                <th className={thClass}>Note</th>
              </tr>
            </thead>
            <tbody>
              {TEC_ROWS.map((rowKey, i) => (
                <tr key={rowKey}>
                  <td className={tdClass}>
                    <input type="text" value={draft.tecnica[rowKey].area} onChange={(e) => setTec(rowKey, { area: e.target.value })} placeholder={`Es. Competenza tecnica ${i + 1}`} className={inputClass} />
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
                  <td className={tdClass}>
                    <input type="text" value={draft.tecnica[rowKey].note} onChange={(e) => setTec(rowKey, { note: e.target.value })} className={inputClass} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionLabel>4. Valutazione soft skills / attitudinali</SectionLabel>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Area valutata</th>
                <th className={thClass}>Punteggio (1–5)</th>
                <th className={thClass}>Note</th>
              </tr>
            </thead>
            <tbody>
              {IVN_SOFT_SKILLS.map((name) => {
                const row = draft.soft[name] || { score: '', note: '' }
                return (
                  <tr key={name}>
                    <td className={tdClass}>{name}</td>
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
                    <td className={tdClass}>
                      <input type="text" value={row.note} onChange={(e) => setSoft(name, { note: e.target.value })} className={inputClass} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <SectionLabel>5. Aspettative economiche e disponibilità</SectionLabel>
        <Grid3>
          <Field label="RAL attuale (€)">
            <input type="number" value={draft.ralAttuale} onChange={(e) => set('ralAttuale', e.target.value)} placeholder="0" className={inputClass} />
          </Field>
          <Field label="RAL richiesta (€)">
            <input type="number" value={draft.ralRichiesta} onChange={(e) => set('ralRichiesta', e.target.value)} placeholder="0" className={inputClass} />
          </Field>
          <Field label="Preavviso">
            <input type="text" value={draft.preavviso} onChange={(e) => set('preavviso', e.target.value)} placeholder="Es. 2 mesi" className={inputClass} />
          </Field>
        </Grid3>
        <Grid3>
          <Field label="Disponibilità trasferte">
            <select value={draft.trasferte} onChange={(e) => set('trasferte', e.target.value)} className={selectClass}>
              <option value="">Seleziona…</option>
              <option>Sì</option>
              <option>No</option>
              <option>Parziale</option>
            </select>
          </Field>
          <Field label="Disponibilità remote/ibrido">
            <select value={draft.ibrido} onChange={(e) => set('ibrido', e.target.value)} className={selectClass}>
              <option value="">Seleziona…</option>
              <option>Sì</option>
              <option>No</option>
              <option>Parziale</option>
            </select>
          </Field>
          <Field label="Data possibile inizio">
            <input type="date" value={draft.dataInizio} onChange={(e) => set('dataInizio', e.target.value)} className={inputClass} />
          </Field>
        </Grid3>

        <SectionLabel>6. Punti di forza e aree di attenzione</SectionLabel>
        <Field label="Punti di forza">
          <textarea value={draft.puntiForza} onChange={(e) => set('puntiForza', e.target.value)} className={textareaClass} />
        </Field>
        <Field label="Aree di miglioramento / rischi">
          <textarea value={draft.areeMiglioramento} onChange={(e) => set('areeMiglioramento', e.target.value)} className={textareaClass} />
        </Field>

        <SectionLabel>7. Domande poste e risposte significative</SectionLabel>
        <Field label="Domande chiave (motivazionali, tecniche, situazionali) e sintesi delle risposte">
          <textarea value={draft.qa} onChange={(e) => set('qa', e.target.value)} className={textareaClass} />
        </Field>

        <SectionLabel>8. Valutazione complessiva</SectionLabel>
        <Grid2>
          <Field label="Giudizio sintetico">
            <textarea value={draft.giudizioSintetico} onChange={(e) => set('giudizioSintetico', e.target.value)} className={textareaClass} />
          </Field>
          <Field label="Punteggio complessivo (1–5)">
            <select value={draft.punteggioComplessivo} onChange={(e) => set('punteggioComplessivo', e.target.value)} className={selectClass}>
              <option value="">—</option>
              {SCORE_1_5.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
        </Grid2>

        <SectionLabel>9. Esito del colloquio</SectionLabel>
        <div className="flex flex-col gap-2">
          <CheckRow checked={draft.esitoProcedi} onChange={(c) => setExclusive('esitoProcedi', c)}>
            Procedere alla fase successiva del processo di selezione
          </CheckRow>
          <CheckRow checked={draft.esitoStandby} onChange={(c) => setExclusive('esitoStandby', c)}>
            Mantenere il profilo in stand-by (idoneo ma non prioritario)
          </CheckRow>
          <CheckRow checked={draft.esitoAlternativo} onChange={(c) => setExclusive('esitoAlternativo', c)}>
            Proporre per un ruolo alternativo
          </CheckRow>
          <CheckRow checked={draft.esitoNonIdoneo} onChange={(c) => setExclusive('esitoNonIdoneo', c)}>
            Non idoneo per la posizione
          </CheckRow>
        </div>
        <Field label="Motivazione della decisione">
          <textarea value={draft.motivazioneDecisione} onChange={(e) => set('motivazioneDecisione', e.target.value)} className={textareaClass} />
        </Field>

        <SectionLabel>10. Note aggiuntive</SectionLabel>
        <textarea value={draft.noteAggiuntive} onChange={(e) => set('noteAggiuntive', e.target.value)} className={textareaClass} />

        <Grid2>
          <Field label="Data">
            <input type="date" value={draft.dataFirma} onChange={(e) => set('dataFirma', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Firma intervistatore">
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
