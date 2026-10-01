import { ArrowLeft, Coins, Crown, GraduationCap, RefreshCw, Star, Target, TrendingUp, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'

import { Note } from '@/components/patterns/Note'
import { Badge } from '@/components/ui/badge'
import { ChoiceCard } from '@/components/patterns/ChoiceCard'
import { PrefixedInput } from '@/components/patterns/PrefixedInput'
import { StepNav } from '@/components/patterns/StepNav'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { SelectField } from '@/components/patterns/SelectField'
import { Field } from '@/components/patterns/Field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardLabel } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { exiRiskTier, exiScoreTier, fmt1 } from '@/modules/assessment/lib/legacy-utils'
import type { ExiData } from '@/modules/assessment/lib/types'

type Draft = ExiData & { riskDraft: string[]; objDraft: string[]; areaSel: Record<number, number>; decSel: number[] }

function toDraft(a: ExiData): Draft {
  return {
    ...a,
    riskDraft: [0, 1, 2].map((i) => a.rischi[i] || ''),
    objDraft: [0, 1, 2].map((i) => a.obiettivi[i] || ''),
    areaSel: { ...a.aree },
    decSel: [...a.decisioni],
    // Safe fallback for state persisted before these fields existed.
    q3Altro: [0, 1, 2].map((i) => a.q3Altro?.[i] || ''),
    q7Altro: [0, 1].map((i) => a.q7Altro?.[i] || ''),
  }
}

// Migrated from exiEnterWizard()/renderExiWizard()/exiGoStep()/exiNext()/
// exiStepIsValid()/exiGenerate() (js/assessment.js ~5892-6193) — the 8-step
// (0-7) Executive Human Capital Interview intake form: company setup, 5
// slider questions with tier-colored readouts (Q1/Q2/Q4/Q5[inverted]/Q6),
// an area-criticality multi-select grid (Q3), a decisions multi-select grid
// (Q7), and 3-slot risk/objective text lists (Q5/Q6). Same per-step
// required-field validation as legacy (comment/list fields required,
// sliders always valid), same skip-ahead guard on the step pills.
// Le otto decisioni avevano un'emoji come icona (dizionario IT/EN): qui
// l'icona Lucide corrispondente, per carattere (CLAUDE.md cap. 7).
const DECISION_ICON: Record<string, LucideIcon> = {
  '📈': TrendingUp,
  '⭐': Star,
  '🔄': RefreshCw,
  '⚡': Zap,
  '🎯': Target,
  '👑': Crown,
  '💰': Coins,
  '🎓': GraduationCap,
}

export function AnalisiWizard({ initial, startStep, onCancel, onGenerate }: { initial: ExiData; startStep: number; onCancel: (() => void) | null; onGenerate: (data: ExiData) => void }) {
  const { ui, toast } = useAssessment()
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial))
  const [step, setStep] = useState(startStep)
  const [invalidStep, setInvalidStep] = useState<number | null>(null)

  const steps = ui.exiSteps as string[]
  const roles = ui.exiRoles as string[]
  const areas = ui.exiAreas as string[]
  const decisions = ui.exiDecisions as { ic: string; nm: string; ds: string }[]

  function stepFields(n: number): (keyof Draft)[] | 'risk' | 'obj' {
    if (n === 1) return ['q1c']
    if (n === 2) return ['q2c']
    if (n === 3) return ['q3c']
    if (n === 4) return ['q4c']
    if (n === 5) return 'risk'
    if (n === 6) return 'obj'
    if (n === 7) return ['q7c']
    return []
  }
  function stepIsValid(n: number): boolean {
    const f = stepFields(n)
    if (f === 'risk') return draft.riskDraft.every((v) => v.trim().length > 0)
    if (f === 'obj') return draft.objDraft.every((v) => v.trim().length > 0)
    return f.every((k) => String(draft[k] ?? '').trim().length > 0)
  }
  function firstInvalidStep(): number | null {
    for (let n = 1; n <= 7; n++) if (!stepIsValid(n)) return n
    return null
  }

  function goStep(i: number) {
    if (i < 0 || i > 7) return
    setStep(i)
    setInvalidStep(null)
  }
  function next() {
    if (step >= 1 && step <= 7 && !stepIsValid(step)) {
      toast(ui.exiValidationMsg, 'err')
      setInvalidStep(step)
      return
    }
    goStep(step + 1)
  }
  function prev() {
    goStep(step - 1)
  }
  function goStepGuarded(i: number) {
    if (i > step) {
      for (let n = 1; n < i && n <= 7; n++) {
        if (!stepIsValid(n)) {
          toast(ui.exiValidationMsg, 'err')
          goStep(n)
          setInvalidStep(n)
          return
        }
      }
    }
    if (i === 8) {
      generate()
      return
    }
    goStep(i)
  }

  function generate() {
    const bad = firstInvalidStep()
    if (bad) {
      toast(ui.exiValidationMsg, 'err')
      goStep(bad)
      setInvalidStep(bad)
      return
    }
    onGenerate({
      completed: true,
      azienda: draft.azienda,
      settore: draft.settore,
      intervistato: draft.intervistato,
      ruolo: draft.ruolo,
      dipendenti: draft.dipendenti,
      data: draft.data,
      q1: draft.q1,
      q1c: draft.q1c,
      q2: draft.q2,
      q2c: draft.q2c,
      aree: { ...draft.areaSel },
      q3c: draft.q3c,
      q3Altro: draft.q3Altro.filter(Boolean),
      q4: draft.q4,
      q4c: draft.q4c,
      q5: draft.q5,
      rischi: draft.riskDraft.filter(Boolean),
      q6: draft.q6,
      obiettivi: draft.objDraft.filter(Boolean),
      decisioni: [...draft.decSel],
      q7c: draft.q7c,
      q7Altro: draft.q7Altro.filter(Boolean),
    })
  }

  function toggleArea(i: number) {
    setDraft((prev) => {
      const areaSel = { ...prev.areaSel }
      if (areaSel[i] !== undefined) delete areaSel[i]
      else areaSel[i] = 5
      return { ...prev, areaSel }
    })
  }
  function setAreaCrit(i: number, v: number) {
    setDraft((prev) => ({ ...prev, areaSel: { ...prev.areaSel, [i]: v } }))
  }
  function toggleDecision(i: number) {
    setDraft((prev) => ({ ...prev, decSel: prev.decSel.includes(i) ? prev.decSel.filter((x) => x !== i) : [...prev.decSel, i] }))
  }

  function fieldInvalid(n: number, key: string) {
    return invalidStep === n && !String((draft as unknown as Record<string, unknown>)[key] ?? '').toString().trim()
  }

  const total = steps.length - 1
  const cancelBtn = initial.completed && onCancel ? (
    <Button variant="ghost" size="sm" onClick={onCancel}>
      {ui.exiCancelEditBtn}
    </Button>
  ) : null

  return (
    <div>
      <PageHeader title={ui.analisiPageTitle} description={<>{ui.exiBadge} · {ui.exiEstimatedTime}</>} actions={cancelBtn} />
      <Card className="mb-6">
        <Progress value={(step / total) * 100} className="mb-3" aria-label={`${step} / ${total}`} />
        <StepNav steps={steps} current={step} onSelect={goStepGuarded} label={ui.analisiPageTitle} />
      </Card>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <Card>
            <QuestionHeader eyebrow={ui.exiSetupEyebrow} title={ui.exiSetupTitle} sub={ui.exiSetupSub} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={ui.exiFieldCompany}>
                <Input type="text" placeholder={ui.exiFieldCompanyPh} value={draft.azienda} onChange={(e) => setDraft((p) => ({ ...p, azienda: e.target.value }))} />
              </Field>
              <Field label={ui.exiFieldSector}>
                <Input type="text" placeholder={ui.exiFieldSectorPh} value={draft.settore} onChange={(e) => setDraft((p) => ({ ...p, settore: e.target.value }))} />
              </Field>
              <Field label={ui.exiFieldInterviewee}>
                <Input type="text" placeholder={ui.exiFieldIntervieweePh} value={draft.intervistato} onChange={(e) => setDraft((p) => ({ ...p, intervistato: e.target.value }))} />
              </Field>
              <Field label={ui.exiFieldRole}>
                <SelectField value={draft.ruolo} onValueChange={(v) => setDraft((p) => ({ ...p, ruolo: Number(v) }))}>
                  {roles.map((r, i) => (
                    <option key={i} value={i}>
                      {r}
                    </option>
                  ))}
                </SelectField>
              </Field>
              <Field label={ui.exiFieldEmployees} hint={ui.exiFieldEmployeesHint}>
                <Input type="text" placeholder={ui.exiFieldEmployeesPh} value={draft.dipendenti} onChange={(e) => setDraft((p) => ({ ...p, dipendenti: e.target.value }))} />
              </Field>
              <Field label={ui.exiFieldDate}>
                <Input type="text" value={draft.data} onChange={(e) => setDraft((p) => ({ ...p, data: e.target.value }))} />
              </Field>
            </div>
          </Card>
          <div className="flex items-center justify-between gap-3">
            <span />
            <Button variant="default" onClick={next}>
              {ui.exiStartBtn}
            </Button>
          </div>
        </div>
      )}

      {step === 1 && <SliderStep n={1} eyebrow={ui.exiQ1Eyebrow} title={ui.exiQ1Title} sub={ui.exiQ1Sub} ticks={ui.exiQ1Ticks} value={draft.q1} ph={ui.exiQ1Ph} comment={draft.q1c} invalid={fieldInvalid(1, 'q1c')} commentLabel={ui.exiCommentLabel} pointsOf10Label={ui.exiPointsOf10} backLabel={ui.exiBackBtn} nextLabel={ui.exiNextBtn} onValue={(v) => setDraft((p) => ({ ...p, q1: v }))} onComment={(v) => setDraft((p) => ({ ...p, q1c: v }))} onBack={prev} onNext={next} />}
      {step === 2 && <SliderStep n={2} eyebrow={ui.exiQ2Eyebrow} title={ui.exiQ2Title} sub={ui.exiQ2Sub} ticks={ui.exiQ2Ticks} value={draft.q2} ph={ui.exiQ2Ph} comment={draft.q2c} invalid={fieldInvalid(2, 'q2c')} commentLabel={ui.exiCommentLabel} pointsOf10Label={ui.exiPointsOf10} backLabel={ui.exiBackBtn} nextLabel={ui.exiNextBtn} onValue={(v) => setDraft((p) => ({ ...p, q2: v }))} onComment={(v) => setDraft((p) => ({ ...p, q2c: v }))} onBack={prev} onNext={next} />}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <Card>
            <QuestionHeader count="3/7" eyebrow={ui.exiQ3Eyebrow} title={ui.exiQ3Title} subHtml={ui.exiQ3Sub} />
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {areas.map((name, i) => {
                const on = draft.areaSel[i] !== undefined
                const v = on ? draft.areaSel[i] : 5
                return (
                  <ChoiceCard key={i} selected={on} onSelectedChange={() => toggleArea(i)} title={name}>
                    <div className="flex items-center gap-2 text-app-caption text-muted-foreground">
                      <span>{ui.exiAreaCriticalityLabel}</span>
                      <Slider min={1} max={10} step={1} value={[v]} onValueChange={([n]) => setAreaCrit(i, n)} aria-label={`${ui.exiAreaCriticalityLabel} — ${name}`} className="flex-1" />
                      <span className="min-w-5 text-right text-app-small font-medium text-foreground tabular-nums">{v}</span>
                    </div>
                  </ChoiceCard>
                )
              })}
            </div>
            <div className="mb-4 flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <PrefixedInput
                  key={i}
                  lead={ui.exiAltroLabel}
                  aria-label={ui.exiAltroPh}
                  placeholder={ui.exiAltroPh}
                  value={draft.q3Altro[i]}
                  onChange={(e) =>
                    setDraft((p) => {
                      const q3Altro = [...p.q3Altro]
                      q3Altro[i] = e.target.value
                      return { ...p, q3Altro }
                    })
                  }
                />
              ))}
            </div>
            <Field label={ui.exiQ3NotesLabel}>
              <Textarea aria-invalid={fieldInvalid(3, 'q3c')} placeholder={ui.exiQ3Ph} value={draft.q3c} onChange={(e) => setDraft((p) => ({ ...p, q3c: e.target.value }))} />
            </Field>
          </Card>
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={prev}>
              <ArrowLeft />
              {ui.exiBackBtn}
            </Button>
            <Button variant="default" onClick={next}>
              {ui.exiNextBtn}
            </Button>
          </div>
        </div>
      )}

      {step === 4 && <SliderStep n={4} eyebrow={ui.exiQ4Eyebrow} title={ui.exiQ4Title} sub={ui.exiQ4Sub} ticks={ui.exiQ4Ticks} value={draft.q4} ph={ui.exiQ4Ph} comment={draft.q4c} invalid={fieldInvalid(4, 'q4c')} commentLabel={ui.exiCommentLabel} pointsOf10Label={ui.exiPointsOf10} backLabel={ui.exiBackBtn} nextLabel={ui.exiNextBtn} onValue={(v) => setDraft((p) => ({ ...p, q4: v }))} onComment={(v) => setDraft((p) => ({ ...p, q4c: v }))} onBack={prev} onNext={next} />}

      {step === 5 && (
        <div className="flex flex-col gap-4">
          <Card>
            <QuestionHeader count="5/7" eyebrow={ui.exiQ5Eyebrow} title={ui.exiQ5Title} subHtml={ui.exiQ5Sub} />
            <div className="mb-4 flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <PrefixedInput
                  key={i}
                  lead={i + 1}
                  aria-label={ui.exiRiskPh[i]}
                  aria-invalid={fieldInvalid(5, 'riskDraft')}
                  placeholder={ui.exiRiskPh[i]}
                  value={draft.riskDraft[i]}
                  onChange={(e) =>
                    setDraft((p) => {
                      const riskDraft = [...p.riskDraft]
                      riskDraft[i] = e.target.value
                      return { ...p, riskDraft }
                    })
                  }
                />
              ))}
            </div>
            <Label className="mb-2">{ui.exiRiskLevelLabel}</Label>
            <SliderBox label={ui.exiRiskLevelLabel} ticks={ui.exiQ5Ticks} value={draft.q5} inverted pointsOf10Label={ui.exiPointsOf10} onChange={(v) => setDraft((p) => ({ ...p, q5: v }))} />
          </Card>
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={prev}>
              <ArrowLeft />
              {ui.exiBackBtn}
            </Button>
            <Button variant="default" onClick={next}>
              {ui.exiNextBtn}
            </Button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="flex flex-col gap-4">
          <Card>
            <QuestionHeader count="6/7" eyebrow={ui.exiQ6Eyebrow} title={ui.exiQ6Title} subHtml={ui.exiQ6Sub} />
            <div className="mb-4 flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <PrefixedInput
                  key={i}
                  lead={i + 1}
                  aria-label={ui.exiObjPh[i]}
                  aria-invalid={fieldInvalid(6, 'objDraft')}
                  placeholder={ui.exiObjPh[i]}
                  value={draft.objDraft[i]}
                  onChange={(e) =>
                    setDraft((p) => {
                      const objDraft = [...p.objDraft]
                      objDraft[i] = e.target.value
                      return { ...p, objDraft }
                    })
                  }
                />
              ))}
            </div>
            <Label className="mb-2">{ui.exiUrgencyLabel}</Label>
            <SliderBox label={ui.exiUrgencyLabel} ticks={ui.exiQ6Ticks} value={draft.q6} inverted={false} pointsOf10Label={ui.exiPointsOf10} onChange={(v) => setDraft((p) => ({ ...p, q6: v }))} />
          </Card>
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={prev}>
              <ArrowLeft />
              {ui.exiBackBtn}
            </Button>
            <Button variant="default" onClick={next}>
              {ui.exiNextBtn}
            </Button>
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="flex flex-col gap-4">
          <Card>
            <QuestionHeader count="7/7" eyebrow={ui.exiQ7Eyebrow} title={ui.exiQ7Title} subHtml={ui.exiQ7Sub} />
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {decisions.map((d, i) => (
                <ChoiceCard key={i} align="center" icon={DECISION_ICON[d.ic] ?? Target} selected={draft.decSel.includes(i)} onSelectedChange={() => toggleDecision(i)} title={d.nm} description={d.ds} />
              ))}
            </div>
            <div className="mb-4 flex flex-col gap-2">
              {[0, 1].map((i) => (
                <PrefixedInput
                  key={i}
                  lead={ui.exiAltroLabel}
                  aria-label={ui.exiAltroPh}
                  placeholder={ui.exiAltroPh}
                  value={draft.q7Altro[i]}
                  onChange={(e) =>
                    setDraft((p) => {
                      const q7Altro = [...p.q7Altro]
                      q7Altro[i] = e.target.value
                      return { ...p, q7Altro }
                    })
                  }
                />
              ))}
            </div>
            <Field label={ui.exiCommentLabel}>
              <Textarea aria-invalid={fieldInvalid(7, 'q7c')} placeholder={ui.exiQ7Ph} value={draft.q7c} onChange={(e) => setDraft((p) => ({ ...p, q7c: e.target.value }))} />
            </Field>
          </Card>
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={prev}>
              <ArrowLeft />
              {ui.exiBackBtn}
            </Button>
            <Button variant="default" onClick={generate}>
              {ui.exiGenerateBtn}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function SliderBox({ ticks, value, inverted, pointsOf10Label, label, onChange }: { ticks: string[]; value: number; inverted: boolean; pointsOf10Label: string; label: string; onChange: (v: number) => void }) {
  const tier = inverted ? exiRiskTier(value, 'it') : exiScoreTier(value, 'it')
  return (
    <div className="mb-4 flex flex-col gap-4 rounded-md border border-border bg-background p-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-metric-lg tabular-nums">{fmt1(value)}</span>
        <span className="text-app-small text-muted-foreground">{pointsOf10Label}</span>
        <Badge tone={tier.tone} dot>
          {tier.label}
        </Badge>
      </div>
      <Slider min={1} max={10} step={0.5} value={[value]} onValueChange={([n]) => onChange(n)} aria-label={label} />
      <div className="flex justify-between text-app-caption text-muted-foreground">
        {ticks.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  )
}

// Testata di una domanda dell'Intervista: numero della domanda, sovratitolo,
// domanda (18/600), spiegazione (dal dizionario, con eventuale HTML).
function QuestionHeader({ count, eyebrow, title, sub, subHtml }: { count?: string; eyebrow: string; title: string; sub?: string; subHtml?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      {count ? (
        <Badge className="self-start" tone="neutral">
          {count}
        </Badge>
      ) : null}
      <CardLabel>{eyebrow}</CardLabel>
      <h3 className="text-app-section text-foreground">{title}</h3>
      {subHtml ? <Note as="div" dangerouslySetInnerHTML={{ __html: subHtml }} /> : sub ? <Note>{sub}</Note> : null}
    </div>
  )
}

function SliderStep({
  n,
  eyebrow,
  title,
  sub,
  ticks,
  value,
  ph,
  comment,
  invalid,
  commentLabel,
  pointsOf10Label,
  backLabel,
  nextLabel,
  onValue,
  onComment,
  onBack,
  onNext,
}: {
  n: number
  eyebrow: string
  title: string
  sub: string
  ticks: string[]
  value: number
  ph: string
  comment: string
  invalid: boolean
  commentLabel: string
  pointsOf10Label: string
  backLabel: string
  nextLabel: string
  onValue: (v: number) => void
  onComment: (v: string) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <QuestionHeader count={`${n}/7`} eyebrow={eyebrow} title={title} subHtml={sub} />
        <SliderBox label={title} ticks={ticks} value={value} inverted={false} pointsOf10Label={pointsOf10Label} onChange={onValue} />
        <Field label={commentLabel}>
          <Textarea aria-invalid={invalid} placeholder={ph} value={comment} onChange={(e) => onComment(e.target.value)} />
        </Field>
      </Card>
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft />
          {backLabel}
        </Button>
        <Button variant="default" onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}
