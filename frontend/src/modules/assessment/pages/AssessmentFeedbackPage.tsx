import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { primaryScore, tierFor } from '@/modules/assessment/lib/calculations'
import { fmt1 } from '@/modules/assessment/lib/legacy-utils'
import type { DevelopmentPlan } from '@/modules/assessment/lib/types'

const DEV_PLAN_FIELDS: { key: keyof DevelopmentPlan; labelKey: string; phKey: string }[] = [
  { key: 'azioni', labelKey: 'devPlanAzioniLabel', phKey: 'devPlanAzioniPh' },
  { key: 'formazione', labelKey: 'devPlanFormazioneLabel', phKey: 'devPlanFormazionePh' },
  { key: 'coaching', labelKey: 'devPlanCoachingLabel', phKey: 'devPlanCoachingPh' },
  { key: 'obiettivi', labelKey: 'devPlanObiettiviLabel', phKey: 'devPlanObiettiviPh' },
]

// Migrated from renderFeedback()/saveFeedbackRow() (js/assessment.js
// ~7882-7908) — one card per employee (feedbackNeeded first, then
// alphabetical), a toggle + 4 development-plan textareas, saved per row.
export default function AssessmentFeedbackPage() {
  const { state, setState, lang, ui, canEdit } = useAssessment()
  const list = [...state.employees].sort((a, b) => Number(b.feedbackNeeded) - Number(a.feedbackNeeded) || a.cognome.localeCompare(b.cognome))
  const [drafts, setDrafts] = useState<Record<string, DevelopmentPlan & { feedbackNeeded: boolean }>>(() =>
    Object.fromEntries(state.employees.map((e) => [e.id, { ...e.developmentPlan, feedbackNeeded: e.feedbackNeeded }])),
  )

  function draftFor(id: string, plan: typeof state.employees[number]['developmentPlan'], feedbackNeeded: boolean) {
    return drafts[id] || { ...plan, feedbackNeeded }
  }

  function save(id: string) {
    if (!canEdit) return
    const d = drafts[id]
    if (!d) return
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === id ? { ...e, feedbackNeeded: d.feedbackNeeded, developmentPlan: { azioni: d.azioni, formazione: d.formazione, coaching: d.coaching, obiettivi: d.obiettivi } } : e)),
    }))
  }

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>{ui.feedbackPageTitle}</h2>
          <p>{ui.feedbackPageSub}</p>
        </div>
      </div>
      <div className="grid grid-2">
        {list.map((e) => {
          const d = draftFor(e.id, e.developmentPlan, e.feedbackNeeded)
          const tier = tierFor(primaryScore(e, state, lang), lang)
          return (
            <div className="card" key={e.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div className="avatar" style={{ width: 36, height: 36 }}>
                  {(e.nome[0] || '') + (e.cognome[0] || '')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5 }}>
                    {e.nome} {e.cognome}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                    {e.ruolo} · {e.area}
                  </div>
                </div>
                <span className={`chip ${tier.chip}`}>
                  <span className="dt" />
                  {fmt1(primaryScore(e, state, lang))}
                </span>
              </div>

              <div className="switch-row" style={{ marginBottom: 12 }}>
                <label className="switch">
                  <input type="checkbox" checked={d.feedbackNeeded} onChange={(ev) => setDrafts((prev) => ({ ...prev, [e.id]: { ...d, feedbackNeeded: ev.target.checked } }))} />
                  <span className="slider" />
                </label>
                <div className="lbl">
                  <div className="l1">{ui.feedbackSwitchLabel}</div>
                </div>
              </div>

              {DEV_PLAN_FIELDS.map((f) => (
                <div className="field" key={f.key} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11 }}>{ui[f.labelKey as keyof typeof ui] as string}</label>
                  <textarea
                    className="neu-input"
                    style={{ width: '100%', minHeight: 60, lineHeight: 1.5, resize: 'vertical' }}
                    placeholder={ui[f.phKey as keyof typeof ui] as string}
                    value={d[f.key]}
                    onChange={(ev) => setDrafts((prev) => ({ ...prev, [e.id]: { ...d, [f.key]: ev.target.value } }))}
                  />
                </div>
              ))}
              {canEdit && (
                <Button variant="default" size="sm" onClick={() => save(e.id)}>
                  {ui.btnSave}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
