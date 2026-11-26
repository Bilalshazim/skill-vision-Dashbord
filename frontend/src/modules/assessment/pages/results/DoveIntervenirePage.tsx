import { useState } from 'react'

import { MetricListCard } from '@/components/patterns/MetricListCard'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { PeopleBandsBlock, TodoNowBlock, ValueLossBlock } from '@/modules/assessment/components/PanoramicaBlocks'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'

// 04 · Dove intervenire (CLAUDE.md, Fase 6; Decisioni di Roberto del 2026-11-26).
// 1 · La situazione oggi: due finestre, Personale da potenziare (la fascia Da potenziare) e
// Personale complesso (la fascia Critici), con quante persone, la quota sulle persone valutate e
// l'elenco dal punteggio più basso. Tolti i punti 2 (Da seguire subito, Colloqui di restituzione,
// Mansione da cui partire) e 3 (L'impatto in euro). «Cosa ti suggeriamo di fare» resta, con il
// link alla Panoramica, e sotto i tre blocchi spostati dalla Panoramica: Da fare adesso, Dove si
// perde valore, Le persone fascia per fascia.
export default function DoveIntervenirePage() {
  const { res, data, win, theme, crumbs, home, demoNote } = useAssessmentResults('dove-intervenire')
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const pctOf = (n: number) => (data.total ? Math.round((n / data.total) * 100) : 0)
  const staffWindow = (list: typeof data.byTier.sviluppo, title: string, caption: string) => (
    <MetricListCard
      hover
      title={title}
      value={res.countPct(list.length, pctOf(list.length))}
      caption={caption}
      listTitle={res.listBandLow(title)}
      listSub={res.listOpenHint}
      items={[...list]
        .sort((a, b) => a.score - b.score)
        .map((r) => ({ id: r.e.id, label: `${r.e.nome} ${r.e.cognome}`, meta: r.e.ruolo || r.e.mansione || undefined, value: res.winOutOf10(fmt1it(r.score)), onClick: () => setDrawerId(r.e.id) }))}
      emptyText={res.nobody}
    />
  )
  return (
    <>
      <ResultsPage
        actions={<AssessmentModeSwitch />}
        crumbs={crumbs}
        number={win.number}
        theme={theme}
        title={win.title}
        question={win.q}
        why={res.doveWhy}
        empty={data.total ? undefined : { title: res.noTestsTitle, description: res.noTests }}
        situation={{
          wide: true,
          chart: (
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
              {staffWindow(data.byTier.sviluppo, res.doveBelowTitle, res.doveBelowCaption)}
              {staffWindow(data.byTier.critica, res.doveComplexTitle, res.doveComplexCaption)}
            </div>
          ),
        }}
        suggestion={{
          text: res.doveSuggest,
          link: { label: res.goPanoramica, to: '/assessment/panoramica' },
          content: (
            <>
              <TodoNowBlock />
              <ValueLossBlock />
              <PeopleBandsBlock />
            </>
          ),
        }}
        home={home}
        demoNote={demoNote}
        hoverCards
      />
      {drawerId ? <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} /> : null}
    </>
  )
}
