import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConfirm } from '@/hooks/use-confirm'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { AnagraficaTab } from '@/modules/assessment/gestione5p/AnagraficaTab'
import { CaricamentoTab } from '@/modules/assessment/gestione5p/CaricamentoTab'
import { IndividualeTab } from '@/modules/assessment/gestione5p/IndividualeTab'
import { MetodoTab } from '@/modules/assessment/gestione5p/MetodoTab'
import { PianoTab } from '@/modules/assessment/gestione5p/PianoTab'
import { RisultatiTab } from '@/modules/assessment/gestione5p/RisultatiTab'
import { use5pState } from '@/modules/assessment/gestione5p/use5pState'

const TABS = [
  ['ana', '1', 'Anagrafica'],
  ['piano', '2', 'Piano e schede'],
  ['load', '3', 'Caricamento'],
  ['res', '4', 'Risultati'],
  ['ind', '5', 'Scheda individuale'],
  ['met', '', 'Metodo'],
] as const
type TabId = (typeof TABS)[number][0]
const TAB_KEY = 'sv5p_state_v1_tab'

// "Gestione valutazioni" (Foglio 7, Roberto Feliciani): la Valutazione 5P
// multi-fonte — Dirigente, Peer, Autovalutazione — con le stesse sei schede di
// lavoro del modello SKILL-VISION_Valutazione_5P.html: Anagrafica, Piano e
// schede, Caricamento, Risultati, Scheda individuale, Metodo. Sta nell'Area
// Valutazioni professionali. I dati restano nel browser, come nel modello.
export default function AssessmentGestioneValutazioniPage() {
  const { state: assess, toast } = useAssessment()
  const { state, update, reset } = use5pState(assess.settings.companyName)
  const [tab, setTab] = useState<TabId>(() => {
    try {
      const t = localStorage.getItem(TAB_KEY) as TabId | null
      return t && TABS.some((x) => x[0] === t) ? t : 'ana'
    } catch {
      return 'ana'
    }
  })
  const [selected, setSelected] = useState('')
  const [confirm, confirmDialog] = useConfirm()
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-app-title text-foreground">Valutazione 5P</h2>
          <span className="text-app-small text-muted-foreground">SKILL-VISION · Dirigente · Peer · Autovalutazione</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="g5p-company" className="text-app-small text-muted-foreground">
            Azienda
          </label>
          <Input id="g5p-company" className="w-64" placeholder="Ragione sociale" value={state.company} onChange={(e) => update((s) => ({ ...s, company: e.target.value }))} />
        </div>
      </div>
      {state.demo ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md surface-warning px-4 py-3 text-app-small text-warning">
          <span>
            <b className="font-semibold">Dati di esempio.</b> Persone e voti inventati per mostrare come funziona. Per lavorare su un&apos;azienda reale avvia un nuovo progetto.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (await confirm({ title: 'Cancellare i dati di esempio?', confirmLabel: 'Sì, procedi', destructive: true })) {
                reset()
                go('ana')
              }
            }}
          >
            Nuovo progetto vuoto
          </Button>
        </div>
      ) : null}
      <Tabs value={tab} onValueChange={(v) => go(v as TabId)}>
        <TabsList>
          {TABS.map(([id, n, label]) => (
            <TabsTrigger key={id} value={id}>
              {n ? <span className="rounded-xs border border-border px-1.5 font-mono text-app-caption">{n}</span> : null}
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="ana">
          <AnagraficaTab state={state} update={update} toast={say} />
        </TabsContent>
        <TabsContent value="piano">
          <PianoTab state={state} update={update} toast={say} />
        </TabsContent>
        <TabsContent value="load">
          <CaricamentoTab state={state} update={update} toast={say} />
        </TabsContent>
        <TabsContent value="res">
          <RisultatiTab
            state={state}
            update={update}
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
        <TabsContent value="met">
          <MetodoTab />
        </TabsContent>
      </Tabs>
      {confirmDialog}
    </div>
  )
}
