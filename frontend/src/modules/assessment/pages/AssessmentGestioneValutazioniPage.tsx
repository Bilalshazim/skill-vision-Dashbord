import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConfirm } from '@/hooks/use-confirm'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { AnagraficaTab } from '@/modules/assessment/gestione5p/AnagraficaTab'
import { AssegnazioniTab } from '@/modules/assessment/gestione5p/AssegnazioniTab'
import { CaricamentoTab } from '@/modules/assessment/gestione5p/CaricamentoTab'
import { IndividualeTab } from '@/modules/assessment/gestione5p/IndividualeTab'
import { InvioTab } from '@/modules/assessment/gestione5p/InvioTab'
import { MetodoTab } from '@/modules/assessment/gestione5p/MetodoTab'
import { openProject, saveProject } from '@/modules/assessment/gestione5p/files'
import { RisultatiTab } from '@/modules/assessment/gestione5p/RisultatiTab'
import { ValoriAttesiTab } from '@/modules/assessment/gestione5p/ValoriAttesiTab'
import { blank, edit } from '@/modules/assessment/gestione5p/model'
import { use5pState } from '@/modules/assessment/gestione5p/use5pState'

const TABS = [
  ['ana', '1', 'Anagrafica'],
  ['ass', '2', 'Assegnazioni'],
  ['invio', '3', 'Invio schede'],
  ['load', '4', 'Caricamento'],
  ['res', '5', 'Risultati'],
  ['ind', '6', 'Scheda individuale'],
  ['att', '', 'Valori attesi'],
  ['met', '', 'Metodo'],
] as const
type TabId = (typeof TABS)[number][0]
const TAB_KEY = 'sv5p_state_v1_tab'

// "Gestione valutazioni" (Foglio 7, Roberto Feliciani): la Valutazione 5P
// multi-fonte — Dirigente, Peer, Autovalutazione — con le schede di lavoro del
// modello Valutazione 5P Multi-Fonte.html: Anagrafica, Assegnazioni, Invio
// schede, Caricamento, Risultati, Scheda individuale, Metodo. Sta nell'Area
// Valutazioni professionali. I dati restano nel browser, come nel modello; il
// progetto si salva in un file e si riapre anche da un altro computer.
export default function AssessmentGestioneValutazioniPage() {
  const { toast } = useAssessment()
  const { state, update, replace } = use5pState()
  const [tab, setTab] = useState<TabId>(() => {
    try {
      const t = localStorage.getItem(TAB_KEY) as TabId | null
      return t && TABS.some((x) => x[0] === t) ? t : 'ana'
    } catch {
      return 'ana'
    }
  })
  const [selected, setSelected] = useState('')
  const [incoming, setIncoming] = useState<File[] | null>(null)
  const [confirm, confirmDialog] = useConfirm()
  const projRef = useRef<HTMLInputElement>(null)
  const say = (m: string) => toast(m, 'ok')

  function go(t: TabId) {
    setTab(t)
    try {
      localStorage.setItem(TAB_KEY, t)
    } catch {
      /* archivio non disponibile */
    }
    window.scrollTo(0, 0)
  }
  async function newProject(msg: string) {
    if (await confirm({ title: msg, confirmLabel: 'Sì, procedi', destructive: true })) {
      replace(blank())
      go('ana')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-app-title text-foreground">Valutazione 5P</h2>
          <span className="text-app-small text-muted-foreground">SKILL-VISION · Dirigente · Peer · Autovalutazione</span>
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
                go('ana')
                say(`Progetto aperto: ${s.company || 'senza nome'} · ${s.people.length} dipendenti, ${s.evals.length} schede`)
              } catch (err) {
                say(`Impossibile aprire: ${err instanceof Error ? err.message : ''}`)
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
          {TABS.map(([id, n, label]) => (
            <TabsTrigger key={id} value={id}>
              {n ? <span className="rounded-xs border border-border px-1.5 font-mono text-app-caption">{n}</span> : null}
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="ana">
          <AnagraficaTab state={state} update={update} toast={say} onGo={() => go('ass')} />
        </TabsContent>
        <TabsContent value="ass">
          <AssegnazioniTab state={state} update={update} toast={say} onGo={() => go('invio')} />
        </TabsContent>
        <TabsContent value="invio">
          <InvioTab
            state={state}
            update={update}
            toast={say}
            onGo={(t) => go(t)}
            onAnswers={(f) => {
              setIncoming([f])
              go('load')
            }}
          />
        </TabsContent>
        <TabsContent value="load">
          <CaricamentoTab state={state} update={update} toast={say} incoming={incoming} onConsumed={() => setIncoming(null)} />
        </TabsContent>
        <TabsContent value="res">
          <RisultatiTab
            state={state}
            toast={say}
            onOpen={(k) => {
              setSelected(k)
              go('ind')
            }}
          />
        </TabsContent>
        <TabsContent value="ind">
          <IndividualeTab state={state} selected={selected} onSelect={setSelected} />
        </TabsContent>
        <TabsContent value="att">
          <ValoriAttesiTab state={state} update={update} />
        </TabsContent>
        <TabsContent value="met">
          <MetodoTab />
        </TabsContent>
      </Tabs>
      {confirmDialog}
    </div>
  )
}
