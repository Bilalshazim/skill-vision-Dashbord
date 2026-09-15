import { useState } from 'react'

import { cn } from '@/lib/utils'
import { JD_LEVELS } from '@/modules/recruiting/lib/jd-presets'
import type { JdHardSkillGroup } from '@/modules/recruiting/lib/jd-types'
import { AddRow, CheckDot } from '@/modules/recruiting/job-profile/JdSection'

// Migrated from the "Hard skills" group in jd_buildEditor() plus
// hardRowHTML()/addCustomHard()/toggleCheckHard()/setLevelHard() (modules/
// recruiting.html ~4063-4067, ~4100-4108, ~4126-4127, ~4139-4145) — a
// distinct 2-level structure (groups of items, each with its own checked +
// level) from the generic JdSection, so it gets its own component rather
// than being forced into that one's shape.
export function JdHardSkills({ groups, onChange }: { groups: JdHardSkillGroup[]; onChange: (next: JdHardSkillGroup[]) => void }) {
  function updateGroup(key: string, next: JdHardSkillGroup) {
    onChange(groups.map((g) => (g.key === key ? next : g)))
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <HardSkillGroupRow key={g.key} group={g} onChange={(next) => updateGroup(g.key, next)} />
      ))}
    </div>
  )
}

function HardSkillGroupRow({ group, onChange }: { group: JdHardSkillGroup; onChange: (next: JdHardSkillGroup) => void }) {
  const [addValue, setAddValue] = useState('')

  function handleAdd() {
    const label = addValue.trim()
    if (!label) return
    onChange({ ...group, items: [...group.items, { id: `x${Date.now()}`, label, checked: true, level: 'Intermedio' }] })
    setAddValue('')
  }

  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</div>
      <div className="flex flex-col gap-2">
        {group.items.map((it) => (
          <div key={it.id} className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckDot checked={it.checked} onClick={() => onChange({ ...group, items: group.items.map((x) => (x.id === it.id ? { ...x, checked: !x.checked } : x)) })} />
              <span className={cn('text-[13.5px]', it.checked ? 'text-foreground' : 'text-muted-foreground')}>{it.label}</span>
            </div>
            <div className="flex gap-1">
              {JD_LEVELS.map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => onChange({ ...group, items: group.items.map((x) => (x.id === it.id ? { ...x, level: lv, checked: true } : x)) })}
                  className={cn(
                    'rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase',
                    it.level === lv ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground',
                  )}
                >
                  {lv.slice(0, 4)}
                </button>
              ))}
            </div>
          </div>
        ))}
        <AddRow value={addValue} onChange={setAddValue} onAdd={handleAdd} />
      </div>
    </div>
  )
}
