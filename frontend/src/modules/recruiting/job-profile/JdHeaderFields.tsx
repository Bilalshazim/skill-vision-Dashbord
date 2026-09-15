import { cn } from '@/lib/utils'
import type { JdHeader } from '@/modules/recruiting/lib/jd-types'
import { inputClass } from '@/modules/recruiting/job-profile/JdSection'

function Field({ label, value, onChange, full, mono }: { label: string; value: string; onChange: (v: string) => void; full?: boolean; mono?: boolean }) {
  return (
    <label className={cn('flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground', full && 'sm:col-span-2')}>
      {label}
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, 'normal-case tracking-normal', mono && 'font-mono')} />
    </label>
  )
}

// Migrated from jd_headerFieldsHTML() (modules/recruiting.html
// ~3929-3968). The "Titolo ruolo" field is plain here — legacy wires its
// oninput to jd_onRoleTitleChange(), which swaps the whole jdState if the
// typed text exactly matches another saved template's role name. That's
// the same role-search/switching mechanism this phase defers (Step 17), so
// it isn't reproduced — this field only ever edits header.titolo.
export function JdHeaderFields({ header, scopo, onHeaderChange, onScopoChange }: { header: JdHeader; scopo: string; onHeaderChange: (patch: Partial<JdHeader>) => void; onScopoChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Titolo ruolo" full value={header.titolo} onChange={(v) => onHeaderChange({ titolo: v })} />
        <Field label="Mansione specifica" value={header.mansione} onChange={(v) => onHeaderChange({ mansione: v })} />
        <Field label="Codice posizione" mono value={header.codice} onChange={(v) => onHeaderChange({ codice: v })} />
        <Field label="Area aziendale" value={header.area} onChange={(v) => onHeaderChange({ area: v })} />
        <Field label="Riporta a" value={header.riportaA} onChange={(v) => onHeaderChange({ riportaA: v })} />
        <Field label="Sede" value={header.sede} onChange={(v) => onHeaderChange({ sede: v })} />
        <Field label="Modalità di lavoro" value={header.modalita} onChange={(v) => onHeaderChange({ modalita: v })} />
        <Field label="Contratto" value={header.contratto} onChange={(v) => onHeaderChange({ contratto: v })} />
      </div>
      <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Scopo del ruolo
        <textarea
          value={scopo}
          onChange={(e) => onScopoChange(e.target.value)}
          rows={3}
          className={cn(inputClass, 'min-h-[64px] resize-y normal-case tracking-normal')}
        />
      </label>
    </div>
  )
}
