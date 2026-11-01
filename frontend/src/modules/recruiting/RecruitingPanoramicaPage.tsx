import { ArrowRight, Download } from 'lucide-react'
import { type ReactNode, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { ActionList, type ActionItem } from '@/components/patterns/ActionList'
import { ChartCard } from '@/components/patterns/ChartCard'
import { CompletionRing } from '@/components/patterns/CompletionRing'
import { PageHeader } from '@/components/patterns/PageHeader'
import { StaggerList } from '@/components/patterns/StaggerList'
import { StatCard } from '@/components/patterns/StatCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { downloadText } from '@/lib/download'
import { IDONEITA } from '@/lib/idoneita'
import { QualityStackedBar } from '@/modules/recruiting/components/QualityStackedBar'
import { SelectionFunnel } from '@/modules/recruiting/components/SelectionFunnel'
import { UpcomingList } from '@/modules/recruiting/components/UpcomingList'
import { useActivePosition } from '@/modules/recruiting/lib/active-position'
import { STAGES } from '@/modules/recruiting/lib/position-funnel'
import { QUALITY_BANDS } from '@/modules/recruiting/lib/quality-bands'
import { recruitingPanoramica } from '@/modules/recruiting/lib/results'
import { readCandidates } from '@/modules/recruiting/lib/storage'
import { useRecruitingHomeData } from '@/modules/recruiting/lib/use-recruiting-home-data'

// La Panoramica di Recruiting (CLAUDE.md, Fase 6; colonna Recruiting rivista
// il 2026-10-30): seconda voce del menu, la vista operativa. Guarda la
// posizione attiva, con la scelta «Questa posizione / Tutte le posizioni
// aperte» nell'intestazione, come nell'Imbuto (?ambito=tutte, nell'indirizzo).
// Dall'alto: Stato attuale (CV ricevuti; CV in linea con il profilo e test
// completati su inviati con l'anello; colloqui in programma), Da fare adesso
// (ogni riga porta alla pagina dove si fa), In programma (i prossimi
// colloqui), Dove guardare (l'imbuto compatto e le fasce di idoneità, con il
// link alle loro pagine). Solo dati che l'applicazione ha già.
export default function RecruitingPanoramicaPage() {
  const [params, setParams] = useSearchParams()
  const all = params.get('ambito') === 'tutte'
  const { company, opening } = useActivePosition()
  const home = useRecruitingHomeData()
  const updated = home.overview.lastUpdate ? home.overview.lastUpdate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : null

  const scope = useMemo(() => {
    const open = new Set(home.positions.map((p) => p.openingId))
    const list = all ? (company?.jobOpenings ?? []).filter((o) => open.has(o.id)) : opening ? [opening] : []
    return list.map((o) => ({ title: o.title, opening: o }))
  }, [all, company, opening, home.positions])
  const d = useMemo(() => recruitingPanoramica(scope, readCandidates()), [scope])
  const buckets = QUALITY_BANDS.map((b, i) => ({ label: b.name, tone: IDONEITA[b.idoneita].tone, count: d.buckets[i].length }))

  function setScope(v: string) {
    const p = new URLSearchParams(params)
    if (v === 'tutte') p.set('ambito', 'tutte')
    else p.delete('ambito')
    setParams(p, { replace: true })
  }

  const t = d.todo
  const todo: ActionItem[] = [
    { key: 'evaluate', label: 'CV da valutare', description: 'Candidature acquisite, non ancora confrontate con il profilo', count: t.toEvaluate, unit: 'CV', to: '/recruiting/cv-elaborati', linkLabel: 'Apri' },
    { key: 'links', label: 'Link al test da inviare', description: 'Profili in valutazione che non hanno ancora ricevuto il link', count: t.linksToSend, unit: 'candidati', to: '/recruiting/preselezionati', linkLabel: 'Apri' },
    { key: 'tests', label: 'Test completati da leggere', description: 'Test completati, fuori dalla fascia «Idoneo» e senza colloquio', count: t.testsToRead, unit: 'candidati', to: '/recruiting/classifica-test', linkLabel: 'Apri' },
    { key: 'schedule', label: 'Colloqui da fissare', description: 'Candidati idonei senza un colloquio in programma', count: t.toSchedule, unit: 'candidati', to: '/recruiting/colloqui', linkLabel: 'Apri' },
  ]
  const where = all ? `Tutte le posizioni aperte di ${company?.name ?? '—'}` : `${opening?.title ?? 'Nessuna posizione aperta'} · ${company?.name ?? '—'}`

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        level="page"
        className="mb-0"
        title="Panoramica"
        description={[where, updated ? `dati aggiornati al ${updated}` : null].filter(Boolean).join(' · ')}
        actions={
          <>
            <ToggleGroup type="single" value={all ? 'tutte' : 'posizione'} onValueChange={(v) => v && setScope(v)} aria-label="Di quali posizioni">
              <ToggleGroupItem value="posizione">Questa posizione</ToggleGroupItem>
              <ToggleGroupItem value="tutte">Tutte le posizioni aperte</ToggleGroupItem>
            </ToggleGroup>
            <Button type="button" variant="ghost" size="sm" onClick={() => exportSummary(where, d, home.positions)}>
              <Download aria-hidden="true" />
              Esporta riepilogo
            </Button>
          </>
        }
      />

      <section>
        <PageHeader title="Stato attuale" />
        <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="CV ricevuti" value={d.received} unit="CV" />
          <StatCard label="CV in linea con il profilo" value={d.inLine} unit="CV" note={d.inLinePct == null ? 'Nessun CV ricevuto' : `${d.inLinePct}% dei CV ricevuti`}>
            <CompletionRing value={d.inLinePct ?? 0} label="CV in linea con il profilo" className="mx-0" />
          </StatCard>
          <StatCard label="Test completati" value={d.completed} unit={d.completed === 1 ? 'candidato' : 'candidati'} note={d.invited ? `su ${d.invited} inviati · ${d.completedPct}%` : 'Nessun test inviato'}>
            <CompletionRing value={d.completedPct ?? 0} label="Test completati su inviati" className="mx-0" />
          </StatCard>
          <StatCard label="Colloqui in programma" value={d.interviewsPlanned} />
        </StaggerList>
      </section>

      <section>
        <PageHeader title="Da fare adesso" description="Le azioni aperte, dalla più urgente." />
        <ActionList items={todo} empty={{ title: 'Nessuna azione aperta.', description: 'Le azioni compaiono quando arrivano CV da valutare, link da inviare, test da leggere o colloqui da fissare.' }} />
      </section>

      <section>
        <PageHeader title="In programma" description="I prossimi colloqui, per data." actions={<SeeMore to="/recruiting/colloqui">Vedi tutti i colloqui</SeeMore>} />
        <Card className="max-w-3xl">
          <UpcomingList upcoming={d.upcoming} emptyText="Nessun colloquio in programma. I colloqui si fissano dopo il test, da Prossimi colloqui." />
        </Card>
      </section>

      <section>
        <PageHeader title="Dove guardare" description="Due sintesi, ognuna con il link all'analisi completa." />
        <StaggerList className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="I cinque stati della candidatura" description="Quanti passano da uno stato al successivo" height="auto" footer={<SeeMore to={`/recruiting/imbuto-scelta${all ? '?ambito=tutte' : ''}`}>Apri l&apos;imbuto</SeeMore>}>
            <SelectionFunnel counts={d.counts} />
          </ChartCard>
          <ChartCard
            title="Candidati per fascia di idoneità"
            description={`${d.ranking.length} candidati in classifica`}
            height="auto"
            empty={d.ranking.length ? undefined : { title: 'Nessun candidato in classifica.', description: 'La classifica si forma quando i candidati completano il test.' }}
            footer={<SeeMore to="/recruiting/fasce-idoneita">Apri Candidati per fascia</SeeMore>}
          >
            <QualityStackedBar buckets={buckets} total={d.ranking.length} />
          </ChartCard>
        </StaggerList>
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

// Il riepilogo in CSV che stava in "Stato dell'arte" ("Report completo"): i
// numeri della scelta corrente e, sotto, gli stati per ogni posizione aperta.
function exportSummary(where: string, d: ReturnType<typeof recruitingPanoramica>, positions: { title: string; counts: Record<string, number> }[]): void {
  const rows: [string, string | number][] = [
    ['Ambito', where],
    ['CV ricevuti', d.received],
    ['CV in linea con il profilo', d.inLine],
    ['Test completati', d.completed],
    ['Colloqui in programma', d.interviewsPlanned],
    ['CV da valutare', d.todo.toEvaluate],
    ['Link al test da inviare', d.todo.linksToSend],
  ]
  let csv = '﻿' + rows.map((r) => r.map(csvEsc).join(';')).join('\r\n') + '\r\n\r\n' + ['Posizione', ...STAGES.map((s) => s.label)].map(csvEsc).join(';') + '\r\n'
  csv += positions.map((p) => [p.title, ...STAGES.map((s) => p.counts[s.key])].map(csvEsc).join(';')).join('\r\n')
  downloadText('report_recruiting.csv', csv, 'text/csv;charset=utf-8;')
}
