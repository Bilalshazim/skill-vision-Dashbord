import { Plus, X } from 'lucide-react'

import { SelectField } from '@/components/patterns/SelectField'
import { Input } from '@/components/ui/input'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { JD_LEVELS } from '@/modules/recruiting/lib/jd-presets'
import type { JdExtraRow } from '@/modules/recruiting/lib/jd-types'

// See admin/CipAdminPage.tsx's identical comment — the dashed border/center
// justify is this "add a free row" affordance's own distinguishing touch,
// layered on top of the shared outline variant rather than duplicated whole.
const ghostBtnClass = cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'justify-center border-dashed')

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
          <Input type="text" value={r.label} onChange={(e) => update(r.id, 'label', e.target.value)} placeholder="Nome competenza / requisito" size="sm" />
          <SelectField value={r.level} onValueChange={(v) => update(r.id, 'level', v)} size="sm">
            {JD_LEVELS.map((lv) => (
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </SelectField>
          <Input type="text" value={r.note} onChange={(e) => update(r.id, 'note', e.target.value)} placeholder="Nota (opzionale)" size="sm" />
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(r.id)} aria-label="Rimuovi riga">
            <X aria-hidden="true" />
          </Button>
        </div>
      ))}
      <button type="button" onClick={addRow} className={cn(ghostBtnClass, 'mt-1')}>
        <Plus className="size-3.5 shrink-0" aria-hidden="true" />
        Aggiungi riga libera
      </button>
    </div>
  )
}
