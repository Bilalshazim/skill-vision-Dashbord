import { ArrowRight, Download } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { ActionList, type ActionItem } from '@/components/patterns/ActionList'
import { ChartCard } from '@/components/patterns/ChartCard'
import { PageHeader } from '@/components/patterns/PageHeader'
import { StatCard } from '@/components/patterns/StatCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { downloadText } from '@/lib/download'
import { QualityStackedBar } from '@/modules/recruiting/components/QualityStackedBar'
import { SelectionFunnel } from '@/modules/recruiting/components/SelectionFunnel'
import { UpcomingList } from '@/modules/recruiting/components/UpcomingList'
import { STAGES } from '@/modules/recruiting/lib/position-funnel'
import { type RecruitingHomeData, useRecruitingHomeData } from '@/modules/recruiting/lib/use-recruiting-home-data'

// La Panoramica di Recruiting (CLAUDE.md, Fase 6, deciso il 2026-10-23): la
// pagina d'ingresso del modulo, stesso schema di quella di Assessment, e il
// posto dove confluisce "Stato dell'arte". Guarda tutte le posizioni aperte
// della società attiva (il Profilo della ricerca ne guarda una sola). Tutto
// visibile all'apertura, testo a sinistra, superfici neutre; i conteggi sono
// persone o posizioni. Dall'alto: intestazione, Stato attuale, Da fare adesso,
// In programma (i prossimi colloqui), Dove guardare (fasce di idoneità e
// imbuto, con il link alle loro pagine). Solo dati che l'applicazione ha già.
export default function RecruitingPanoramicaPage() {
  const data = useRecruitingHomeData()
  const o = data.overview
  const updated = o.lastUpdate ? o.lastUpdate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : null
  const suitablePct = data.rankedCount ? Math.round((o.suitable / data.rankedCount) * 100) : 0

  // Dalla più urgente: un invito non mandato ferma il candidato, un test letto
  // tardi ritarda il colloquio.
  const todo: ActionItem[] = [
    { key: 'invite', label: 'Candidati da invitare al test', description: 'CV caricati, il test delle competenze trasversali non è ancora partito', count: o.toInvite, unit: 'candidati', to: '/recruiting/pagina-a', linkLabel: 'Invita' },
    { key: 'links', label: 'Link al test pronti da inviare', description: 'Candidati preselezionati che non hanno ancora ricevuto il link', count: o.linksToSend, unit: 'candidati', to: '/recruiting/preselezionati', linkLabel: 'Apri' },
    { key: 'tests', label: 'Test da leggere', description: 'Test completati, senza ancora un colloquio in programma', count: o.testsToRead, unit: 'candidati', to: '/recruiting/classifica-test', linkLabel: 'Apri' },
    { key: 'evaluate', label: 'Candidati da valutare', description: 'In classifica nella fascia «Da valutare»: con piano di sviluppo o con gap strutturali', count: o.toEvaluate, unit: 'candidati', to: '/recruiting/fasce-idoneita', linkLabel: 'Apri' },
    { key: 'empty', label: 'Posizioni senza candidati', description: 'Posizioni aperte senza nessun candidato preselezionato', count: o.openingsWithoutCandidates, unit: o.openingsWithoutCandidates === 1 ? 'posizione' : 'posizioni', to: '/recruiting/imbuto-scelta?ambito=tutte', linkLabel: 'Apri' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        level="page"
        className="mb-0"
        title="Panoramica"
        description={[o.companyName, updated ? `dati aggiornati al ${updated}` : null].filter(Boolean).join(' · ') || undefined}
        actions={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => exportSummary(data)}>
              <Download aria-hidden="true" />
              Esporta riepilogo
            </Button>
            <Button asChild size="sm">
              <Link to="/recruiting/job-profile">Nuova ricerca</Link>
            </Button>
          </>
        }
      />

      <section>
        <PageHeader title="Stato attuale" description="Le posizioni aperte della società." />
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
          empty={{ title: 'Nessuna azione aperta.', description: 'Le azioni compaiono quando ci sono CV da invitare al test, test da leggere o posizioni da riempire.' }}
        />
      </section>

      <section>
        <PageHeader title="In programma" description="I prossimi colloqui, per data." actions={<SeeMore to="/recruiting/colloqui">Vedi tutti i colloqui</SeeMore>} />
        <Card className="max-w-3xl">
          <UpcomingList upcoming={data.upcoming} emptyText="Nessun colloquio in programma. I colloqui si fissano dopo il test, da Prossimi colloqui." />
        </Card>
      </section>

      <section>
        <PageHeader title="Dove guardare" description="Due sintesi, ognuna con il link all'analisi completa." />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard
            title="Candidati per fascia di idoneità"
            description={`${data.rankedCount} candidati in classifica nelle posizioni aperte`}
            height="auto"
            empty={data.rankedCount ? undefined : { title: 'Nessun candidato delle posizioni aperte in classifica.', description: 'La classifica si forma quando i candidati completano il test soft skill. L’archivio CV è in Candidati per fascia, con «Archivio CV».' }}
            footer={<SeeMore to="/recruiting/fasce-idoneita">Apri Candidati per fascia</SeeMore>}
          >
            <QualityStackedBar buckets={data.buckets} total={data.rankedCount} />
          </ChartCard>
          <ChartCard title="Imbuto di selezione" description="Tutte le posizioni aperte, dal CV caricato alla scelta" height="auto" footer={<SeeMore to="/recruiting/imbuto-scelta?ambito=tutte">Apri l&apos;imbuto</SeeMore>}>
            <SelectionFunnel counts={data.funnelCounts} />
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

const csvEsc = (v: unknown) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`

// Il riepilogo in CSV che stava in "Stato dell'arte" ("Report completo"):
// stesso file, con le fasi della selezione per ogni posizione aperta.
function exportSummary(data: RecruitingHomeData): void {
  const o = data.overview
  const rows: [string, string | number][] = [
    ['Società', o.companyName],
    ['Posizioni aperte', o.openings],
    ['Candidati in selezione', o.inSelection],
    ['Idonei', o.suitable],
    ['Colloqui in programma', o.interviewsScheduled],
    ['Candidati da invitare al test', o.toInvite],
  ]
  let csv = '﻿' + rows.map((r) => r.map(csvEsc).join(';')).join('\r\n') + '\r\n\r\n' + ['Posizione', ...STAGES.map((s) => s.label)].map(csvEsc).join(';') + '\r\n'
  csv += data.positions.map((p) => [p.title, ...STAGES.map((s) => p.counts[s.key])].map(csvEsc).join(';')).join('\r\n')
  downloadText('report_recruiting.csv', csv, 'text/csv;charset=utf-8;')
}
