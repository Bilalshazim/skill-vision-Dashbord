import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { fmtDec } from '@/lib/format'
import { IV_REPORT_ATTACHMENTS, IV_REPORT_CHECKS, IV_REPORT_STEPS, calcIvReportTotal } from '@/modules/recruiting/lib/interview-protocol'
import type { IvReportDraft } from '@/modules/recruiting/lib/interview-protocol'
import type { IvReportFit, IvReportStep } from '@/modules/recruiting/lib/interview-protocol-types'
import { CompareRowsTable } from '@/modules/recruiting/profile-hub/protocol/CompareRowsTable'
import { CheckBox, CheckRow, ChoiceGroup, DocSection, ScoreChoice } from '@/modules/recruiting/profile-hub/protocol/protocol-ui'

const RECO_KEYS = ['reco_offerta', 'reco_riserva', 'reco_ulteriore', 'reco_nonProcedere'] as const
type RecoKey = (typeof RECO_KEYS)[number]
const PHASES = ['1', '2', '3', 'Altro']
const AGG_ROWS = [
  { key: 'tec', noteKey: 'tecNote', label: 'Competenze tecniche' },
  { key: 'soft', noteKey: 'softNote', label: 'Competenze trasversali' },
  { key: 'motiv', noteKey: 'motivNote', label: 'Motivazione e aspettative' },
  { key: 'culture', noteKey: 'cultureNote', label: 'Adeguatezza all’organizzazione' },
] as const
const FIT_ROWS = [
  { key: 'ruolo', label: 'Ruolo e responsabilità', hint: 'Perimetro, obiettivi, autonomia richiesta.' },
  { key: 'team', label: 'Team di inserimento', hint: 'Stile del responsabile, dinamiche del gruppo.' },
  { key: 'cultura', label: 'Cultura aziendale', hint: 'Valori, ritmo, modo di lavorare.' },
] as const
const DECISIONS = ['Approvato', 'Approvato con condizioni', 'Non approvato', 'Da riesaminare']

