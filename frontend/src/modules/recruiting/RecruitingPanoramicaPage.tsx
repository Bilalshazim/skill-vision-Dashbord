import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { ActionList, type ActionItem } from '@/components/patterns/ActionList'
import { ChartCard } from '@/components/patterns/ChartCard'
import { PageHeader } from '@/components/patterns/PageHeader'
import { StatCard } from '@/components/patterns/StatCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { QualityStackedBar } from '@/modules/recruiting/components/QualityStackedBar'
import { SelectionFunnel } from '@/modules/recruiting/components/SelectionFunnel'
import { UpcomingList } from '@/modules/recruiting/components/UpcomingList'
import { useRecruitingHomeData } from '@/modules/recruiting/lib/use-recruiting-home-data'

// La Panoramica di Recruiting (CLAUDE.md, Fase 6, deciso il 2026-10-23): la
// pagina d'ingresso del modulo, stesso schema di quella di Assessment.
// Prima `/recruiting` apriva "Profilo della ricerca", che resta nella barra
// laterale con le sue tre card. Tutto visibile all'apertura, testo a
// sinistra, superfici neutre; i conteggi sono persone o posizioni. Dall'alto:
// intestazione, Stato attuale, Da fare adesso, In programma (i prossimi
// colloqui, che esistono già), Dove guardare (fasce di idoneità e imbuto, con
// il link alle loro pagine). Solo dati che l'applicazione ha già.
export default function RecruitingPanoramicaPage() {
  const data = useRecruitingHomeData()
  const o = data.overview
  const updated = o.lastUpdate ? o.lastUpdate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : null
  const suitablePct = data.rankedCount ? Math.round((o.suitable / data.rankedCount) * 100) : 0

  // Dalla più urgente: un link non inviato ferma il candidato, un test letto
  // tardi ritarda il colloquio.
  const todo: ActionItem[] = [
    { key: 'links', label: 'Link test da inviare', description: 'Candidati preselezionati che non hanno ancora ricevuto il link al test', count: o.linksToSend, unit: 'candidati', to: '/recruiting/preselezionati', linkLabel: 'Apri' },
    { key: 'tests', label: 'Test completati da leggere', description: 'Test conclusi, senza ancora un colloquio in programma', count: o.testsToRead, unit: 'candidati', to: '/recruiting/classifica-test', linkLabel: 'Apri' },
    { key: 'evaluate', label: 'Candidati da valutare', description: 'In classifica nella fascia «Da valutare»: con piano di sviluppo o con gap strutturali', count: o.toEvaluate, unit: 'candidati', to: '/recruiting/fasce-idoneita', linkLabel: 'Apri' },
    { key: 'empty', label: 'Posizioni senza candidati', description: 'Posizioni aperte senza nessun candidato preselezionato', count: o.openingsWithoutCandidates, unit: o.openingsWithoutCandidates === 1 ? 'posizione' : 'posizioni', to: '/recruiting/pipeline', linkLabel: 'Apri' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        level="page"
        className="mb-0"
        title="Panoramica"
        description={`${o.companyName ? `${o.companyName} · ` : ''}${updated ? `dati aggiornati al ${updated}` : 'nessun dato ancora registrato'}`}
        actions={
          <Button asChild size="sm">
            <Link to="/recruiting/job-profile">Nuova ricerca</Link>
          </Button>
        }
      />

      <section>
        <PageHeader title="Stato attuale" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Posizioni aperte" value={o.openings} />
          <StatCard label="Candidati in selezione" value={o.inSelection} note="Preselezionati nelle posizioni aperte" />
          <StatCard label="Idonei" value={o.suitable} tone={o.suitable ? 'success' : 'neutral'} note={`Fascia «Idoneo» · ${suitablePct}% dei candidati in classifica`} />
          <StatCard label="Colloqui in programma" value={o.interviewsScheduled} />
        </div>
      </section>

      <section>
        <PageHeader title="Da fare adesso" description="Le azioni aperte, dalla più urgente." />
        <ActionList
          items={todo}
          empty={{ title: 'Nessuna azione aperta.', description: 'Le azioni compaiono quando ci sono candidati preselezionati, test completati o posizioni da riempire.' }}
        />
      </section>

      <section>
        <PageHeader title="In programma" description="I prossimi colloqui, per data." actions={<SeeMore to="/recruiting/colloqui">Vedi tutti i colloqui</SeeMore>} />
        <Card className="max-w-3xl">
          <UpcomingList upcoming={data.upcoming} emptyText="Nessun colloquio in programma. I colloqui si fissano da Avanzamento della selezione, dopo il test." />
        </Card>
      </section>

      <section>
        <PageHeader title="Dove guardare" description="Due sintesi, ognuna con il link all'analisi completa." />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard
            title="Candidati per fascia di idoneità"
            description={`${data.rankedCount} candidati in classifica · posizione attiva: ${data.roleLabel}`}
            height="auto"
            empty={data.rankedCount ? undefined : { title: 'Nessun candidato in classifica.', description: 'La classifica si forma quando i candidati completano il test soft skill.' }}
            footer={<SeeMore to="/recruiting/fasce-idoneita">Apri Candidati per fascia</SeeMore>}
          >
            <QualityStackedBar buckets={data.buckets} total={data.rankedCount} />
          </ChartCard>
          <ChartCard title="Imbuto di selezione" description="Dal CV caricato alla selezione finale" height="lg" footer={<SeeMore to="/recruiting/imbuto">Apri Imbuto di selezione</SeeMore>}>
            <SelectionFunnel stages={data.funnel} />
          </ChartCard>
        </div>
      </section>
    </div>
  )
}

function SeeMore({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link to={to}>
        {children}
        <ArrowRight />
      </Link>
    </Button>
  )
}
