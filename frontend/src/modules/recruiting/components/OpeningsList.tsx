import { Briefcase } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/patterns/EmptyState'
import type { OpeningRow } from '@/modules/recruiting/lib/use-recruiting-home-data'

// PHASE 11B: now that /recruiting/pipeline exists, rows link straight to
// that opening's Pipeline detail — legacy's own row click does the
// equivalent (selectPipelineOpening(company.id, opening.id) + go('pipeline'),
// modules/recruiting.html ~2614). Previously (Phase 4-11A) these were
// intentionally non-clickable, documented as a known limitation since no
// React Pipeline route existed yet to land on; PipelinePage.tsx reads these
// same ?companyId&openingId params to seed its own Pipeline-local selection
// — this never touches global activeContext.
export function OpeningsList({ openings }: { openings: OpeningRow[] }) {
  if (!openings.length) {
    return (
      <EmptyState
        size="sm"
        icon={Briefcase}
        description="Nessuna posizione aperta. Aprine una dalla pagina CV & Esportazione (Posizione e archivio)."
      />
    )
  }

  return (
    <div>
      {openings.map((o) => (
        <Link
          key={o.key}
          to={`/recruiting/pipeline?companyId=${encodeURIComponent(o.companyId)}&openingId=${encodeURIComponent(o.openingId)}`}
          className="flex items-center justify-between gap-4 rounded-sm border-b border-border py-3 transition-colors last:border-0 hover:bg-accent/50 sm:flex-row flex-col sm:items-center items-start"
        >
          <div>
            <div className="label-mono text-muted-foreground">{o.companyName}</div>
            <div className="mt-0.5 text-app-small font-semibold">{o.openingTitle}</div>
          </div>
          <div className="flex w-full flex-col items-start gap-1.5 sm:w-auto sm:min-w-32 sm:items-end">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary sm:w-28">
              <div
                className={o.won ? 'h-full rounded-full bg-success' : 'h-full rounded-full bg-primary'}
                style={{ width: `${o.stagePct}%` }}
              />
            </div>
            <div className="text-app-caption text-muted-foreground">{o.stageLabel}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}
