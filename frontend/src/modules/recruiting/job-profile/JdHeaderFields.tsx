import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { JdHeader } from '@/modules/recruiting/lib/jd-types'

// Migrated from jd_headerFieldsHTML() (modules/recruiting.html
// ~3929-3968). The "Titolo ruolo" field is plain here — legacy wires its
// oninput to jd_onRoleTitleChange(), which swaps the whole jdState if the
// typed text exactly matches another saved template's role name. That's
// the same role-search/switching mechanism this phase defers (Step 17), so
// it isn't reproduced — this field only ever edits header.titolo.
export function JdHeaderFields({ header, scopo, onHeaderChange, onScopoChange }: { header: JdHeader; scopo: string; onHeaderChange: (patch: Partial<JdHeader>) => void; onScopoChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="Titolo della posizione" className="sm:col-span-2">
          <Input type="text" value={header.titolo} onChange={(e) => onHeaderChange({ titolo: e.target.value })} />
        </Field>
        <Field label="Mansione specifica">
          <Input type="text" value={header.mansione} onChange={(e) => onHeaderChange({ mansione: e.target.value })} />
        </Field>
        <Field label="Codice posizione">
          <Input type="text" className="font-mono" value={header.codice} onChange={(e) => onHeaderChange({ codice: e.target.value })} />
        </Field>
        <Field label="Area aziendale">
          <Input type="text" value={header.area} onChange={(e) => onHeaderChange({ area: e.target.value })} />
        </Field>
        <Field label="Riporta a">
          <Input type="text" value={header.riportaA} onChange={(e) => onHeaderChange({ riportaA: e.target.value })} />
        </Field>
        <Field label="Sede">
          <Input type="text" value={header.sede} onChange={(e) => onHeaderChange({ sede: e.target.value })} />
        </Field>
        <Field label="Modalità di lavoro">
          <Input type="text" value={header.modalita} onChange={(e) => onHeaderChange({ modalita: e.target.value })} />
        </Field>
        <Field label="Contratto">
          <Input type="text" value={header.contratto} onChange={(e) => onHeaderChange({ contratto: e.target.value })} />
        </Field>
      </FieldGrid>
      <Field label="Scopo della posizione">
        <Textarea value={scopo} onChange={(e) => onScopoChange(e.target.value)} rows={3} />
      </Field>
    </div>
  )
}
