import { cn } from '@/lib/utils'
import type { Candidate } from '@/modules/recruiting/lib/types'

const selectClass =
  'w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

// Migrated from _buildMatchSlots()/_pickMatchSlot()/_renderSlotPreview()
// (modules/recruiting.html ~4911-4951) — one dropdown + small preview per
// comparison slot. `slotKey` mirrors legacy's `${type}_${idx}` selection key.
export function MatchSlotPicker({
  label,
  slotKey,
  pool,
  selectedId,
  onSelect,
  filled,
}: {
  label: string
  slotKey: string
  pool: Candidate[]
  selectedId: string
  onSelect: (id: string) => void
  filled: 'cand' | 'it'
}) {
  const picked = pool.find((c) => c.id === selectedId)
  const topScores = picked
    ? Object.entries(picked.scores || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
    : []

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-md border border-border bg-card p-3 transition-colors',
        selectedId && (filled === 'it' ? 'border-warning/40 bg-warning/5' : 'border-primary/40 bg-primary/5'),
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <select id={`match-slot-${slotKey}`} value={selectedId} onChange={(e) => onSelect(e.target.value)} className={selectClass}>
        <option value="">— seleziona —</option>
        {pool.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.role ? ` — ${c.role}` : ''}
          </option>
        ))}
      </select>
      {picked && (
        <div className="text-[11.5px]">
          <div className="font-semibold text-foreground">{picked.name}</div>
          <div className="text-muted-foreground">
            {picked.role || '—'}
            {picked.isInternalTalent && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">INT</span>
            )}
          </div>
          {topScores.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {topScores.map(([n, v]) => (
                <span key={n} className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                  {n} {v.toFixed(1)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
