import { Plus, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { JD_LEVELS } from '@/modules/recruiting/lib/jd-presets'
import type { JdExtraRow } from '@/modules/recruiting/lib/jd-types'
import { inputClass } from '@/modules/recruiting/job-profile/JdSection'

const ghostBtnClass =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-border px-3 py-2 text-[12px] font-bold text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

// Migrated from extraSectionHTML()/updateExtra()/addExtraRow()/removeExtra()
// (modules/recruiting.html ~4035-4046, ~4147-4149) — always starts seeded
// with exactly 4 blank rows (see lib/jd.ts buildJdStateFromPreset()), but
// rows can be freely added/removed afterward, same as legacy.
export function JdExtraRequirements({ rows, onChange }: { rows: JdExtraRow[]; onChange: (next: JdExtraRow[]) => void }) {
  function update(id: string, field: keyof JdExtraRow, value: string) {
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }
  function remove(id: string) {
    onChange(rows.filter((r) => r.id !== id))
  }
  function addRow() {
    onChange([...rows, { id: `x${Date.now()}`, label: '', level: 'Base', note: '' }])
  }

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-1 gap-2 border-t border-border pt-2.5 first:border-0 first:pt-0 sm:grid-cols-[1fr_140px_1fr_auto] sm:items-center">
          <input type="text" value={r.label} onChange={(e) => update(r.id, 'label', e.target.value)} placeholder="Nome competenza / requisito" className={inputClass} />
          <select value={r.level} onChange={(e) => update(r.id, 'level', e.target.value)} className={inputClass}>
            {JD_LEVELS.map((lv) => (
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </select>
          <input type="text" value={r.note} onChange={(e) => update(r.id, 'note', e.target.value)} placeholder="Nota (opzionale)" className={inputClass} />
          <button type="button" onClick={() => remove(r.id)} aria-label="Rimuovi riga" className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
      <button type="button" onClick={addRow} className={cn(ghostBtnClass, 'mt-1')}>
        <Plus className="size-3.5 shrink-0" aria-hidden="true" />
        Aggiungi riga libera
      </button>
    </div>
  )
}
