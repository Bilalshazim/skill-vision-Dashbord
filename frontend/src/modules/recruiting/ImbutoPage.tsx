import { ArrowRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { ChartCard } from '@/components/patterns/ChartCard'
import { DataTable } from '@/components/patterns/DataTable'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { SelectionFunnel, shareOfPrevious } from '@/modules/recruiting/components/SelectionFunnel'
import { useActivePosition } from '@/modules/recruiting/lib/active-position'
import { biggestDrop, countStages, NEXT, positionStages, type StageCounts, STAGES, sumStages } from '@/modules/recruiting/lib/position-funnel'
import { readCandidates } from '@/modules/recruiting/lib/storage'
import { useRecruitingHomeData } from '@/modules/recruiting/lib/use-recruiting-home-data'

// L'imbuto di selezione (CLAUDE.md, Fase 6, verificato il 2026-10-23): una
// pagina sola, qui (/imbuto-scelta; /imbuto rimanda). Dall'alto: di quale
// posizione parla (la posizione attiva, o "Tutte le posizioni aperte" della
// società: mai l'archivio CV mescolato alle posizioni), il grafico a tutta
// riga con le fasi del menu e la quota sulla precedente, la frase che dice
// dove si fermano, la tabella per fase (persone, quote, quanti sono fermi lì,
// la pagina della fase). Con tutte le posizioni, sotto, una riga per
// posizione: è il riepilogo che stava in "Avanzamento della selezione".
export default function ImbutoPage() {
  const [params, setParams] = useSearchParams()
  const all = params.get('ambito') === 'tutte'
  const { company, opening } = useActivePosition()
  const data = useRecruitingHomeData()
  const byId = new Map(readCandidates().map((c) => [c.id, c]))

  const sets = !all && opening ? positionStages(opening, byId) : null
  const counts: StageCounts = sets ? countStages(sets) : all ? sumStages(data.positions.map((p) => p.counts)) : sumStages([])
  const drop = biggestDrop(counts)
  const hasFlow = counts.cv > 0 && STAGES.slice(1).some((s) => counts[s.key] > 0)

  function setScope(v: string) {
    const p = new URLSearchParams(params)
    if (v === 'tutte') p.set('ambito', 'tutte')
    else p.delete('ambito')
    setParams(p, { replace: true })
  }

  const rows = STAGES.map((s) => {
    const next = NEXT[s.key]
    return {
      key: s.key,
      label: s.label,
      count: counts[s.key],
      prev: shareOfPrevious(counts, s.key),
      total: counts.cv ? Math.round((counts[s.key] / counts.cv) * 100) : 0,
      stuck: next ? Math.max(0, counts[s.key] - counts[next]) : null,
      stuckLabel: s.stuck,
      to: s.to,
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        level="page"
        className="mb-0"
        title="Imbuto di selezione"
        description={all ? `Tutte le posizioni aperte di ${company?.name ?? '—'}` : `Posizione «${opening?.title ?? '—'}» · ${company?.name ?? '—'}`}
        actions={
          <ToggleGroup type="single" value={all ? 'tutte' : 'posizione'} onValueChange={(v) => v && setScope(v)} aria-label="Di quali posizioni">
            <ToggleGroupItem value="posizione">Questa posizione</ToggleGroupItem>
            <ToggleGroupItem value="tutte">Tutte le posizioni aperte</ToggleGroupItem>
          </ToggleGroup>
        }
      />

      <ChartCard title="Dal CV caricato alla scelta" description={drop ?? (hasFlow ? 'Nessun calo fra una fase e la successiva.' : undefined)} height="auto">
        <SelectionFunnel counts={counts} height="lg" />
      </ChartCard>

      {counts.cv ? (
        <section>
          <PageHeader title="Per fase" description="Quanti sono in ogni fase, quanti sono fermi lì e dove si lavora quella fase." />
          <DataTable
            rows={rows}
            getRowId={(r) => r.key}
            columns={[
              { key: 'fase', header: 'Fase', cell: (r) => r.label },
              { key: 'n', header: 'Persone', cell: (r) => <span className="font-mono tabular-nums">{r.count}</span> },
              { key: 'prev', header: '% sulla precedente', cell: (r) => <span className="font-mono tabular-nums">{r.prev == null ? '—' : `${r.prev}%`}</span> },
              { key: 'tot', header: '% sui CV caricati', cell: (r) => <span className="font-mono tabular-nums">{r.total}%</span> },
              { key: 'fermi', header: 'Fermi qui', cell: (r) => (r.stuck == null ? '—' : <span><span className="font-mono tabular-nums">{r.stuck}</span> {r.stuckLabel}</span>) },
              {
                key: 'apri',
                header: 'Pagina',
                cell: (r) => (
                  <Button asChild variant="ghost" size="sm">
                    <Link to={r.to}>
                      Apri <ArrowRight />
                    </Link>
                  </Button>
                ),
              },
            ]}
          />
        </section>
      ) : null}

      {all ? (
        <section>
          <PageHeader title="Per posizione" description="Le posizioni aperte della società, con i numeri di ogni fase." />
          {data.positions.length ? (
            <DataTable
              rows={data.positions}
              getRowId={(p) => p.openingId}
              columns={[
                { key: 'pos', header: 'Posizione', cell: (p) => p.title },
                ...STAGES.map((s) => ({ key: s.key, header: s.label, cell: (p: (typeof data.positions)[number]) => <span className="font-mono tabular-nums">{p.counts[s.key]}</span> })),
                {
                  key: 'apri',
                  header: 'Dettaglio',
                  cell: (p) => (
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/recruiting/pipeline?companyId=${encodeURIComponent(p.companyId)}&openingId=${encodeURIComponent(p.openingId)}`}>
                        Apri <ArrowRight />
                      </Link>
                    </Button>
                  ),
                },
              ]}
            />
          ) : (
            <Card>
              <p className="text-app-small text-muted-foreground">Nessuna posizione aperta per questa società. Le posizioni si aprono da CV & Esportazione.</p>
            </Card>
          )}
        </section>
      ) : null}
    </div>
  )
}
