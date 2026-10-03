import { useState } from 'react'

import { PageHeader } from '@/components/patterns/PageHeader'
import { Initials } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Field } from '@/components/patterns/Field'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { chipTone } from '@/modules/assessment/lib/chip-tone'
import { Card } from '@/components/ui/card'
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
      <PageHeader title={ui.feedbackPageTitle} description={ui.feedbackPageSub} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((e) => {
          const d = draftFor(e.id, e.developmentPlan, e.feedbackNeeded)
          const tier = tierFor(primaryScore(e, state, lang), lang)
          return (
            <Card key={e.id}>
              <div className="flex items-center gap-3 mb-3">
                <Initials first={e.nome} last={e.cognome} size="lg" />
                <div className="flex-1">
                  <div className="font-semibold text-app-small">
                    {e.nome} {e.cognome}
                  </div>
                  <div className="text-app-caption text-muted-foreground">
                    {e.ruolo} · {e.area}
                  </div>
                </div>
                <Badge tone={chipTone(tier.chip)} dot>
                  {fmt1(primaryScore(e, state, lang))}
                </Badge>
              </div>

              <label className="mb-3 flex items-center gap-3 text-app-small font-medium">
                <Switch checked={d.feedbackNeeded} onCheckedChange={(c) => setDrafts((prev) => ({ ...prev, [e.id]: { ...d, feedbackNeeded: c } }))} />
                {ui.feedbackSwitchLabel}
              </label>

              {DEV_PLAN_FIELDS.map((f) => (
                <Field label={ui[f.labelKey as keyof typeof ui] as string} key={f.key}>
                  <Textarea
                    className="min-h-16"
                    placeholder={ui[f.phKey as keyof typeof ui] as string}
                    value={d[f.key]}
                    onChange={(ev) => setDrafts((prev) => ({ ...prev, [e.id]: { ...d, [f.key]: ev.target.value } }))}
                  />                </Field>
              ))}
              {canEdit && (
                <Button variant="default" size="sm" onClick={() => save(e.id)}>
                  {ui.btnSave}
                </Button>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