// Il corpo del Report finale di valutazione, senza cornice, sul modello del
// cliente: la decisione in prima pagina, il dettaglio nelle successive.
export function IvReportForm({ draft, onChange }: { draft: IvReportDraft; onChange: (next: IvReportDraft) => void }) {
  function set<K extends keyof IvReportDraft>(key: K, value: IvReportDraft[K]) {
    onChange({ ...draft, [key]: value })
  }
  function setStep(stepKey: (typeof IV_REPORT_STEPS)[number]['key'], patch: Partial<IvReportStep>) {
    set('steps', { ...draft.steps, [stepKey]: { ...draft.steps[stepKey], ...patch } })
  }
  function setAgg(patch: Partial<IvReportDraft['aggregate']>) {
    set('aggregate', { ...draft.aggregate, ...patch })
  }
  function setFit(key: (typeof FIT_ROWS)[number]['key'], patch: Partial<IvReportFit>) {
    set('fit', { ...draft.fit, [key]: { ...draft.fit[key], ...patch } })
  }
  function setCheck(name: string, patch: Partial<IvReportDraft['verifiche'][string]>) {
    set('verifiche', { ...draft.verifiche, [name]: { ...draft.verifiche[name], ...patch } })
  }
  // Una sola raccomandazione alla volta.
  function setExclusive(key: RecoKey, checked: boolean) {
    if (!checked) {
      set(key, false)
      return
    }
    onChange({ ...draft, reco_offerta: false, reco_riserva: false, reco_ulteriore: false, reco_nonProcedere: false, [key]: true })
  }
  // "Fasi svolte" è un testo con le fasi spuntate, separate da virgola.
  const doneSteps = draft.fasiSvolte.split(',').map((s) => s.trim()).filter(Boolean)
  function toggleStep(name: string, on: boolean) {
    const next = on ? [...doneSteps, name] : doneSteps.filter((s) => s !== name)
    set('fasiSvolte', PHASES.filter((p) => next.includes(p)).join(', ') + next.filter((s) => !PHASES.includes(s)).map((s) => `, ${s}`).join(''))
  }

  const total = calcIvReportTotal(draft.aggregate)
  const lines = (n: number) => Array.from({ length: n }, (_, i) => `${i + 1}. `).join('\n')

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <FieldGrid>
          <Field label="Candidato">
            <Input type="text" value={draft.nominativo} onChange={(e) => set('nominativo', e.target.value)} placeholder="Nome e cognome" />
          </Field>
          <Field label="Codice">
            <Input type="text" value={draft.codice} onChange={(e) => set('codice', e.target.value)} placeholder="Es. CAND-014" />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <Field label="Posizione">
            <Input type="text" value={draft.posizione} onChange={(e) => set('posizione', e.target.value)} />
          </Field>
          <Field label="Data del report">
            <Input type="date" value={draft.dataReport} onChange={(e) => set('dataReport', e.target.value)} />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <Field label="Redatto da (HR)">
            <Input type="text" value={draft.aCuraDi} onChange={(e) => set('aCuraDi', e.target.value)} placeholder="Nome e ruolo" />
          </Field>
          <Field label="Destinatari">
            <Input type="text" value={draft.destinatari} onChange={(e) => set('destinatari', e.target.value)} placeholder="Responsabili che decidono" />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <div className="flex min-w-0 flex-col gap-2">
            <span className="label-mono text-muted-foreground">Fasi svolte</span>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {PHASES.map((p) => (
                <CheckRow key={p} checked={doneSteps.includes(p)} onChange={(c) => toggleStep(p, c)}>
                  {p}
                </CheckRow>
              ))}
            </div>
          </div>
          <Field label="Candidati finalisti">
            <Input type="text" value={draft.finalisti} onChange={(e) => set('finalisti', e.target.value)} placeholder="Quanti e quali" />
          </Field>
        </FieldGrid>
      </section>

      <DocSection n={1} title="In sintesi" hint="La decisione in una pagina.">
        <FieldGrid>
          <div className="flex flex-col gap-2">
            <span className="label-mono text-muted-foreground">Raccomandazione dell’HR</span>
            <CheckBox>
              <CheckRow checked={draft.reco_offerta} onChange={(c) => setExclusive('reco_offerta', c)}>
                Procedere con l&apos;offerta
              </CheckRow>
              <CheckRow checked={draft.reco_riserva} onChange={(c) => setExclusive('reco_riserva', c)}>
                Inserire in lista di riserva
              </CheckRow>
              <CheckRow checked={draft.reco_ulteriore} onChange={(c) => setExclusive('reco_ulteriore', c)}>
                Richiedere un ulteriore step di valutazione
              </CheckRow>
              <CheckRow checked={draft.reco_nonProcedere} onChange={(c) => setExclusive('reco_nonProcedere', c)}>
                Non procedere
              </CheckRow>
            </CheckBox>
          </div>
          <div className="flex flex-col justify-center gap-1 rounded-sm border border-border p-3 text-center">
            <span className="label-mono text-muted-foreground">Media complessiva</span>
            <span className="text-app-title font-mono text-foreground tabular-nums">{total > 0 ? fmtDec(total, 2) : '—'} / 5</span>
            <span className="text-app-caption text-muted-foreground">1 insufficiente · 3 adeguato · 5 eccellente</span>
          </div>
        </FieldGrid>
        <Field label="Sintesi in 3–5 righe" hint="Chi è il candidato, perché lo raccomandiamo (o no), qual è il punto da decidere.">
          <Textarea value={draft.summary} onChange={(e) => set('summary', e.target.value)} />
        </Field>
      </DocSection>

      <DocSection n={2} title="Valutazione per area" hint="Sintesi di verbali, schede di valutazione ed eventuali test.">
        <Table frame size="sm" minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>Area</TableHead>
              <TableHead>Punteggio</TableHead>
              <TableHead>Evidenze che lo motivano</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {AGG_ROWS.map(({ key, noteKey, label }) => (
              <TableRow key={key} className="align-top">
                <TableCell className="font-medium text-foreground">{label}</TableCell>
                <TableCell>
                  <ScoreChoice label={`Punteggio: ${label}`} value={draft.aggregate[key]} onChange={(v) => setAgg({ [key]: v })} />
                </TableCell>
                <TableCell>
                  <Input type="text" size="sm" aria-label={`Evidenze: ${label}`} value={draft.aggregate[noteKey]} onChange={(e) => setAgg({ [noteKey]: e.target.value })} />
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="align-top">
              <TableCell>
                <Input type="text" size="sm" aria-label="Area specifica del ruolo" placeholder="Area specifica del ruolo" value={draft.aggregate.extraLabel} onChange={(e) => setAgg({ extraLabel: e.target.value })} />
              </TableCell>
              <TableCell>
                <ScoreChoice label="Punteggio: area specifica del ruolo" value={draft.aggregate.extra} onChange={(v) => setAgg({ extra: v })} />
              </TableCell>
              <TableCell>
                <Input type="text" size="sm" aria-label="Evidenze: area specifica del ruolo" value={draft.aggregate.extraNote} onChange={(e) => setAgg({ extraNote: e.target.value })} />
              </TableCell>
            </TableRow>
            <TableRow className="bg-muted">
              <TableCell className="label-mono text-foreground">Andamento nel processo</TableCell>
              <TableCell colSpan={2}>
                <ChoiceGroup hideLabel label="Andamento nel processo" value={draft.aggregate.andamento} onChange={(v) => setAgg({ andamento: v })} options={['Cresce', 'Stabile', 'Cala']} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p className="text-app-caption text-muted-foreground">L’ultima area è libera: l’HR può inserire un criterio specifico del ruolo (per esempio portafoglio clienti, lingue, certificazioni).</p>
      </DocSection>

      <DocSection n={3} title="Punti di forza e rischi" hint="Per ogni rischio, indicare come presidiarlo.">
        <FieldGrid>
          <Field label="Punti di forza chiave (con evidenza)">
            <Textarea value={draft.strengths} onChange={(e) => set('strengths', e.target.value)} placeholder={lines(3)} />
          </Field>
          <Field label="Rischi e aree di sviluppo → come presidiarli">
            <Textarea value={draft.risks} onChange={(e) => set('risks', e.target.value)} placeholder={lines(3)} />
          </Field>
        </FieldGrid>
      </DocSection>

      <DocSection n={4} title="Profilo del candidato">
        <FieldGrid>
          <Field label="Formazione">
            <Textarea value={draft.formazione} onChange={(e) => set('formazione', e.target.value)} />
          </Field>
          <Field label="Esperienza rilevante">
            <Textarea value={draft.profiloCandidato} onChange={(e) => set('profiloCandidato', e.target.value)} />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <Field label="Ruolo attuale">
            <Input type="text" value={draft.ruoloAttuale} onChange={(e) => set('ruoloAttuale', e.target.value)} />
          </Field>
          <Field label="Risultato più significativo">
            <Input type="text" value={draft.risultato} onChange={(e) => set('risultato', e.target.value)} />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <Field label="RAL attuale (€)">
            <Input type="number" value={draft.ralAttuale} onChange={(e) => set('ralAttuale', e.target.value)} placeholder="0" />
          </Field>
          <Field label="RAL attesa (€)">
            <Input type="number" value={draft.ralAttesa} onChange={(e) => set('ralAttesa', e.target.value)} placeholder="0" />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <Field label="Preavviso / disponibilità">
            <Input type="text" value={draft.preavviso} onChange={(e) => set('preavviso', e.target.value)} />
          </Field>
          <Field label="Mobilità / sede">
            <Input type="text" value={draft.mobilita} onChange={(e) => set('mobilita', e.target.value)} />
          </Field>
        </FieldGrid>
      </DocSection>

      <DocSection n={5} title="Adeguatezza alla posizione e all’organizzazione">
        <Table frame size="sm" minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>Dimensione</TableHead>
              <TableHead>Valutazione dell’HR</TableHead>
              <TableHead>Fit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FIT_ROWS.map(({ key, label, hint }) => (
              <TableRow key={key} className="align-top">
                <TableCell>
                  <span className="font-medium text-foreground">{label}</span>
                  <p className="text-app-caption text-muted-foreground">{hint}</p>
                </TableCell>
                <TableCell>
                  <Textarea size="sm" className="min-h-16" aria-label={`Valutazione: ${label}`} value={draft.fit[key].text} onChange={(e) => setFit(key, { text: e.target.value })} />
                </TableCell>
                <TableCell>
                  <ChoiceGroup hideLabel label={`Fit: ${label}`} value={draft.fit[key].fit} onChange={(v) => setFit(key, { fit: v })} options={['Alto', 'Medio', 'Basso']} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DocSection>

      <DocSection n={6} title="Percorso di selezione svolto">
        <Table frame size="sm" minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>Fase</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Interlocutore</TableHead>
              <TableHead>Media</TableHead>
              <TableHead>Esito</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {IV_REPORT_STEPS.map(({ key, label }) => (
              <TableRow key={key}>
                <TableCell className="font-medium text-foreground">{label}</TableCell>
                <TableCell>
                  <Input type="date" size="sm" aria-label={`Data: ${label}`} value={draft.steps[key].date} onChange={(e) => setStep(key, { date: e.target.value })} />
                </TableCell>
                <TableCell>
                  <Input type="text" size="sm" aria-label={`Interlocutore: ${label}`} value={draft.steps[key].interlocutore} onChange={(e) => setStep(key, { interlocutore: e.target.value })} />
                </TableCell>
                <TableCell>
                  <Input type="text" size="sm" className="w-20" aria-label={`Media: ${label}`} value={draft.steps[key].media ?? ''} onChange={(e) => setStep(key, { media: e.target.value })} />
                </TableCell>
                <TableCell>
                  <ChoiceGroup hideLabel label={`Esito: ${label}`} value={draft.steps[key].esito} onChange={(v) => setStep(key, { esito: v })} options={['Avanti', 'Stand-by', 'No']} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DocSection>

      <DocSection n={7} title="Confronto con gli altri finalisti" hint="Facoltativo: solo se più candidati per la stessa posizione.">
        <CompareRowsTable scoreLabel="Media" noteLabel="Perché sì / punto distintivo" note2Label="Perché no / dubbio" scoreKind="text" rows={draft.compareRows} onChange={(rows) => set('compareRows', rows)} />
      </DocSection>

      <DocSection n={8} title="Proposta e prossimi passi" hint="Da compilare se la raccomandazione è procedere.">
        <FieldGrid>
          <Field label="Inquadramento / livello">
            <Input type="text" value={draft.proposta.livello} onChange={(e) => set('proposta', { ...draft.proposta, livello: e.target.value })} />
          </Field>
          <Field label="RAL proposta (€)">
            <Input type="number" value={draft.proposta.ral} onChange={(e) => set('proposta', { ...draft.proposta, ral: e.target.value })} placeholder="0" />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <Field label="Data di inizio">
            <Input type="date" value={draft.proposta.inizio} onChange={(e) => set('proposta', { ...draft.proposta, inizio: e.target.value })} />
          </Field>
          <Field label="Data limite offerta">
            <Input type="date" value={draft.proposta.limite} onChange={(e) => set('proposta', { ...draft.proposta, limite: e.target.value })} />
          </Field>
        </FieldGrid>
        <Field label="Note per la negoziazione" hint="Margini, leve del candidato, condizioni da tenere ferme.">
          <Textarea value={draft.condizioniEconomiche} onChange={(e) => set('condizioniEconomiche', e.target.value)} />
        </Field>
        <Table frame size="sm" minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>Verifiche e passi da completare</TableHead>
              <TableHead>Responsabile</TableHead>
              <TableHead>Entro il</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {IV_REPORT_CHECKS.map((name) => (
              <TableRow key={name}>
                <TableCell>
                  <CheckRow checked={draft.verifiche[name]?.done ?? false} onChange={(done) => setCheck(name, { done })}>
                    {name}
                  </CheckRow>
                </TableCell>
                <TableCell>
                  <Input type="text" size="sm" aria-label={`Responsabile: ${name}`} value={draft.verifiche[name]?.responsabile ?? ''} onChange={(e) => setCheck(name, { responsabile: e.target.value })} />
                </TableCell>
                <TableCell>
                  <Input type="date" size="sm" aria-label={`Entro il: ${name}`} value={draft.verifiche[name]?.entro ?? ''} onChange={(e) => setCheck(name, { entro: e.target.value })} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DocSection>

      <DocSection n={9} title="Considerazioni personali dell’HR" hint="Spazio libero: ciò che i punteggi non dicono.">
        <Field label="Contesto, impressioni, segnali non misurabili" hint="Elementi che i responsabili dovrebbero sapere prima di decidere.">
          <Textarea className="min-h-32" value={draft.considerazioniHr} onChange={(e) => set('considerazioniHr', e.target.value)} />
        </Field>
      </DocSection>

      <DocSection n={10} title="Riferimenti e allegati">
        <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-sm border border-border p-3">
          {IV_REPORT_ATTACHMENTS.map((name) => (
            <CheckRow key={name} checked={!!draft.allegati[name]} onChange={(c) => set('allegati', { ...draft.allegati, [name]: c })}>
              {name}
            </CheckRow>
          ))}
        </div>
        <Field label="Altro">
          <Input type="text" value={draft.refAltro} onChange={(e) => set('refAltro', e.target.value)} placeholder="Altri documenti allegati" />
        </Field>
      </DocSection>

      <DocSection n={11} title="Decisione e approvazione" hint="A cura dei responsabili.">
        <ChoiceGroup label="Decisione" value={draft.decisione} onChange={(v) => set('decisione', v)} options={DECISIONS} />
        <Field label="Note / condizioni dei responsabili">
          <Textarea value={draft.decisioneNote} onChange={(e) => set('decisioneNote', e.target.value)} />
        </Field>
        <FieldGrid columns={3}>
          <Field label="Referente HR · firma e data">
            <Input type="text" value={draft.signHr} onChange={(e) => set('signHr', e.target.value)} placeholder="Nome, data e firma" />
          </Field>
          <Field label="Responsabile di linea · firma e data">
            <Input type="text" value={draft.signLinea} onChange={(e) => set('signLinea', e.target.value)} placeholder="Nome, data e firma" />
          </Field>
          <Field label="Direzione · firma e data">
            <Input type="text" value={draft.signHm} onChange={(e) => set('signHm', e.target.value)} placeholder="Nome, data e firma" />
          </Field>
        </FieldGrid>
        <p className="text-app-caption text-muted-foreground">Documento riservato: contiene dati personali trattati ai sensi del Reg. UE 2016/679, da non diffondere oltre i destinatari indicati.</p>
      </DocSection>
    </div>
  )
}

