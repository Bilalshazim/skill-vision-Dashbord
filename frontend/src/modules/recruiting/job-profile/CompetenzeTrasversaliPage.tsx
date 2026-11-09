import { RotateCcw } from 'lucide-react'
import { useState } from 'react'

import { Field } from '@/components/patterns/Field'
import { PageHeader } from '@/components/patterns/PageHeader'
import { SelectField } from '@/components/patterns/SelectField'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useConfirm } from '@/hooks/use-confirm'
import { useActivePosition } from '@/modules/recruiting/lib/active-position'
import { SKILL_MATRIX, W } from '@/modules/recruiting/lib/constants'
import { resetSkillFlags, setSkillExpected, setSkillLevel, useSkillExpected, useSkillFlags } from '@/modules/recruiting/lib/skill-flags'
import type { SoftSkillLevel } from '@/modules/recruiting/lib/types'

const LEVELS: SoftSkillLevel[] = [3, 2, 1]

// «Competenze trasversali» (livello 1, Decisioni del 2026-11-06): le 35 soft skill, per la
// posizione attiva. Si scelgono quelle del profilo, con il peso, e per ognuna il valore atteso
// da 1 a 10. È l'unico posto dove si scelgono. Senza un valore si usa la soglia del peso,
// scritta nel campo come suggerimento. Ogni modifica si salva da sola.
export default function CompetenzeTrasversaliPage() {
  const { opening } = useActivePosition()
  const flags = useSkillFlags()
  const expected = useSkillExpected()
  const [confirm, confirmDialog] = useConfirm()
  const count = (lv: SoftSkillLevel) => Object.values(flags).filter((v) => v === lv).length
  const total = Object.keys(flags).length

  async function reset() {
    if (await confirm({ title: 'Togliere tutte le competenze?', description: `Le scelte per «${opening?.title}» si cancellano. Le altre posizioni non cambiano.`, confirmLabel: 'Togli tutte', cancelLabel: 'Annulla', destructive: true })) resetSkillFlags()
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        level="page"
        className="mb-0"
        title="Competenze trasversali"
        description="Scegli le competenze del profilo e, per ognuna, il valore atteso da 1,0 a 10,0. Classifiche e punteggi di questa posizione si aggiornano da soli."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void reset()} disabled={!total}>
            <RotateCcw aria-hidden="true" />
            Togli tutte
          </Button>
        }
      />
      <p className="text-app-body text-foreground" aria-live="polite">
        <b className="font-semibold">{total}</b> scelte su 35: {count(3)} essenziali, {count(2)} importanti, {count(1)} utili. Da scegliere almeno 6 essenziali, 4 importanti e 2 utili.
      </p>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {SKILL_MATRIX.map((group) => (
          <Card key={group.label} className="gap-3">
            <h2 className="text-app-section text-foreground">{group.full.charAt(0) + group.full.slice(1).toLowerCase()}</h2>
            <ul className="flex flex-col">
              {group.items.map((skill) => {
                const level = flags[skill]
                return (
                  <li key={skill} data-slot="skill-row" className="flex flex-wrap items-end gap-3 border-b border-border py-3 last:border-b-0">
                    <span className="min-w-40 flex-1 self-center text-app-body text-foreground">{skill}</span>
                    <Field label="Peso" className="mb-0! w-36">
                      <SelectField size="sm" className="w-full" value={String(level ?? 0)} onValueChange={(v) => setSkillLevel(skill, Number(v) as SoftSkillLevel | 0)} aria-label={`Peso: ${skill}`}>
                        <option value="0">Non richiesta</option>
                        {LEVELS.map((lv) => (
                          <option key={lv} value={lv}>
                            {W[lv].label}
                          </option>
                        ))}
                      </SelectField>
                    </Field>
                    <ExpectedField key={`${skill}-${expected[skill] ?? ''}`} skill={skill} disabled={!level} value={expected[skill]} placeholder={level ? fmt1(Math.round(W[level].t / 3.1)) : '—'} />
                  </li>
                )
              })}
            </ul>
          </Card>
        ))}
      </div>
      {confirmDialog}
    </div>
  )
}

/** Un decimale con la virgola, da 1,0 a 10,0 (Decisioni del 2026-11-09). */
const fmt1 = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// Il valore atteso si scrive con la virgola o con il punto; si salva all'uscita dal campo
// (o con Invio), arrotondato a un decimale fra 1,0 e 10,0, e si rilegge con la virgola.
function ExpectedField({ skill, value, disabled, placeholder }: { skill: string; value: number | undefined; disabled: boolean; placeholder: string }) {
  // Il campo si rimonta quando il valore salvato cambia (la chiave lo contiene): niente effetto.
  const [draft, setDraft] = useState(value == null ? '' : fmt1(value))
  function commit() {
    const text = draft.trim().replace(',', '.')
    if (text === '') return setSkillExpected(skill, null)
    const n = Number(text)
    if (!Number.isFinite(n)) return setDraft(value == null ? '' : fmt1(value))
    const v = Math.round(Math.min(10, Math.max(1, n)) * 10) / 10
    setSkillExpected(skill, v)
    setDraft(fmt1(v))
  }
  return (
    <Field label="Atteso" className="mb-0! w-20">
      <Input
        type="text"
        inputMode="decimal"
        size="sm"
        disabled={disabled}
        aria-label={`Valore atteso, da 1,0 a 10,0: ${skill}`}
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
        }}
      />
    </Field>
  )
}
