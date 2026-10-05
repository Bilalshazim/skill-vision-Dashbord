import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { SelectField } from '@/components/patterns/SelectField'
import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { IVN_SOFT_SKILLS } from '@/modules/recruiting/lib/interview-protocol'
import type { IvNotesDraft } from '@/modules/recruiting/lib/interview-protocol'
import type { IvNotesSoftRow, IvNotesTecRow } from '@/modules/recruiting/lib/interview-protocol-types'
import { CheckRow, SectionLabel } from '@/modules/recruiting/profile-hub/protocol/protocol-ui'

const EXCLUSIVE_KEYS = ['esitoProcedi', 'esitoStandby', 'esitoAlternativo', 'esitoNonIdoneo'] as const
type ExclusiveKey = (typeof EXCLUSIVE_KEYS)[number]
const TEC_ROWS = ['row1', 'row2', 'row3'] as const
const SCORE_1_5 = ['1', '2', '3', '4', '5']

// Il corpo della Scheda Intervista Strutturata (ex "Verbale di Colloquio"),
// senza cornice: lo usano il dialog dell'Area Valutatore e la pagina dei
// valutatori esterni. Riceve la bozza e la restituisce modificata.
export function IvNotesForm({ draft, onChange }: { draft: IvNotesDraft; onChange: (next: IvNotesDraft) => void }) {
  function set<K extends keyof IvNotesDraft>(key: K, value: IvNotesDraft[K]) {
    onChange({ ...draft, [key]: value })
  }
  function setTec(rowKey: (typeof TEC_ROWS)[number], patch: Partial<IvNotesTecRow>) {
    onChange({ ...draft, tecnica: { ...draft.tecnica, [rowKey]: { ...draft.tecnica[rowKey], ...patch } } })
  }
  function setSoft(name: string, patch: Partial<IvNotesSoftRow>) {
    onChange({ ...draft, soft: { ...draft.soft, [name]: { ...(draft.soft[name] || { score: '', note: '' }), ...patch } } })
  }
  // Ported verbatim from ivnExclusiveOutcome() (~4484-4487): checking one
  // outcome unchecks the other 3; unchecking one just unchecks it.
  function setExclusive(key: ExclusiveKey, checked: boolean) {
    if (!checked) {
      set(key, false)
      return
    }
    onChange({ ...draft, esitoProcedi: false, esitoStandby: false, esitoAlternativo: false, esitoNonIdoneo: false, [key]: true })
  }

  return (
    <>
        <FieldGrid>
          <Field label="Posizione ricercata">
            <Input type="text" value={draft.posizione} onChange={(e) => set('posizione', e.target.value)} />
          </Field>
          <Field label="Rif. candidatura">
            <Input type="text" value={draft.rifCandidatura} onChange={(e) => set('rifCandidatura', e.target.value)} placeholder="Es. REF-2026-014" />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <Field label="Nominativo candidato">
            <Input type="text" value={draft.nominativo} onChange={(e) => set('nominativo', e.target.value)} placeholder="Nome e cognome" />
          </Field>
          <Field label="Codice e data CV">
            <Input type="text" value={draft.codiceData} onChange={(e) => set('codiceData', e.target.value)} placeholder="Es. CAND-014 · 12/06/2026" />
          </Field>
        </FieldGrid>
        <FieldGrid columns={3}>
          <Field label="Data colloquio">
            <Input type="date" value={draft.data} onChange={(e) => set('data', e.target.value)} />
          </Field>
          <Field label="Ora colloquio">
            <Input type="time" value={draft.ora} onChange={(e) => set('ora', e.target.value)} />
          </Field>
          <Field label="Modalità">
            <SelectField value={draft.modalita} onValueChange={(v) => set('modalita', v)}>
              <option value="">Seleziona…</option>
              <option>In presenza</option>
              <option>Video call</option>
              <option>Telefonico</option>
            </SelectField>
          </Field>
        </FieldGrid>
        <FieldGrid columns={3}>
          <Field label="Sede / canale">
            <Input type="text" value={draft.sede} onChange={(e) => set('sede', e.target.value)} placeholder="Es. Sede Milano / link Zoom" />
          </Field>
          <Field label="Fase del processo">
            <SelectField value={draft.faseProcesso} onValueChange={(v) => set('faseProcesso', v)}>
              <option value="">Seleziona…</option>
              <option>1° colloquio</option>
              <option>2° colloquio</option>
              <option>Colloquio tecnico</option>
              <option>Finale</option>
            </SelectField>
          </Field>
          <Field label="N. colloquio">
            <Input type="text" value={draft.nColloquio} onChange={(e) => set('nColloquio', e.target.value)} placeholder="Es. 1" />
          </Field>
        </FieldGrid>
        <Field label="Intervistatori" hint="Con ruolo o funzione.">
          <Input type="text" value={draft.intervistatori} onChange={(e) => set('intervistatori', e.target.value)} placeholder="Nomi e ruoli" />
        </Field>

        <SectionLabel>1. Profilo ricercato (riepilogo)</SectionLabel>
        <Field label="Requisiti chiave">
          <Textarea
            value={draft.profiloRicercato}
            onChange={(e) => set('profiloRicercato', e.target.value)}
            placeholder={'Requisito principale 1 (es. esperienza minima, area di competenza)\nRequisito principale 2\nRequisito principale 3'}
            
 />
        </Field>

        <SectionLabel>2. Percorso professionale e formativo</SectionLabel>
        <Field label="Sintesi colloquio">
          <Textarea value={draft.percorso} onChange={(e) => set('percorso', e.target.value)} />
        </Field>

        <SectionLabel>3. Valutazione delle competenze professionali</SectionLabel>
        <Table frame size="sm" minWidth="lg">
            <TableHeader>
              <TableRow>
                <TableHead>Area valutata</TableHead>
                <TableHead>Punteggio (1–5)</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TEC_ROWS.map((rowKey, i) => (
                <TableRow key={rowKey}>
                  <TableCell>
                    <Input type="text" value={draft.tecnica[rowKey].area} onChange={(e) => setTec(rowKey, { area: e.target.value })} placeholder={`Es. Competenza tecnica ${i + 1}`} size="sm" />
                  </TableCell>
                  <TableCell>
                    <SelectField value={draft.tecnica[rowKey].score} onValueChange={(v) => setTec(rowKey, { score: v })} size="sm">
                      <option value="">—</option>
                      {SCORE_1_5.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </SelectField>
                  </TableCell>
                  <TableCell>
                    <Input type="text" value={draft.tecnica[rowKey].note} onChange={(e) => setTec(rowKey, { note: e.target.value })} size="sm" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

        <SectionLabel>4. Valutazione delle competenze trasversali e attitudinali</SectionLabel>
        <Table frame size="sm" minWidth="lg">
            <TableHeader>
              <TableRow>
                <TableHead>Area valutata</TableHead>
                <TableHead>Punteggio (1–5)</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {IVN_SOFT_SKILLS.map((name) => {
                const row = draft.soft[name] || { score: '', note: '' }
                return (
                  <TableRow key={name}>
                    <TableCell>{name}</TableCell>
                    <TableCell>
                      <SelectField value={row.score} onValueChange={(v) => setSoft(name, { score: v })} size="sm">
                        <option value="">—</option>
                        {SCORE_1_5.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </SelectField>
                    </TableCell>
                    <TableCell>
                      <Input type="text" value={row.note} onChange={(e) => setSoft(name, { note: e.target.value })} size="sm" />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

        <SectionLabel>5. Aspettative economiche e disponibilità</SectionLabel>
        <FieldGrid columns={3}>
          <Field label="RAL attuale (€)">
            <Input type="number" value={draft.ralAttuale} onChange={(e) => set('ralAttuale', e.target.value)} placeholder="0" />
          </Field>
          <Field label="RAL richiesta (€)">
            <Input type="number" value={draft.ralRichiesta} onChange={(e) => set('ralRichiesta', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Preavviso">
            <Input type="text" value={draft.preavviso} onChange={(e) => set('preavviso', e.target.value)} placeholder="Es. 2 mesi" />
          </Field>
        </FieldGrid>
        <FieldGrid columns={3}>
          <Field label="Disponibilità trasferte">
            <SelectField value={draft.trasferte} onValueChange={(v) => set('trasferte', v)}>
              <option value="">Seleziona…</option>
              <option>Sì</option>
              <option>No</option>
              <option>Parziale</option>
            </SelectField>
          </Field>
          <Field label="Disponibilità remote/ibrido">
            <SelectField value={draft.ibrido} onValueChange={(v) => set('ibrido', v)}>
              <option value="">Seleziona…</option>
              <option>Sì</option>
              <option>No</option>
              <option>Parziale</option>
            </SelectField>
          </Field>
          <Field label="Data possibile inizio">
            <Input type="date" value={draft.dataInizio} onChange={(e) => set('dataInizio', e.target.value)} />
          </Field>
        </FieldGrid>

        <SectionLabel>6. Punti di forza e aree di attenzione</SectionLabel>
        <Field label="Punti di forza">
          <Textarea value={draft.puntiForza} onChange={(e) => set('puntiForza', e.target.value)} />
        </Field>
        <Field label="Miglioramenti e rischi">
          <Textarea value={draft.areeMiglioramento} onChange={(e) => set('areeMiglioramento', e.target.value)} />
        </Field>

        <SectionLabel>7. Domande poste e risposte significative</SectionLabel>
        <Field label="Domande e risposte chiave" hint="Motivazionali, tecniche e situazionali, con la sintesi delle risposte.">
          <Textarea value={draft.qa} onChange={(e) => set('qa', e.target.value)} />
        </Field>

        <SectionLabel>8. Valutazione complessiva</SectionLabel>
        <FieldGrid>
          <Field label="Giudizio sintetico">
            <Textarea value={draft.giudizioSintetico} onChange={(e) => set('giudizioSintetico', e.target.value)} />
          </Field>
          <Field label="Punteggio complessivo (1–5)">
            <SelectField value={draft.punteggioComplessivo} onValueChange={(v) => set('punteggioComplessivo', v)}>
              <option value="">—</option>
              {SCORE_1_5.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </SelectField>
          </Field>
        </FieldGrid>

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
          <Textarea value={draft.motivazioneDecisione} onChange={(e) => set('motivazioneDecisione', e.target.value)} />
        </Field>

        <SectionLabel>10. Note aggiuntive</SectionLabel>
        <Textarea value={draft.noteAggiuntive} onChange={(e) => set('noteAggiuntive', e.target.value)} size="sm" />

        <FieldGrid>
          <Field label="Data">
            <Input type="date" value={draft.dataFirma} onChange={(e) => set('dataFirma', e.target.value)} />
          </Field>
          <Field label="Firma intervistatore">
            <Input type="text" value={draft.firma} onChange={(e) => set('firma', e.target.value)} placeholder="Nome e cognome" />
          </Field>
        </FieldGrid>
    </>
  )
}
