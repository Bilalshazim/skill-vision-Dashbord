import { Check, CloudOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState } from '@/components/patterns/EmptyState'
import { LoadingState } from '@/components/patterns/LoadingState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConfirm } from '@/hooks/use-confirm'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { linkPeopleToEmployees } from '@/modules/assessment/gestione5p/employees'
import { InvioTab } from '@/modules/assessment/gestione5p/InvioTab'
import { MetodoTab } from '@/modules/assessment/gestione5p/MetodoTab'
import { openProject, saveProject } from '@/modules/assessment/gestione5p/files'
import { PianoTab } from '@/modules/assessment/gestione5p/PianoTab'
import { RaccoltaTab } from '@/modules/assessment/gestione5p/RaccoltaTab'
import { ReportTab } from '@/modules/assessment/gestione5p/ReportTab'
import { RisultatiTab } from '@/modules/assessment/gestione5p/RisultatiTab'
import { ValoriAttesiTab } from '@/modules/assessment/gestione5p/ValoriAttesiTab'
import { type State5p, allEvaluators, blank, edit, evStatus, expCount, norm, people, plural } from '@/modules/assessment/gestione5p/model'
import { use5pState } from '@/modules/assessment/gestione5p/use5pState'

const TABS = [
  ['piano', '1', 'Piano'],
  ['invio', '2', 'Invio schede'],
  ['racc', '3', 'Raccolta'],
  ['att', '4', 'Valori attesi'],
  ['res', '5', 'Risultati'],
  ['rep', '6', 'Report persona'],
  ['met', '', 'Metodo'],
] as const
type TabId = (typeof TABS)[number][0]

// Stato di ogni passo, sotto il nome della scheda: dice a che punto si è
// senza aprirla. `done` accende la spunta.
function stepStatus(s: State5p): Partial<Record<TabId, { text: string; done: boolean }>> {
  const evs = allEvaluators(s)
  const sent = evs.filter((e) => s.sent[norm(e.name)]).length
  const st = evs.map((e) => evStatus(s, e.name))
  const exp = st.reduce((a, x) => a + x.exp, 0)
  const rec = st.reduce((a, x) => a + x.rec, 0)
  const nx = expCount(s)
  return {
    piano: { text: s.plan.length ? `${plural(people(s).length, 'persona', 'persone')}` : 'da importare', done: s.plan.length > 0 },
    invio: { text: evs.length ? `${sent} di ${evs.length} inviate` : '–', done: evs.length > 0 && sent === evs.length },
    racc: { text: exp ? `${rec} di ${exp} ricevute` : s.evals.length ? `${s.evals.length} caricate` : '–', done: exp > 0 && rec >= exp },
    att: { text: nx ? `${nx} valori` : 'facoltativo', done: nx > 0 },
  }
}

