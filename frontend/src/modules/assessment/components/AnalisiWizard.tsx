import { useState } from 'react'

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
      <div className="section-head">
        <div>
          <h2>{ui.analisiPageTitle}</h2>
          <p>
            {ui.exiBadge} · {ui.exiEstimatedTime}
          </p>
        </div>
        {cancelBtn}
      </div>
      <div className="card exi-progress">
        <div className="exi-progress-track">
          <div className="exi-progress-fill" style={{ width: `${(step / total) * 100}%` }} />
        </div>
        <div className="exi-steps">
          {steps.map((s, i) => (
            <div key={i} className={`exi-step-pill${i === step ? ' on' : i < step ? ' done' : ''}`} onClick={() => goStepGuarded(i)}>
              <span className="exi-step-dot" />
              {s}
            </div>
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="exi-wizard-step on">
          <div className="card">
            <div className="exi-eyebrow">{ui.exiSetupEyebrow}</div>
            <div className="exi-qtitle">{ui.exiSetupTitle}</div>
            <div className="exi-qsub">{ui.exiSetupSub}</div>
            <div className="grid grid-2">
              <div className="field">
                <label>{ui.exiFieldCompany}</label>
                <input className="neu-input" type="text" placeholder={ui.exiFieldCompanyPh} value={draft.azienda} onChange={(e) => setDraft((p) => ({ ...p, azienda: e.target.value }))} />
              </div>
              <div className="field">
                <label>{ui.exiFieldSector}</label>
                <input className="neu-input" type="text" placeholder={ui.exiFieldSectorPh} value={draft.settore} onChange={(e) => setDraft((p) => ({ ...p, settore: e.target.value }))} />
              </div>
              <div className="field">
                <label>{ui.exiFieldInterviewee}</label>
                <input className="neu-input" type="text" placeholder={ui.exiFieldIntervieweePh} value={draft.intervistato} onChange={(e) => setDraft((p) => ({ ...p, intervistato: e.target.value }))} />
              </div>
              <div className="field">
                <label>{ui.exiFieldRole}</label>
                <select className="neu-input" value={draft.ruolo} onChange={(e) => setDraft((p) => ({ ...p, ruolo: Number(e.target.value) }))}>
                  {roles.map((r, i) => (
                    <option key={i} value={i}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{ui.exiFieldEmployees}</label>
                <input className="neu-input" type="text" placeholder={ui.exiFieldEmployeesPh} value={draft.dipendenti} onChange={(e) => setDraft((p) => ({ ...p, dipendenti: e.target.value }))} />
              </div>
              <div className="field">
                <label>{ui.exiFieldDate}</label>
                <input className="neu-input" type="text" value={draft.data} onChange={(e) => setDraft((p) => ({ ...p, data: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="exi-nav">
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
        <div className="exi-wizard-step on">
          <div className="card">
            <div className="exi-qcount">3/7</div>
            <div className="exi-eyebrow">{ui.exiQ3Eyebrow}</div>
            <div className="exi-qtitle">{ui.exiQ3Title}</div>
            <div className="exi-qsub" dangerouslySetInnerHTML={{ __html: ui.exiQ3Sub }} />
            <div className="exi-areas-grid">
              {areas.map((name, i) => {
                const on = draft.areaSel[i] !== undefined
                const v = on ? draft.areaSel[i] : 5
                return (
                  <div className={`exi-area${on ? ' on' : ''}`} key={i} onClick={() => toggleArea(i)}>
                    <div className="exi-area-top">
                      <div className="exi-area-chk">✓</div>
                      <div className="exi-area-nm">{name}</div>
                    </div>
                    <div className="exi-area-slider" onClick={(e) => e.stopPropagation()}>
                      <div className="exi-area-slider-row">
                        <span>{ui.exiAreaCriticalityLabel}</span>
                        <input type="range" min={1} max={10} step={1} value={v} onChange={(e) => setAreaCrit(i, Number(e.target.value))} style={{ flex: 1 }} />
                        <span className="exi-area-slider-v">{v}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="exi-pri-list">
              {[0, 1, 2].map((i) => (
                <div className="exi-pri-row" key={i}>
                  <div className="exi-pri-num">{ui.exiAltroLabel}</div>
                  <input
                    type="text"
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
                </div>
              ))}
            </div>
            <div className="field">
              <label>{ui.exiQ3NotesLabel}</label>
              <textarea className={`neu-input${fieldInvalid(3, 'q3c') ? ' exi-field-invalid' : ''}`} placeholder={ui.exiQ3Ph} value={draft.q3c} onChange={(e) => setDraft((p) => ({ ...p, q3c: e.target.value }))} />
            </div>
          </div>
          <div className="exi-nav">
            <Button variant="ghost" onClick={prev}>
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
        <div className="exi-wizard-step on">
          <div className="card">
            <div className="exi-qcount">5/7</div>
            <div className="exi-eyebrow">{ui.exiQ5Eyebrow}</div>
            <div className="exi-qtitle">{ui.exiQ5Title}</div>
            <div className="exi-qsub" dangerouslySetInnerHTML={{ __html: ui.exiQ5Sub }} />
            <div className="exi-pri-list">
              {[0, 1, 2].map((i) => (
                <div className="exi-pri-row" key={i}>
                  <div className="exi-pri-num">{i + 1}</div>
                  <input
                    type="text"
                    className={fieldInvalid(5, 'riskDraft') ? 'exi-field-invalid' : ''}
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
                </div>
              ))}
            </div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.06em' }}>{ui.exiRiskLevelLabel}</label>
            <SliderBox ticks={ui.exiQ5Ticks} value={draft.q5} inverted pointsOf10Label={ui.exiPointsOf10} onChange={(v) => setDraft((p) => ({ ...p, q5: v }))} />
          </div>
          <div className="exi-nav">
            <Button variant="ghost" onClick={prev}>
              {ui.exiBackBtn}
            </Button>
            <Button variant="default" onClick={next}>
              {ui.exiNextBtn}
            </Button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="exi-wizard-step on">
          <div className="card">
            <div className="exi-qcount">6/7</div>
            <div className="exi-eyebrow">{ui.exiQ6Eyebrow}</div>
            <div className="exi-qtitle">{ui.exiQ6Title}</div>
            <div className="exi-qsub" dangerouslySetInnerHTML={{ __html: ui.exiQ6Sub }} />
            <div className="exi-pri-list">
              {[0, 1, 2].map((i) => (
                <div className="exi-pri-row" key={i}>
                  <div className="exi-pri-num">{i + 1}</div>
                  <input
                    type="text"
                    className={fieldInvalid(6, 'objDraft') ? 'exi-field-invalid' : ''}
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
                </div>
              ))}
            </div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.06em' }}>{ui.exiUrgencyLabel}</label>
            <SliderBox ticks={ui.exiQ6Ticks} value={draft.q6} inverted={false} pointsOf10Label={ui.exiPointsOf10} onChange={(v) => setDraft((p) => ({ ...p, q6: v }))} />
          </div>
          <div className="exi-nav">
            <Button variant="ghost" onClick={prev}>
              {ui.exiBackBtn}
            </Button>
            <Button variant="default" onClick={next}>
              {ui.exiNextBtn}
            </Button>
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="exi-wizard-step on">
          <div className="card">
            <div className="exi-qcount">7/7</div>
            <div className="exi-eyebrow">{ui.exiQ7Eyebrow}</div>
            <div className="exi-qtitle">{ui.exiQ7Title}</div>
            <div className="exi-qsub" dangerouslySetInnerHTML={{ __html: ui.exiQ7Sub }} />
            <div className="exi-dec-grid">
              {decisions.map((d, i) => {
                const on = draft.decSel.includes(i)
                return (
                  <div className={`exi-dec${on ? ' on' : ''}`} key={i} onClick={() => toggleDecision(i)}>
                    <div className="exi-dec-ic">{d.ic}</div>
                    <div className="exi-dec-nm">{d.nm}</div>
                    <div className="exi-dec-ds">{d.ds}</div>
                  </div>
                )
              })}
            </div>
            <div className="exi-pri-list">
              {[0, 1].map((i) => (
                <div className="exi-pri-row" key={i}>
                  <div className="exi-pri-num">{ui.exiAltroLabel}</div>
                  <input
                    type="text"
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
                </div>
              ))}
            </div>
            <div className="field">
              <label>{ui.exiCommentLabel}</label>
              <textarea className={`neu-input${fieldInvalid(7, 'q7c') ? ' exi-field-invalid' : ''}`} placeholder={ui.exiQ7Ph} value={draft.q7c} onChange={(e) => setDraft((p) => ({ ...p, q7c: e.target.value }))} />
            </div>
          </div>
          <div className="exi-nav">
            <Button variant="ghost" onClick={prev}>
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

function SliderBox({ ticks, value, inverted, pointsOf10Label, onChange }: { ticks: string[]; value: number; inverted: boolean; pointsOf10Label: string; onChange: (v: number) => void }) {
  const tier = inverted ? exiRiskTier(value, 'it') : exiScoreTier(value, 'it')
  return (
    <div className="exi-slider-box">
      <div className="exi-slider-value">
        <div className="exi-slider-num" style={{ color: tier.color }}>
          {fmt1(value)}
        </div>
        <div className="exi-slider-scale">{pointsOf10Label}</div>
        <div className="exi-slider-label" style={{ color: tier.color }}>
          {tier.label}
        </div>
      </div>
      <input type="range" min={1} max={10} step={0.5} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <div className="exi-slider-ticks">
        {ticks.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
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
    <div className="exi-wizard-step on">
      <div className="card">
        <div className="exi-qcount">{n}/7</div>
        <div className="exi-eyebrow">{eyebrow}</div>
        <div className="exi-qtitle">{title}</div>
        <div className="exi-qsub" dangerouslySetInnerHTML={{ __html: sub }} />
        <SliderBox ticks={ticks} value={value} inverted={false} pointsOf10Label={pointsOf10Label} onChange={onValue} />
        <div className="field">
          <label>{commentLabel}</label>
          <textarea className={`neu-input${invalid ? ' exi-field-invalid' : ''}`} placeholder={ph} value={comment} onChange={(e) => onComment(e.target.value)} />
        </div>
      </div>
      <div className="exi-nav">
        <Button variant="ghost" onClick={onBack}>
          {backLabel}
        </Button>
        <Button variant="default" onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}
