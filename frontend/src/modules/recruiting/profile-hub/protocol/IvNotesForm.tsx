import { InlineAlert } from '@/components/patterns/InlineAlert'
import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { IVN_OPENING, IVN_PATH, IVN_SUMMARY_AREAS, IVN_TRANSVERSAL } from '@/modules/recruiting/lib/interview-protocol'
import type { IvNotesDraft, IvQuestion } from '@/modules/recruiting/lib/interview-protocol'
import type { IvNotesSoftRow, IvNotesTecRow } from '@/modules/recruiting/lib/interview-protocol-types'
import { AddQuestionButton, CustomQuestionRows, QuestionLabelInput } from '@/modules/recruiting/profile-hub/protocol/EditableQuestions'
import { CheckBox, CheckRow, ChoiceGroup, DocPart, DocSection, QuestionRow, QuestionTable, ScoreChoice, ScoreSelect } from '@/modules/recruiting/profile-hub/protocol/protocol-ui'

const EXCLUSIVE_KEYS = ['esitoProcedi', 'esitoStandby', 'esitoAlternativo', 'esitoNonIdoneo'] as const
type ExclusiveKey = (typeof EXCLUSIVE_KEYS)[number]
const TEC_ROWS = ['row1', 'row2', 'row3', 'row4'] as const
const QUESTION_COLUMNS: [string, string, string] = ['Domanda', 'Risposta / appunti', 'Punt.']

