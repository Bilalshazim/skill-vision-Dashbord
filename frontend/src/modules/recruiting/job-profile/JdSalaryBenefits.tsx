import { useState } from 'react'

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { SALARY_LEVELS, WELFARE_ITEMS } from '@/modules/recruiting/lib/jd-presets'
import { clearSalaryBenefits, loadSalaryBenefits, saveSalaryBenefits } from '@/modules/recruiting/lib/jd'
import type { SalaryLevelRecord } from '@/modules/recruiting/lib/jd-types'

const EMPTY_LEVEL: SalaryLevelRecord = { min: '', max: '', variableChoice: '', variablePct: '' }
// See admin/CipAdminPage.tsx's identical comment.
const primaryBtnClass = buttonVariants({ size: 'sm' })
const dangerBtnClass = buttonVariants({ variant: 'destructive', size: 'sm' })

// Migrated from the Salary & Benefits sub-feature (modules/recruiting.html
// ~4407-4478) — a SEPARATE storage model (apex5d_salary_benefits) from the
// JD template itself, keyed the same way (by role) but saved/cleared
// independently via its own two buttons, not the main "Salva JD" action.
// Owns its own local edit state; only touches apex5d_salary_benefits.
export function JdSalaryBenefits({ role }: { role: string }) {
  // Lazy initializers, not an effect: `role` is a stable prop in this
  // migration (no role-switcher exists to ever change it mid-lifetime), so
  // there is no later point at which this should re-fetch — reading once,
  // synchronously, on first render avoids an extra render pass for a value
  // that can never change underneath this component.
  const [salary, setSalary] = useState<Record<string, SalaryLevelRecord>>(() => loadSalaryBenefits(role)?.salary || {})
  const [welfare, setWelfare] = useState<Record<string, boolean | string>>(() => loadSalaryBenefits(role)?.welfare || {})
  const [savedAt, setSavedAt] = useState<number | null>(() => loadSalaryBenefits(role)?.savedAt ?? null)

  function levelOf(key: string): SalaryLevelRecord {
    return salary[key] || EMPTY_LEVEL
  }
  function updateLevel(key: string, patch: Partial<SalaryLevelRecord>) {
    setSalary((prev) => ({ ...prev, [key]: { ...levelOf(key), ...patch } }))
  }

  function handleSave() {
    saveSalaryBenefits(role, { salary, welfare })
    const rec = loadSalaryBenefits(role)
    setSavedAt(rec?.savedAt ?? null)
  }
  function handleClear() {
    clearSalaryBenefits(role)
    setSalary({})
    setWelfare({})
    setSavedAt(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-app-caption text-muted-foreground">
        Posizione: <b className="font-semibold text-foreground">&quot;{role}&quot;</b> ·{' '}
        {savedAt ? `Configurato · ${new Date(savedAt).toLocaleDateString('it-IT')}` : 'Non configurato'}
      </p>

      <Table size="sm" minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>Livello di inquadramento</TableHead>
              <TableHead>RAL minima</TableHead>
              <TableHead>RAL massima</TableHead>
              <TableHead>Componente variabile</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SALARY_LEVELS.map((lv) => {
              const row = levelOf(lv.key)
              const isSi = row.variableChoice === 'si'
              const isNo = row.variableChoice === 'no'
              return (
                <TableRow key={lv.key}>
                  <TableCell className="font-semibold text-foreground">{lv.label}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">€</span>
                      <Input type="number" value={row.min} onChange={(e) => updateLevel(lv.key, { min: e.target.value })} placeholder="0" size="sm" className="w-24" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">€</span>
                      <Input type="number" value={row.max} onChange={(e) => updateLevel(lv.key, { max: e.target.value })} placeholder="0" size="sm" className="w-24" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5">
                        <Checkbox checked={isSi} onCheckedChange={() => updateLevel(lv.key, { variableChoice: isSi ? '' : 'si' })} />
                        Sì
                      </label>
                      <label className="flex items-center gap-1.5">
                        <Checkbox checked={isNo} onCheckedChange={() => updateLevel(lv.key, { variableChoice: isNo ? '' : 'no' })} />
                        No
                      </label>
                      <span className="text-muted-foreground">—</span>
                      <div className="flex items-center gap-1">
                        %
                        <Input
                          type="number"
                          value={row.variablePct}
                          onChange={(e) => updateLevel(lv.key, { variablePct: e.target.value })}
                          placeholder="%"
                          disabled={!isSi}
                          size="sm" className="w-16"
 />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

      <div>
        <div className="label-mono mb-2 text-muted-foreground">Welfare &amp; Benefit</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {WELFARE_ITEMS.map((w) => {
            const checked = !!welfare[w.key]
            return (
              <label key={w.key} className="flex items-center gap-2 text-app-small text-foreground">
                <Checkbox checked={checked} onCheckedChange={(c) => setWelfare((prev) => ({ ...prev, [w.key]: c === true }))} />
                {w.label}
                {w.hasInput && w.inputKey && (
                  <Input
                    type="text"
                    value={(welfare[w.inputKey] as string) || ''}
                    onChange={(e) => setWelfare((prev) => ({ ...prev, [w.inputKey as string]: e.target.value }))}
                    placeholder={w.inputLabel}
                    disabled={!checked}
                    size="sm" className="w-28"
 />
                )}
              </label>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={handleClear} className={dangerBtnClass}>
          Svuota
        </button>
        <button type="button" onClick={handleSave} className={primaryBtnClass}>
          Salva
        </button>
      </div>
    </div>
  )
}
