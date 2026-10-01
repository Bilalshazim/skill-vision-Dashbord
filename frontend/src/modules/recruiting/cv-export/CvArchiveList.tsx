import { Initials } from '@/components/ui/avatar'
import { FilterBar } from '@/components/patterns/FilterBar'
import { Card } from '@/components/ui/card'
import { Search } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/patterns/EmptyState'
import { CvMatchDialog } from '@/modules/recruiting/cv/CvMatchDialog'
import type { Candidate } from '@/modules/recruiting/lib/types'

// Migrated from renderUploadedCVs() (modules/recruiting.html ~4279-4301) —
// the "CV caricati" search list at the top of CV & Export.
//
// Legacy merges TWO sources: window.UPLOADED_CVS (raw file-selection
// metadata, badged "UPLOAD") and CANDIDATES (badged "CANDIDATO"). Re-verified
// this phase: `addUploadedCV()`, the ONLY function that ever pushes into
// UPLOADED_CVS, is never called anywhere in the current source (confirmed
// by a repo-wide search for its call sites) — so that array is always
// empty and the "UPLOAD" half of this list can never actually render in the
// deployed app. This list is therefore just CANDIDATES, searchable by name;
// the CANDIDATO/UPLOAD badge is omitted rather than reproduced as a badge
// that would always show the same value, which would be visual noise, not
// real parity.
//
// Row click: legacy calls showCand(id), a full-35-skill detail panel this
// migration has no equivalent for. Reuses CvMatchDialog instead (the
// established candidate-detail entry point already shared by Ranking and
// Pagina A) rather than building a second, more exhaustive detail view.
export function CvArchiveList({ candidates }: { candidates: Candidate[] }) {
  const [query, setQuery] = useState('')
  const q = query.toLowerCase().trim()
  const filtered = q ? candidates.filter((c) => c.name.toLowerCase().includes(q)) : candidates

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-app-body font-semibold">
          CV caricati <span className="ml-2 text-app-caption font-medium text-muted-foreground">({filtered.length} di {candidates.length})</span>
        </h3>
        <FilterBar search={{ value: query, onChange: setQuery, placeholder: 'Cerca per nome…' }} />
      </div>

      {!filtered.length ? (
        <EmptyState size="sm" icon={Search} description={`Nessun risultato per "${q}"`} />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-sm border border-border bg-secondary px-3 py-2">
              <Initials first={c.name.split(' ')[0] ?? ''} last={c.name.split(' ')[1] ?? ''} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-app-small font-semibold">{c.name}</div>
                <div className="text-app-caption text-muted-foreground">
                  {c.role || '—'} · ICV {c.icv ?? '—'}
                </div>
              </div>
              <CvMatchDialog candidate={c} />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
