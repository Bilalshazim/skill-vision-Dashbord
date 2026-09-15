import { useState } from 'react'

import { cn } from '@/lib/utils'
import { SALARY_LEVELS, WELFARE_ITEMS } from '@/modules/recruiting/lib/jd-presets'
import { clearSalaryBenefits, loadSalaryBenefits, saveSalaryBenefits } from '@/modules/recruiting/lib/jd'
import type { SalaryLevelRecord } from '@/modules/recruiting/lib/jd-types'
import { inputClass } from '@/modules/recruiting/job-profile/JdSection'

const EMPTY_LEVEL: SalaryLevelRecord = { min: '', max: '', variableChoice: '', variablePct: '' }
const primaryBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
const dangerBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3.5 py-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

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
      <p className="text-[12px] text-muted-foreground">
        Ruolo: <b className="font-semibold text-foreground">&quot;{role}&quot;</b> ·{' '}
        {savedAt ? `Configurato ✓ · ${new Date(savedAt).toLocaleDateString('it-IT')}` : 'Non configurato'}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-3 font-semibold">Livello di inquadramento</th>
              <th className="py-2 pr-3 font-semibold">RAL minima</th>
              <th className="py-2 pr-3 font-semibold">RAL massima</th>
              <th className="py-2 font-semibold">Componente variabile</th>
            </tr>
          </thead>
          <tbody>
            {SALARY_LEVELS.map((lv) => {
              const row = levelOf(lv.key)
              const isSi = row.variableChoice === 'si'
              const isNo = row.variableChoice === 'no'
              return (
                <tr key={lv.key} className="border-b border-border">
                  <td className="py-2 pr-3 font-semibold text-foreground">{lv.label}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">€</span>
                      <input type="number" value={row.min} onChange={(e) => updateLevel(lv.key, { min: e.target.value })} placeholder="0" className={cn(inputClass, 'w-[100px]')} />
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">€</span>
                      <input type="number" value={row.max} onChange={(e) => updateLevel(lv.key, { max: e.target.value })} placeholder="0" className={cn(inputClass, 'w-[100px]')} />
                    </div>
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={isSi} onChange={() => updateLevel(lv.key, { variableChoice: isSi ? '' : 'si' })} className="accent-ring" />
                        Sì
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={isNo} onChange={() => updateLevel(lv.key, { variableChoice: isNo ? '' : 'no' })} className="accent-ring" />
                        No
                      </label>
                      <span className="text-muted-foreground">—</span>
                      <div className="flex items-center gap-1">
                        %
                        <input
                          type="number"
                          value={row.variablePct}
                          onChange={(e) => updateLevel(lv.key, { variablePct: e.target.value })}
                          placeholder="%"
                          disabled={!isSi}
                          className={cn(inputClass, 'w-[60px]')}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Welfare &amp; Benefit</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {WELFARE_ITEMS.map((w) => {
            const checked = !!welfare[w.key]
            return (
              <label key={w.key} className="flex items-center gap-2 text-[12.5px] text-foreground">
                <input type="checkbox" checked={checked} onChange={(e) => setWelfare((prev) => ({ ...prev, [w.key]: e.target.checked }))} className="accent-ring" />
                {w.label}
                {w.hasInput && w.inputKey && (
                  <input
                    type="text"
                    value={(welfare[w.inputKey] as string) || ''}
                    onChange={(e) => setWelfare((prev) => ({ ...prev, [w.inputKey as string]: e.target.value }))}
                    placeholder={w.inputLabel}
                    disabled={!checked}
                    className={cn(inputClass, 'w-[110px]')}
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
          Salva ✓
        </button>
      </div>
    </div>
  )
}
