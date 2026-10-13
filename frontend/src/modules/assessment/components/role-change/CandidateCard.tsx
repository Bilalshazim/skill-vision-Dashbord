import { ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardLabel, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { ReqStatusBadge } from '@/modules/assessment/components/role-change/ReqStatusBadge'
import type { getUI } from '@/modules/assessment/lib/legacy-utils'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'
import type { Candidate, Ease } from '@/modules/assessment/lib/role-change'

type UI = ReturnType<typeof getUI>

const EASE_TONE: Record<Ease, 'success' | 'warning' | 'strong'> = { alta: 'success', media: 'warning', bassa: 'strong' }
const STRENGTHS_SHOWN = 4
const GAPS_SHOWN = 4

/** Il testo della motivazione, uguale nella card e nel dettaglio. */
export function justification(c: Candidate, rank: number, ui: UI): string {
  return ui.rcJustify({
    name: `${c.emp.nome} ${c.emp.cognome}`,
    rank,
    compat: c.compat,
    strong: c.consistent.map((r) => r.name),
    limited: c.gaps.filter((g) => g.status === 'da-sviluppare').slice(0, 2).map((g) => g.name),
    missing: c.gaps.filter((g) => g.status !== 'da-sviluppare').slice(0, 2).map((g) => g.name),
  })
}

// Una delle tre soluzioni interne. Segue la logica del documento del
// cliente: chi (nome e ruolo attuale), perché (compatibilità, punti di forza,
// motivazione), cosa manca (gap e quanto sviluppo serve), quanto è facile
// (inserimento), con la valutazione già fatta. La prima ha il bordo lime:
// è la proposta. Tutta la card apre il dettaglio; da tastiera, il bottone.
export function CandidateCard({ candidate: c, rank, ui, onOpen }: { candidate: Candidate; rank: number; ui: UI; onOpen: () => void }) {
  const missing = c.gaps.filter((g) => g.status === 'mancante' || g.status === 'non-valutata').length
  return (
    <Card padding="lg" className={cn('h-full cursor-pointer gap-6', rank === 0 && 'border-2 border-primary')} onClick={onOpen}>
      <div className="flex flex-col gap-2">
        <CardHeader className="pb-0">
          <CardLabel>
            ({rank + 1}) {ui.rcRanks[rank]}
          </CardLabel>
        </CardHeader>
        <CardTitle>
          {c.emp.nome} {c.emp.cognome}
        </CardTitle>
        <CardDescription>{[c.emp.ruolo, c.emp.area, c.emp.livelloCcnl].filter(Boolean).join(' · ')}</CardDescription>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-metric-lg tabular-nums">{c.compat}%</span>
          <span className="label-mono text-muted-foreground">{ui.rcMatch}</span>
        </div>
        <Progress value={c.compat} tone={rank === 0 ? 'primary' : 'strong'} aria-label={`${ui.rcMatch} ${c.compat}%`} />
        <p className="text-app-caption text-muted-foreground tabular-nums">
          {[c.softPct != null ? `${ui.rcSoftPct} ${c.softPct}%` : null, c.hardPct != null ? `${ui.rcHardPct} ${c.hardPct}%` : null].filter(Boolean).join(' · ')}
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h4 className="label-mono text-muted-foreground">{ui.rcWhy}</h4>
        <p className="text-app-small text-card-foreground">{justification(c, rank, ui)}</p>
        {c.consistent.length ? (
          <div className="flex flex-col gap-1">
            <span className="text-app-caption text-muted-foreground">{ui.rcConsistent}</span>
            <p className="text-app-small font-medium">{ui.rcList(c.consistent.map((r) => r.name))}</p>
          </div>
        ) : null}
        {c.strengths.length ? (
          <div className="flex flex-col gap-1">
            <span className="text-app-caption text-muted-foreground">
              {ui.rcHas} ({c.strengths.length})
            </span>
            <p className="text-app-small text-muted-foreground">
              {c.strengths.slice(0, STRENGTHS_SHOWN).map((r) => r.name).join(', ')}
              {c.strengths.length > STRENGTHS_SHOWN ? `, ${ui.rcMore(c.strengths.length - STRENGTHS_SHOWN)}` : ''}
            </p>
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-2">
        <h4 className="label-mono text-muted-foreground">{ui.rcWhat}</h4>
        {c.gaps.length ? (
          <ul className="flex flex-col gap-2">
            {c.gaps.slice(0, GAPS_SHOWN).map((g) => (
              <li key={g.key} className="flex flex-col gap-1">
                <span className="text-app-small">{g.name}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <ReqStatusBadge status={g.status} label={ui.rcStatusLabel[g.status]} />
                  <span className="text-app-caption text-muted-foreground tabular-nums">{ui.rcGapPts(fmt1it(g.gap))}</span>
                </span>
              </li>
            ))}
            {c.gaps.length > GAPS_SHOWN ? <li className="text-app-caption text-muted-foreground">{ui.rcMore(c.gaps.length - GAPS_SHOWN)}</li> : null}
          </ul>
        ) : (
          <p className="text-app-small text-muted-foreground">{ui.rcNoGaps}</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h4 className="label-mono text-muted-foreground">{ui.rcHow}</h4>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={EASE_TONE[c.ease]}>{ui.rcEase[c.ease]}</Badge>
        </div>
        <p className="text-app-caption text-muted-foreground">{ui.rcEaseNote(fmt1it(c.devPoints), missing)}</p>
        <p className="text-app-caption text-muted-foreground">{ui.rcOverall(fmt1it(c.overall), c.tierLabel)}</p>
      </section>

      <CardAction className="mt-auto ml-0">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
        >
          {ui.rcOpen}
          <ArrowRight aria-hidden="true" />
        </Button>
      </CardAction>
    </Card>
  )
}
