import { useState } from 'react'

import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { SelectField } from '@/components/patterns/SelectField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { JD_PROFILES, type JdPresetId } from '@/modules/recruiting/lib/jd-presets'
import type { JdHeader } from '@/modules/recruiting/lib/jd-types'

const OTHER = 'altro'
const PRESET_IDS = Object.keys(JD_PROFILES) as JdPresetId[]

// Migrated from jd_headerFieldsHTML() (modules/recruiting.html
// ~3929-3968). The "Titolo ruolo" field is plain here — legacy wires its
// oninput to jd_onRoleTitleChange(), which swaps the whole jdState if the
// typed text exactly matches another saved template's role name. That's
// the same role-search/switching mechanism this phase defers (Step 17), so
// it isn't reproduced — this field only ever edits header.titolo.
//
// Fase 4 (Roberto Feliciani): il titolo è di nuovo una tendina con l'elenco
// delle posizioni e, sempre per ultima, "Altro" (titolo libero). Scegliere una
// posizione carica il profilo di partenza corrispondente (era la funzione dei
// chip "Profilo di partenza", tolti dalla pagina); `onSelectPreset` chiede la
// conferma, perché sovrascrive la scheda.
export function JdHeaderFields({
  header,
  scopo,
  onHeaderChange,
  onScopoChange,
  onSelectPreset,
  invioCvError,
}: {
  header: JdHeader
  scopo: string
  onHeaderChange: (patch: Partial<JdHeader>) => void
  onScopoChange: (v: string) => void
  onSelectPreset: (id: JdPresetId) => void
  invioCvError?: string
}) {
  const matched = PRESET_IDS.find((id) => JD_PROFILES[id].header.titolo === header.titolo)
  const [otherPicked, setOtherPicked] = useState(false)
  const isOther = otherPicked || !matched
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="Titolo della posizione" className="sm:col-span-2">
          <div className="flex flex-col gap-2">
            <SelectField
              value={isOther ? OTHER : (matched as string)}
              onValueChange={(v) => {
                if (v === OTHER) {
                  setOtherPicked(true)
                  return
                }
                setOtherPicked(false)
                if (v !== matched) onSelectPreset(v as JdPresetId)
              }}
              aria-label="Titolo della posizione"
            >
              {PRESET_IDS.map((id) => (
                <option key={id} value={id}>
                  {JD_PROFILES[id].header.titolo}
                </option>
              ))}
              <option value={OTHER}>Altro</option>
            </SelectField>
            {isOther ? <Input type="text" value={header.titolo} onChange={(e) => onHeaderChange({ titolo: e.target.value })} placeholder="Scrivi il titolo della posizione" aria-label="Altro titolo" /> : null}
          </div>
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
      <Field
        label="Come inviare il CV"
        required
        hint="Dove e in che modo i candidati inviano o caricano il CV: l'indirizzo email di destinazione o il link al modulo di caricamento."
        error={invioCvError}
      >
        <Textarea value={header.invioCv ?? ''} onChange={(e) => onHeaderChange({ invioCv: e.target.value })} rows={2} placeholder="es. Invia il CV a selezione@azienda.it indicando il codice posizione nell'oggetto" />
      </Field>
      <Field label="Scopo della posizione">
        <Textarea value={scopo} onChange={(e) => onScopoChange(e.target.value)} rows={3} />
      </Field>
    </div>
  )
}
