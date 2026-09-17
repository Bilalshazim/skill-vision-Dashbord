import { Search } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { EmptyState } from '@/modules/recruiting/components/EmptyState'
import { CvMatchDialog } from '@/modules/recruiting/cv/CvMatchDialog'
import type { Candidate } from '@/modules/recruiting/lib/types'

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

function initialsOf(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase()
}

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
    <div className="rounded-xl border border-border bg-card shadow-sm p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold">
          CV caricati <span className="ml-2 text-[12px] font-medium text-muted-foreground">({filtered.length} di {candidates.length})</span>
        </h3>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per nome…"
            className={cn(inputClass, 'w-[220px] pl-8')}
          />
        </div>
      </div>

      {!filtered.length ? (
        <EmptyState icon={Search} text={`Nessun risultato per "${q}"`} />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-md border border-border bg-secondary px-3 py-2">
              <div className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
                {initialsOf(c.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">{c.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {c.role || '—'} · ICV {c.icv ?? '—'}
                </div>
              </div>
              <CvMatchDialog candidate={c} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
