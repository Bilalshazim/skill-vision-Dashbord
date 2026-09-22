import { Plus } from 'lucide-react'
import { useState } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { JD_LEVELS } from '@/modules/recruiting/lib/jd-presets'
import type { JdSection as JdSectionData } from '@/modules/recruiting/lib/jd-types'

export const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
// See admin/CipAdminPage.tsx's identical comment.
const addBtnClass = buttonVariants({ size: 'icon' })

const WEIGHT_LABEL: Record<number, string> = { 3: 'ESSENZIALE', 2: 'IMPORTANTE', 1: 'UTILE' }
const WEIGHT_CLASS: Record<number, string> = { 3: 'bg-primary/12 text-primary', 2: 'bg-warning/14 text-warning', 1: 'bg-success/14 text-success' }

export function CheckDot({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={cn('mt-0.5 size-4 shrink-0 rounded-[3px] border', checked ? 'border-primary bg-primary' : 'border-border bg-background')}
    >
      {checked && <span className="block text-[10px] leading-4 text-primary-foreground">✓</span>}
    </button>
  )
}

// Migrated from jd_renderSectionBody()/jd_checkRowHTML()/jd_valueRowHTML()/
// toolRowHTML()/addRowHTML() (modules/recruiting.html ~3970-4033,
// ~4129-4138) — one reusable renderer for the 4 section "kinds" JD uses for
// its 13 check/value/tool/radio sections (hard skills and extra rows are
// distinct-enough structures with their own components). Purely a JdState
// mutator via `onChange` — never touches localStorage itself.
export function JdSection({ section, onChange }: { section: JdSectionData; onChange: (next: JdSectionData) => void }) {
  const [addValue, setAddValue] = useState('')

  function handleAdd() {
    const val = addValue.trim()
    if (!val) return
    if (section.kind === 'check') {
      onChange({ ...section, items: [...section.items, { id: `x${Date.now()}`, label: val, checked: true }] })
    } else if (section.kind === 'value') {
      onChange({ ...section, items: [...section.items, { id: `x${Date.now()}`, label: val, checked: true, valoreAtteso: null, weight: 0 }] })
    } else if (section.kind === 'tool') {
      const level = section.levels ? section.levels[1] : 'Base'
      onChange({ ...section, items: [...section.items, { id: `x${Date.now()}`, label: val, level }] })
    }
    setAddValue('')
  }

  if (section.kind === 'check') {
    return (
      <div className="flex flex-col gap-2">
        {section.items.map((it) => (
          <div key={it.id} className="flex items-start gap-2">
            <CheckDot checked={it.checked} onClick={() => onChange({ ...section, items: section.items.map((x) => (x.id === it.id ? { ...x, checked: !x.checked } : x)) })} />
            <button
              type="button"
              onClick={() => onChange({ ...section, items: section.items.map((x) => (x.id === it.id ? { ...x, checked: !x.checked } : x)) })}
              className={cn('text-left text-[13.5px]', it.checked ? 'text-foreground' : 'text-muted-foreground')}
            >
              {it.label}
            </button>
          </div>
        ))}
        <AddRow value={addValue} onChange={setAddValue} onAdd={handleAdd} />
      </div>
    )
  }

  if (section.kind === 'value') {
    return (
      <div className="flex flex-col gap-2.5">
        {section.items.map((it) => (
          <div key={it.id} className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <CheckDot checked={it.checked} onClick={() => onChange({ ...section, items: section.items.map((x) => (x.id === it.id ? { ...x, checked: !x.checked } : x)) })} />
              <span className={cn('text-[13.5px]', it.checked ? 'text-foreground' : 'text-muted-foreground')}>
                {it.label}
                {it.weight > 0 && <span className={cn('ml-2 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide', WEIGHT_CLASS[it.weight])}>{WEIGHT_LABEL[it.weight]}</span>}
              </span>
            </div>
            <label className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Valore atteso
              <input
                type="number"
                step="0.1"
                min="0"
                max="31"
                placeholder="es. 6.3"
                value={it.valoreAtteso ?? ''}
                onChange={(e) => {
                  const n = parseFloat(e.target.value)
                  const valoreAtteso = Number.isNaN(n) ? null : n
                  onChange({ ...section, items: section.items.map((x) => (x.id === it.id ? { ...x, valoreAtteso, checked: valoreAtteso != null ? true : x.checked } : x)) })
                }}
                className={cn(inputClass, 'w-[64px] text-right font-mono')}
              />
            </label>
          </div>
        ))}
        <AddRow value={addValue} onChange={setAddValue} onAdd={handleAdd} />
      </div>
    )
  }

  if (section.kind === 'tool') {
    const levels = section.levels || ['Non richiesto', ...JD_LEVELS]
    return (
      <div className="flex flex-col gap-2">
        {section.items.map((it) => (
          <div key={it.id} className="flex items-center justify-between gap-2">
            <span className="text-[13.5px] text-foreground">{it.label}</span>
            <select
              value={it.level}
              onChange={(e) => onChange({ ...section, items: section.items.map((x) => (x.id === it.id ? { ...x, level: e.target.value } : x)) })}
              className={cn(inputClass, 'w-[150px]')}
            >
              {levels.map((lv) => (
                <option key={lv} value={lv}>
                  {lv}
                </option>
              ))}
            </select>
          </div>
        ))}
        <AddRow value={addValue} onChange={setAddValue} onAdd={handleAdd} />
      </div>
    )
  }

  // radio — no add-row in legacy either
  return (
    <div className="flex flex-wrap gap-2">
      {section.items.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange({ ...section, selected: section.selected === l ? null : l })}
          className={cn(
            'rounded-md border px-3.5 py-2 text-[12.5px] font-medium transition-colors',
            section.selected === l ? 'border-primary bg-primary/10 font-semibold text-foreground' : 'border-border text-muted-foreground hover:border-ring',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

export function AddRow({ value, onChange, onAdd }: { value: string; onChange: (v: string) => void; onAdd: () => void }) {
  return (
    <div className="mt-1 flex items-center gap-2 border-t border-dashed border-border pt-2.5">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onAdd()
        }}
        placeholder="Aggiungi voce…"
        className={cn(inputClass, 'flex-1')}
      />
      <button type="button" onClick={onAdd} className={addBtnClass} aria-label="Aggiungi voce">
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
