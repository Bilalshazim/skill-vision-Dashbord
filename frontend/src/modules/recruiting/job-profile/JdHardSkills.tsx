import { useState } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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
      <div className="label-mono mb-2 text-muted-foreground">{group.label}</div>
      <div className="flex flex-col gap-2">
        {group.items.map((it) => (
          <div key={it.id} className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckDot checked={it.checked} label={it.label} onClick={() => onChange({ ...group, items: group.items.map((x) => (x.id === it.id ? { ...x, checked: !x.checked } : x)) })} />
              <span className={cn('text-app-small', it.checked ? 'text-foreground' : 'text-muted-foreground')}>{it.label}</span>
            </div>
            <ToggleGroup
              type="single"
              value={it.level}
              onValueChange={(lv) => lv && onChange({ ...group, items: group.items.map((x) => (x.id === it.id ? { ...x, level: lv, checked: true } : x)) })}
              aria-label={`Livello richiesto per ${it.label}`}
            >
              {JD_LEVELS.map((lv) => (
                <ToggleGroupItem key={lv} value={lv} aria-label={lv} className="label-mono">
                  {lv.slice(0, 4)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        ))}
        <AddRow value={addValue} onChange={setAddValue} onAdd={handleAdd} />
      </div>
    </div>
  )
}