// "Gestione valutazioni" (Foglio 7, Roberto Feliciani): la Valutazione 5P
// multi-fonte — dirigente, colleghi, autovalutazione — sul modello
// «Valutazione 5P Multi-Fonte v5» del cliente (2026-10-12): Piano, Invio
// schede, Raccolta, Valori attesi, Risultati, Report persona, Metodo. Sta
// nell'Area Valutazioni professionali. I dati restano nel browser, come nel
// modello; il progetto si salva in un file e si riapre anche da un altro PC.
// Con i dati sul server il 5P si salva lì (use5pState), e le sue persone sono i
// dipendenti dell'anagrafica (gestione5p/employees.ts).
export default function AssessmentGestioneValutazioniPage() {
  const { toast, ui, canEdit, state: assessment, setState: setAssessment } = useAssessment()
  const { state, update, replace, status: loadStatus, error, retry } = use5pState()
  // La scheda aperta sta nell'indirizzo (?tab=), non nel browser: ricaricando
  // si torna lì, e il link si può mandare a un collega.
  const [params, setParams] = useSearchParams()
  const fromUrl = params.get('tab') as TabId | null
  const tab: TabId = fromUrl && TABS.some((x) => x[0] === fromUrl) ? fromUrl : 'piano'
  const [incoming, setIncoming] = useState<File[] | null>(null)
  const [confirm, confirmDialog] = useConfirm()
  const projRef = useRef<HTMLInputElement>(null)
  const say = (m: string) => toast(m, 'ok')
  const status = stepStatus(state)

  // Le persone del piano diventano dipendenti: si collegano a quelli che ci
  // sono già (email o nome) e chi manca si aggiunge all'elenco.
  useEffect(() => {
    if (loadStatus !== 'ready' || !canEdit) return
    const r = linkPeopleToEmployees(state, assessment)
    if (!r) return
    if (r.added) {
      setAssessment(() => r.assessment)
      toast(ui.fivePPeopleAdded(r.added), 'ok')
    }
    update(() => r.s5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadStatus, canEdit, state.people, assessment.employees])

  function go(t: TabId) {
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        next.set('tab', t)
        return next
      },
      { replace: true },
    )
    window.scrollTo(0, 0)
  }
  async function newProject(msg: string) {
    if (await confirm({ title: msg, confirmLabel: 'Sì, procedi', destructive: true })) {
      replace(blank())
      go('piano')
    }
  }

  if (loadStatus === 'loading') return <LoadingState label={ui.serverLoading} rows={6} />
  if (loadStatus === 'error')
    return (
      <EmptyState
        icon={CloudOff}
        title={ui.serverLoadFailedTitle}
        description={ui.serverLoadFailed(error ?? ui.serverOffline)}
        action={
          <Button type="button" variant="outline" onClick={retry}>
            {ui.serverRetry}
          </Button>
        }
      />
    )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-app-title text-foreground">Valutazione 5P</h2>
          <span className="text-app-small text-muted-foreground">SKILL-VISION · Dirigente · Colleghi · Autovalutazione</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="g5p-company" className="text-app-small text-muted-foreground">
            Azienda
          </label>
          <Input id="g5p-company" className="w-56" placeholder="Ragione sociale" value={state.company} onChange={(e) => update((s) => edit(s, (d) => { d.company = e.target.value }))} />
          <Button variant="outline" size="sm" title="Salva in un file tutto il lavoro su questa azienda" onClick={() => saveProject(state)}>
            Salva progetto
          </Button>
          <Button variant="outline" size="sm" title="Riapri un progetto salvato" onClick={() => projRef.current?.click()}>
            Apri progetto
          </Button>
          <input
            ref={projRef}
            type="file"
            accept=".json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              try {
                const s = await openProject(f)
                replace(s)
                go('piano')
                say(`Progetto aperto: ${s.company || 'senza nome'} · ${plural(s.people.length, 'persona', 'persone')}, ${plural(s.evals.length, 'scheda', 'schede')}`)
              } catch (err) {
                say(`Impossibile aprire il progetto: ${err instanceof Error ? err.message : 'file non valido'}`)
              }
            }}
          />
          <Button variant="outline" size="sm" onClick={() => void newProject('Nuovo progetto vuoto? Salva prima quello attuale.')}>
            Nuovo
          </Button>
        </div>
      </div>
      {state.demo ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md surface-warning px-4 py-3 text-app-small text-warning">
          <span>
            <b className="font-semibold">Dati di esempio.</b> Persone e voti inventati per mostrare come funziona. Per lavorare su un&apos;azienda reale avvia un nuovo progetto.
          </span>
          <Button variant="outline" size="sm" onClick={() => void newProject('Cancellare i dati di esempio?')}>
            Nuovo progetto vuoto
          </Button>
        </div>
      ) : null}
      <Tabs value={tab} onValueChange={(v) => go(v as TabId)}>
        <TabsList className="max-w-full overflow-x-auto">
          {TABS.map(([id, n, label]) => {
            const st = status[id]
            return (
              <TabsTrigger key={id} value={id} title={st ? `${label}: ${st.text}` : label}>
                {n ? (
                  <span className="inline-flex size-5 items-center justify-center rounded-xs border border-border font-mono text-app-caption">
                    {st?.done ? <Check className="size-3" aria-label="fatto" /> : n}
                  </span>
                ) : null}
                {label}
                {st ? <span className="hidden text-app-caption text-muted-foreground xl:inline">· {st.text}</span> : null}
              </TabsTrigger>
            )
          })}
        </TabsList>
        <TabsContent value="piano">
          <PianoTab state={state} update={update} toast={say} onGo={() => go('invio')} />
        </TabsContent>
        <TabsContent value="invio">
          <InvioTab
            state={state}
            update={update}
            toast={say}
            onGo={() => go('piano')}
            onAnswers={(f) => {
              setIncoming([f])
              go('racc')
            }}
          />
        </TabsContent>
        <TabsContent value="racc">
          <RaccoltaTab state={state} update={update} toast={say} incoming={incoming} onConsumed={() => setIncoming(null)} />
        </TabsContent>
        <TabsContent value="att">
          <ValoriAttesiTab state={state} update={update} toast={say} onGoPeople={() => go('piano')} />
        </TabsContent>
        <TabsContent value="res">
          <RisultatiTab
            state={state}
            update={update}
            toast={say}
            onOpen={(id) => {
              update((s) => edit(s, (d) => { d.set.rep = id }))
              go('rep')
            }}
          />
        </TabsContent>
        <TabsContent value="rep">
          <ReportTab state={state} update={update} />
        </TabsContent>
        <TabsContent value="met">
          <MetodoTab state={state} />
        </TabsContent>
      </Tabs>
      {confirmDialog}
    </div>
  )
}
