import { FileCheck2, MessageSquare, Search, Trophy, Workflow } from 'lucide-react'

import { EmptyState } from '@/components/patterns/EmptyState'
import { StaggerItem } from '@/components/patterns/StaggerItem'
import { StaggerList } from '@/components/patterns/StaggerList'
import type { PipelineOpeningCard } from '@/modules/recruiting/lib/use-pipeline-data'
import { cn } from '@/lib/utils'

// Migrated from renderPipelineDashboard() (modules/recruiting.html
// ~1983-2015) — one card per (company, opening), unfiltered (see
// use-pipeline-data.ts). Le card sono un quadro di sola lettura: la posizione
// attiva è segnata e scritta, e si cambia solo nel Profilo della ricerca
// (CLAUDE.md, Fase 6; DECISIONI "Posizione attiva: si cambia solo nel
// Profilo della ricerca"). Prima un clic su una card cambiava la posizione
// attiva di tutta l'applicazione.
export function PipelineDashboard({ cards, selectedKey }: { cards: PipelineOpeningCard[]; selectedKey: string }) {
  if (!cards.length) {
    return (
      <EmptyState
        size="sm"
        icon={Workflow}
        description="Nessuna posizione aperta. Aprine una dalla pagina CV & Esportazione (Posizione e archivio)."
      />
    )
  }

  return (
    <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const key = `${card.companyId}:${card.openingId}`
        const isSelected = key === selectedKey
        return (
          <StaggerItem key={key}>
          <div
            aria-current={isSelected ? 'true' : undefined}
            className={cn('flex h-full w-full flex-col gap-2.5 rounded-lg border bg-card p-4 text-left', isSelected ? 'border-primary ring-1 ring-primary' : 'border-border')}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="label-mono truncate text-muted-foreground">
                  {card.companyName}
                  {isSelected ? ' · Posizione attiva' : ''}
                </div>
                <div className="truncate text-app-small font-semibold">{card.openingTitle}</div>
              </div>
              {card.won && (
                <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-success/12 px-2 py-0.5 text-app-caption font-semibold text-success">
                  <Trophy className="size-3 shrink-0" aria-hidden="true" />
                  CHIUSA
                </span>
              )}
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={card.won ? 'h-full rounded-full bg-success' : 'h-full rounded-full bg-primary'}
                style={{ width: `${card.stagePct}%` }}
              />
            </div>
            <div className="text-app-caption text-muted-foreground">{card.stageLabel}</div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-app-caption text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Search className="size-3" aria-hidden="true" />
                {card.prescreenedCount} prescreened
              </span>
              <span className="inline-flex items-center gap-1">
                <FileCheck2 className="size-3" aria-hidden="true" />
                {card.testResultsCount} testati
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="size-3" aria-hidden="true" />
                {card.interviewsCount} colloqui
              </span>
            </div>
          </div>
          </StaggerItem>
        )
      })}
    </StaggerList>
  )
}
