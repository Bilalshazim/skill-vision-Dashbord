import { useState } from 'react'

import { SelectField } from '@/components/patterns/SelectField'
import { Badge } from '@/components/ui/badge'
import { AddRow } from '@/modules/recruiting/job-profile/JdSection'
import type { JdQcer, JdSectionTool } from '@/modules/recruiting/lib/jd-types'
import { QCER_DIMS, QCER_LANGUAGES, QCER_LEVELS, certificationFor, qcerOf, summaryLevel } from '@/modules/recruiting/lib/qcer'

// La sezione Lingue del Profilo candidato (Roberto, 2026-11-19): per ogni lingua il livello
// desiderato sul QCER in tre dimensioni — Comprensione, Parlato, Scritto — e, per le lingue che
// ne hanno una propria, la certificazione di riferimento. Sopra, i sei livelli con la loro
// definizione. Le lingue proposte che la scheda salvata non ha ancora compaiono lo stesso, e
// entrano nella scheda quando si sceglie un livello.
export function JdLanguages({ section, onChange }: { section: JdSectionTool; onChange: (next: JdSectionTool) => void }) {
  const [addValue, setAddValue] = useState('')
  const known = new Set(section.items.map((i) => i.label.trim().toLowerCase()))
  const rows = [
    ...section.items,
    ...QCER_LANGUAGES.filter((l) => !known.has(l.toLowerCase())).map((l) => ({ id: `qcer-${l}`, label: l, level: 'Non richiesto', virtual: true as const })),
  ]

  function setLevel(id: string, label: string, dim: keyof JdQcer, value: string) {
    const exists = section.items.some((i) => i.id === id)
    const base = exists ? section.items : [...section.items, { id: `x${Date.now()}`, label, level: 'Non richiesto' }]
    const targetId = exists ? id : base[base.length - 1].id
    onChange({
      ...section,
      items: base.map((i) => {
        if (i.id !== targetId) return i
        const qcer = { ...qcerOf(i), [dim]: value }
        return { ...i, qcer, level: summaryLevel(qcer) }
      }),
    })
  }

  function handleAdd() {
    const val = addValue.trim()
    if (!val || known.has(val.toLowerCase())) return setAddValue('')
    onChange({ ...section, items: [...section.items, { id: `x${Date.now()}`, label: val, level: 'Non richiesto', qcer: { comprensione: '', parlato: '', scritto: '' } }] })
    setAddValue('')
  }

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-sm border border-border p-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Livelli QCER">
        {QCER_LEVELS.map((l) => (
          <div key={l.code} className="flex min-w-0 flex-col">
            <dt className="text-app-small font-semibold text-foreground">
              <span className="font-mono">{l.code}</span> · {l.name}
            </dt>
            <dd className="text-app-caption text-muted-foreground">{l.desc}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col">
        <div className="hidden grid-cols-[minmax(0,1fr)_repeat(3,8rem)] gap-2 border-b border-border pb-2 md:grid">
          <span className="label-mono text-muted-foreground">Lingua</span>
          {QCER_DIMS.map((d) => (
            <span key={d.key} className="label-mono text-muted-foreground">
              {d.label}
            </span>
          ))}
        </div>
        {rows.map((it) => {
          const q = qcerOf(it)
          const cert = certificationFor(it.label)
          return (
            <div key={it.id} className="grid grid-cols-1 gap-2 border-b border-border py-2 last:border-0 md:grid-cols-[minmax(0,1fr)_repeat(3,8rem)] md:items-center">
              <span className="flex min-w-0 flex-wrap items-center gap-2 text-app-small text-foreground">
                {it.label}
                {cert ? <Badge title="Certificazione di riferimento">{cert}</Badge> : null}
              </span>
              <div className="grid grid-cols-3 gap-2 md:contents">
                {QCER_DIMS.map((d) => (
                  <label key={d.key} className="flex min-w-0 flex-col gap-1">
                    <span className="label-mono text-muted-foreground md:sr-only">{d.label}</span>
                    <SelectField value={q[d.key]} onValueChange={(v) => setLevel(it.id, it.label, d.key, v)} size="sm" aria-label={`${it.label} · ${d.label}`}>
                      <option value="">Non richiesto</option>
                      {QCER_LEVELS.map((l) => (
                        <option key={l.code} value={l.code}>
                          {`${l.code} · ${l.name}`}
                        </option>
                      ))}
                    </SelectField>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <AddRow value={addValue} onChange={setAddValue} onAdd={handleAdd} />
    </div>
  )
}