// Il corpo del Verbale di colloquio, senza cornice, sul modello del cliente:
// lo usano il dialog dell'Area Valutatore e la pagina dei valutatori esterni.
// Riceve la bozza e la restituisce modificata.
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
  function setSummary(name: string, patch: Partial<IvNotesSoftRow>) {
    onChange({ ...draft, riepilogo: { ...draft.riepilogo, [name]: { ...(draft.riepilogo[name] || { score: '', note: '' }), ...patch } } })
  }
  // Un solo esito alla volta: sceglierne uno toglie gli altri.
  function setExclusive(key: ExclusiveKey, checked: boolean) {
    if (!checked) {
      set(key, false)
      return
    }
    onChange({ ...draft, esitoProcedi: false, esitoStandby: false, esitoAlternativo: false, esitoNonIdoneo: false, [key]: true })
  }

  // Le domande fisse hanno il testo riscrivibile (softLabels): la chiave resta
  // quella originale, così il confronto fra valutatori le riconosce.
  const fixedRows = (list: IvQuestion[]) =>
    list.map((q) => {
      const row = draft.soft[q.name] || { score: '', note: '' }
      return (
        <QuestionRow
          key={q.name}
          prompt={<QuestionLabelInput original={q.name} labels={draft.softLabels} onChange={(softLabels) => set('softLabels', softLabels)} />}
          hint={q.hint}
          note={row.note}
          onNote={(note) => setSoft(q.name, { note })}
          score={row.score}
          onScore={(score) => setSoft(q.name, { score })}
          noteLabel={q.name}
        />
      )
    })

  return (
    <div className="flex flex-col gap-6">
      <DocSection n={1} title="Dati del colloquio">
        <FieldGrid>
          <Field label="Candidato">
            <Input type="text" value={draft.nominativo} onChange={(e) => set('nominativo', e.target.value)} placeholder="Nome e cognome" />
          </Field>
          <Field label="Data">
            <Input type="date" value={draft.data} onChange={(e) => set('data', e.target.value)} />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <Field label="Posizione / ruolo">
            <Input type="text" value={draft.posizione} onChange={(e) => set('posizione', e.target.value)} />
          </Field>
          <ChoiceGroup label="Modalità" value={draft.modalita} onChange={(v) => set('modalita', v)} options={['In presenza', 'Video', 'Telefono']} />
        </FieldGrid>
        <FieldGrid>
          <ChoiceGroup label="Fase" value={draft.faseProcesso} onChange={(v) => set('faseProcesso', v)} options={['1°', '2°', 'Finale']} />
          <FieldGrid>
            <Field label="Orario">
              <Input type="time" value={draft.ora} onChange={(e) => set('ora', e.target.value)} />
            </Field>
            <Field label="Durata">
              <Input type="text" value={draft.durata} onChange={(e) => set('durata', e.target.value)} placeholder="Es. 45 minuti" />
            </Field>
          </FieldGrid>
        </FieldGrid>
        <FieldGrid>
          <Field label="Intervistatore/i">
            <Input type="text" value={draft.intervistatori} onChange={(e) => set('intervistatori', e.target.value)} placeholder="Nomi e ruoli" />
          </Field>
          <Field label="Canale di candidatura">
            <Input type="text" value={draft.canaleCandidatura} onChange={(e) => set('canaleCandidatura', e.target.value)} placeholder="Es. sito aziendale, LinkedIn, segnalazione" />
          </Field>
        </FieldGrid>
      </DocSection>

      <DocSection n={2} title="Profilo ricercato" hint="Riepilogo da compilare prima del colloquio.">
        <FieldGrid>
          <Field label="Requisiti imprescindibili (must have)">
            <Textarea value={draft.profiloRicercato} onChange={(e) => set('profiloRicercato', e.target.value)} placeholder={'Requisito principale 1 (es. esperienza minima, area di competenza)\nRequisito principale 2'} />
          </Field>
          <Field label="Requisiti graditi (nice to have)">
            <Textarea value={draft.profiloNice} onChange={(e) => set('profiloNice', e.target.value)} />
          </Field>
        </FieldGrid>
      </DocSection>

      <DocPart part="Parte A" title="Traccia di colloquio · domande di prassi" />
      <InlineAlert tone="warning" title="Promemoria">
        Non porre domande su stato civile e famiglia, gravidanza o progetti familiari, religione, opinioni politiche o sindacali, salute, orientamento sessuale, origine etnica, né su altro non rilevante per la valutazione professionale
        (art. 8 L. 300/1970; art. 10 D.Lgs. 276/2003). Dati trattati ai sensi del Reg. UE 2016/679.
      </InlineAlert>
      <p className="text-app-caption text-muted-foreground">Scala punteggi: 1 insufficiente · 2 parziale · 3 adeguato · 4 buono · 5 eccellente. Il punteggio si assegna solo dove la domanda ha prodotto evidenze concrete.</p>

      <DocSection n={3} title="Apertura e motivazione">
        <QuestionTable columns={QUESTION_COLUMNS}>{fixedRows(IVN_OPENING)}</QuestionTable>
      </DocSection>

      <DocSection n={4} title="Percorso professionale e formativo">
        <QuestionTable columns={QUESTION_COLUMNS}>{fixedRows(IVN_PATH)}</QuestionTable>
      </DocSection>

      <DocSection n={5} title="Competenze professionali" hint="Per ogni competenza chiedere un esempio concreto: contesto, azione, risultato.">
        <Table frame size="sm" minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>Competenza richiesta dal ruolo</TableHead>
              <TableHead>Livello dichiarato</TableHead>
              <TableHead>Esempio / evidenza emersa</TableHead>
              <TableHead>Punt.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TEC_ROWS.map((rowKey, i) => (
              <TableRow key={rowKey} className="align-top">
                <TableCell>
                  <Input type="text" size="sm" aria-label={`Competenza ${i + 1}`} value={draft.tecnica[rowKey].area} onChange={(e) => setTec(rowKey, { area: e.target.value })} placeholder={`Es. Competenza tecnica ${i + 1}`} />
                </TableCell>
                <TableCell>
                  <ChoiceGroup hideLabel label={`Livello dichiarato, competenza ${i + 1}`} value={draft.tecnica[rowKey].livello ?? ''} onChange={(v) => setTec(rowKey, { livello: v })} options={['Base', 'Medio', 'Alto']} />
                </TableCell>
                <TableCell>
                  <Textarea size="sm" className="min-h-12" aria-label={`Evidenza, competenza ${i + 1}`} value={draft.tecnica[rowKey].note} onChange={(e) => setTec(rowKey, { note: e.target.value })} />
                </TableCell>
                <TableCell>
                  <ScoreSelect value={draft.tecnica[rowKey].score} onChange={(v) => setTec(rowKey, { score: v })} label={`Punteggio, competenza ${i + 1}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DocSection>

      <DocSection n={6} title="Competenze trasversali e attitudinali" hint="Metodo STAR: Situazione · Compito · Azione · Risultato.">
        <QuestionTable columns={QUESTION_COLUMNS}>
          {IVN_TRANSVERSAL.map((q) => {
            const row = draft.soft[q.name] || { score: '', note: '' }
            return (
              <QuestionRow
                key={q.name}
                title={q.name}
                prompt={<QuestionLabelInput original={q.name} display={q.question} labels={draft.softLabels} onChange={(softLabels) => set('softLabels', softLabels)} />}
                hint={q.hint}
                note={row.note}
                onNote={(note) => setSoft(q.name, { note })}
                score={row.score}
                onScore={(score) => setSoft(q.name, { score })}
                noteLabel={q.name}
              />
            )
          })}
        </QuestionTable>
      </DocSection>

      <DocSection n={7} title="Aspettative e disponibilità">
        <FieldGrid>
          <Field label="RAL attuale (€)">
            <Input type="number" value={draft.ralAttuale} onChange={(e) => set('ralAttuale', e.target.value)} placeholder="0" />
          </Field>
          <Field label="RAL attesa (€)">
            <Input type="number" value={draft.ralRichiesta} onChange={(e) => set('ralRichiesta', e.target.value)} placeholder="0" />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <Field label="Preavviso">
            <Input type="text" value={draft.preavviso} onChange={(e) => set('preavviso', e.target.value)} placeholder="Es. 2 mesi" />
          </Field>
          <Field label="Data possibile di inizio">
            <Input type="date" value={draft.dataInizio} onChange={(e) => set('dataInizio', e.target.value)} />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <ChoiceGroup label="Contratto gradito" value={draft.contratto} onChange={(v) => set('contratto', v)} options={['Indeterminato', 'Determinato', 'P. IVA']} />
          <ChoiceGroup label="Orario" value={draft.orario} onChange={(v) => set('orario', v)} options={['Full-time', 'Part-time']} />
        </FieldGrid>
        <FieldGrid>
          <Field label="Sede / mobilità">
            <Input type="text" value={draft.mobilita} onChange={(e) => set('mobilita', e.target.value)} />
          </Field>
          <ChoiceGroup label="Trasferte" value={draft.trasferte} onChange={(v) => set('trasferte', v)} options={['Sì', 'No', 'Limitate']} />
        </FieldGrid>
        <Field label="Altre selezioni in corso">
          <Input type="text" value={draft.altreSelezioni} onChange={(e) => set('altreSelezioni', e.target.value)} />
        </Field>
      </DocSection>

      <DocSection n={8} title="Domande del candidato" hint="Cosa ha chiesto su ruolo, team, crescita, cultura.">
        <Textarea aria-label="Domande del candidato" value={draft.domandeCandidato} onChange={(e) => set('domandeCandidato', e.target.value)} />
      </DocSection>

      <DocPart part="Parte B" title="Domande personalizzate dell’HR · spazio libero" />
      <p className="text-app-small text-muted-foreground">Qui si inseriscono le domande costruite su misura per il ruolo e per questo candidato: casi pratici, approfondimenti sul CV, verifiche tecniche, valori aziendali.</p>
      <div className="rounded-sm border border-border bg-muted p-3 text-app-caption text-muted-foreground">
        <p className="label-mono mb-2 text-foreground">Spunti per costruirle</p>
        <ul className="flex flex-col gap-1">
          <li>
            <b className="font-medium text-foreground">Tecniche di ruolo:</b> “Mi mostri come imposterebbe [attività tipica del ruolo].”
          </li>
          <li>
            <b className="font-medium text-foreground">Situazionali:</b> “Se un cliente o un collega [scenario], cosa farebbe nelle prime 24 ore?”
          </li>
          <li>
            <b className="font-medium text-foreground">Dal CV:</b> “Nel [anno] passa da X a Y: cosa è successo e cosa ha deciso lei?”
          </li>
          <li>
            <b className="font-medium text-foreground">Culturali:</b> “In quale ambiente rende al meglio? Quale stile di guida la fa crescere?”
          </li>
          <li>
            <b className="font-medium text-foreground">Di verifica:</b> “Cosa direbbe di lei il suo ultimo responsabile, e su cosa le chiederebbe di migliorare?”
          </li>
        </ul>
      </div>
      <QuestionTable columns={['Domanda personalizzata', 'Sintesi della risposta', 'Punt.']}>
        <CustomQuestionRows rows={draft.extraQuestions ?? []} onChange={(q) => set('extraQuestions', q)} />
      </QuestionTable>
      <AddQuestionButton rows={draft.extraQuestions} onChange={(q) => set('extraQuestions', q)} />

      <DocPart part="Parte C" title="Valutazione ed esito" />

      <DocSection n={9} title="Punti di forza e aree di attenzione">
        <FieldGrid>
          <Field label="Punti di forza">
            <Textarea value={draft.puntiForza} onChange={(e) => set('puntiForza', e.target.value)} />
          </Field>
          <Field label="Aree di attenzione / da verificare">
            <Textarea value={draft.areeMiglioramento} onChange={(e) => set('areeMiglioramento', e.target.value)} />
          </Field>
        </FieldGrid>
      </DocSection>

      <DocSection n={10} title="Riepilogo valutazione">
        <Table frame size="sm" minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>Area</TableHead>
              <TableHead>Punteggio</TableHead>
              <TableHead>Nota sintetica</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {IVN_SUMMARY_AREAS.map((area) => {
              const row = draft.riepilogo[area] || { score: '', note: '' }
              return (
                <TableRow key={area}>
                  <TableCell className="font-medium text-foreground">{area}</TableCell>
                  <TableCell>
                    <ScoreChoice label={`Punteggio: ${area}`} value={row.score} onChange={(score) => setSummary(area, { score })} />
                  </TableCell>
                  <TableCell>
                    <Input type="text" size="sm" aria-label={`Nota: ${area}`} value={row.note} onChange={(e) => setSummary(area, { note: e.target.value })} />
                  </TableCell>
                </TableRow>
              )
            })}
            <TableRow className="bg-muted">
              <TableCell className="font-semibold text-foreground">Valutazione complessiva</TableCell>
              <TableCell>
                <ScoreChoice label="Valutazione complessiva" value={draft.punteggioComplessivo} onChange={(v) => set('punteggioComplessivo', v)} />
              </TableCell>
              <TableCell>
                <Input type="text" size="sm" aria-label="Nota: valutazione complessiva" value={draft.giudizioSintetico} onChange={(e) => set('giudizioSintetico', e.target.value)} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DocSection>

      <DocSection n={11} title="Esito del colloquio">
        <CheckBox>
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
        </CheckBox>
        <Field label="Prossimo passo e data">
          <Input type="text" value={draft.prossimoPasso} onChange={(e) => set('prossimoPasso', e.target.value)} />
        </Field>
      </DocSection>

      <DocSection n={12} title="Note aggiuntive">
        <Textarea aria-label="Note aggiuntive" value={draft.noteAggiuntive} onChange={(e) => set('noteAggiuntive', e.target.value)} />
        <FieldGrid>
          <Field label="Intervistatore (nome e firma)">
            <Input type="text" value={draft.firma} onChange={(e) => set('firma', e.target.value)} placeholder="Nome e cognome" />
          </Field>
          <Field label="Data di compilazione">
            <Input type="date" value={draft.dataFirma} onChange={(e) => set('dataFirma', e.target.value)} />
          </Field>
        </FieldGrid>
      </DocSection>
    </div>
  )
}
