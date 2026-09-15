import { FileCheck2, MessageSquare, Search, Trophy, Workflow } from 'lucide-react'

import { EmptyState } from '@/modules/recruiting/components/EmptyState'
import type { PipelineOpeningCard } from '@/modules/recruiting/lib/use-pipeline-data'
import { cn } from '@/lib/utils'

// Migrated from renderPipelineDashboard() (modules/recruiting.html
// ~1983-2015) — one card per (company, opening), unfiltered (see
// use-pipeline-data.ts). Selecting a card only updates the Pipeline-local
// selection (PipelinePage's search params) — never activeContext, never
// localStorage, never a navigation away from /recruiting/pipeline.
export function PipelineDashboard({
  cards,
  selectedKey,
  onSelect,
}: {
  cards: PipelineOpeningCard[]
  selectedKey: string
  onSelect: (companyId: string, openingId: string) => void
}) {
  if (!cards.length) {
    return (
      <EmptyState
        icon={Workflow}
        text="Nessuna posizione aperta. Configura un job opening dalla pagina CV & Export (Routing & Isolation)."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const key = `${card.companyId}:${card.openingId}`
        const isSelected = key === selectedKey
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(card.companyId, card.openingId)}
            aria-pressed={isSelected}
            className={cn(
              'flex flex-col gap-2.5 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-ring',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[10.5px] uppercase tracking-wide text-muted-foreground">{card.companyName}</div>
                <div className="truncate text-[14px] font-semibold">{card.openingTitle}</div>
              </div>
              {card.won && (
                <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-semibold text-success">
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
            <div className="text-[11.5px] text-muted-foreground">{card.stageLabel}</div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
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
          </button>
        )
      })}
    </div>
  )
}
