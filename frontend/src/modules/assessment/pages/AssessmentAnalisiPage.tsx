import { useState } from 'react'

import { Icon } from '@/modules/assessment/components/Icon'
import { AnalisiWizard } from '@/modules/assessment/components/AnalisiWizard'
import { useAssessment, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import { exiBlankData } from '@/modules/assessment/lib/demo-data'
import { exiRiskTier, exiScoreTier, fmt1, round1 } from '@/modules/assessment/lib/legacy-utils'
import { printReportHtml } from '@/modules/assessment/lib/print'
import { useNavigate } from 'react-router-dom'
import type { ExiData } from '@/modules/assessment/lib/types'

// Migrated from renderAnalisi()/renderExiReport()/renderExiWizard()/
// exiPrintReport()/exiExportJson() (js/assessment.js ~5892-6360) — the
// Executive Human Capital Interview: report view (Perceived Human Capital
// Value hero score, 5 KPIs, perception gap, critical areas, per-question
// answers, risks/objectives/decisions chips, CTA) AND (completed in Phase
// 25) the 8-step edit wizard, print view, and JSON export. Phase 24 had
// shipped only the report/display side.
export default function AssessmentAnalisiPage() {
  const { state, setState } = useAssessment()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'report' | 'wizard'>('report')
  const [wizardStartStep, setWizardStartStep] = useState(0)
  const a = state.analisiIniziale

  function commitAndReturn(data: ExiData) {
    setState((prev) => ({ ...prev, analisiIniziale: data }))
    setMode('report')
  }

  if (mode === 'wizard') {
    return <AnalisiWizard initial={a} startStep={wizardStartStep} onCancel={a.completed ? () => setMode('report') : null} onGenerate={commitAndReturn} />
  }

  return <AnalisiReport a={a} onNewInterview={() => { setWizardStartStep(0); setMode('wizard') }} onEditAnswers={() => { setWizardStartStep(7); setMode('wizard') }} onStartAssessment={() => navigate('/assessment/anagrafica')} />
}

function AnalisiReport({ a, onNewInterview, onEditAnswers, onStartAssessment }: { a: ExiData; onNewInterview: () => void; onEditAnswers: () => void; onStartAssessment: () => void }) {
  const { setState, lang, ui, canEdit, toast } = useAssessment()

  const v1 = a.q1
  const v2 = a.q2
  const v4 = a.q4
  const v5 = a.q5
  const v6 = a.q6
  const gap = round1(v2 - v1)
  const gapPc = v1 > 0 ? (gap / v1) * 100 : 0
  const phcv = round1(v1 * 0.3 + v2 * 0.25 + v4 * 0.25 + (10 - v5) * 0.1 + v6 * 0.1)
  const heroTier = exiScoreTier(phcv, lang)
  const heroText = phcv >= 7.5 ? ui.exiHeroTextHigh : phcv >= 6 ? ui.exiHeroTextMid : phcv >= 4.5 ? ui.exiHeroTextLow : ui.exiHeroTextCritical

  const KS = [
    { v: v1, color: 'var(--accent)', label: ui.exiK1Label, sub: ui.exiK1Sub, inverted: false },
    { v: v2, color: 'var(--success)', label: ui.exiK2Label, sub: ui.exiK2Sub, inverted: false },
    { v: v4, color: 'var(--gold)', label: ui.exiK4Label, sub: ui.exiK4Sub, inverted: false },
    { v: v5, color: 'var(--danger)', label: ui.exiK5Label, sub: ui.exiK5Sub, inverted: true },
    { v: v6, color: 'var(--warning)', label: ui.exiK6Label, sub: ui.exiK6Sub, inverted: false },
  ]

  const gapColor = gap < -0.5 ? 'var(--danger)' : gap < 0 ? 'var(--warning)' : 'var(--success)'
  const gapText = gap < 0 ? ui.exiGapTextNegative(fmt1(Math.abs(gap)), Math.abs(gapPc).toFixed(1)) : gap === 0 ? ui.exiGapTextZero : ui.exiGapTextPositive

  const areaKeys = Object.keys(a.aree || {}).sort((x, y) => a.aree[y] - a.aree[x])
  const risk = (a.rischi || []).filter(Boolean)
  const obj = (a.obiettivi || []).filter(Boolean)
  const meta = [a.intervistato, ui.exiRoles[a.ruolo], a.settore, a.data].filter(Boolean).join(' · ')

  function newInterview() {
    if (!canEdit) return
    if (a.completed && !window.confirm(ui.exiConfirmNew)) return
    setState((prev) => ({ ...prev, analisiIniziale: exiBlankData(prev.settings.companyName) }))
    onNewInterview()
  }

  function printReport() {
    const roles = ui.exiRoles as string[]
    const areas = ui.exiAreas as string[]
    const decisions = ui.exiDecisions as { ic: string; nm: string; ds: string }[]
    const areaRows = areaKeys.map((i) => `<tr><td>${areas[Number(i)] || ''}</td><td>${a.aree[i]}</td></tr>`).join('')
    const riskLis = risk.map((r) => `<li>${r}</li>`).join('')
    const objLis = obj.map((o) => `<li>${o}</li>`).join('')
    const decs = a.decisioni.map((i) => (decisions[i] ? decisions[i].nm : '')).filter(Boolean).join(', ')
    printReportHtml(`
      <div class="rpt-note"><b>${ui.exiRepBadge}</b> — ${a.azienda || ''}</div>
      <div class="rpt-h1">${a.azienda || ''}</div>
      <div>${[a.intervistato, roles[a.ruolo] || '', a.settore].filter(Boolean).join(' · ')}</div>
      <div style="font-size:11px;color:#555;margin-top:2px">${a.data || ''}</div>
      <div class="rpt-h2">${ui.exiHeroLabel}</div>
      <div>${fmt1(phcv)}/10</div>
      <table class="rpt-table"><thead><tr><th>${ui.analisiPageTitle}</th><th>/10</th></tr></thead><tbody>
        <tr><td>${String(ui.exiK1Label).replace('<br>', ' ')}</td><td>${fmt1(v1)}</td></tr>
        <tr><td>${String(ui.exiK2Label).replace('<br>', ' ')}</td><td>${fmt1(v2)}</td></tr>
        <tr><td>${String(ui.exiK4Label).replace('<br>', ' ')}</td><td>${fmt1(v4)}</td></tr>
        <tr><td>${String(ui.exiK5Label).replace('<br>', ' ')}</td><td>${fmt1(v5)}</td></tr>
        <tr><td>${String(ui.exiK6Label).replace('<br>', ' ')}</td><td>${fmt1(v6)}</td></tr>
      </tbody></table>
      <div class="rpt-h2">${ui.exiGapTitle}</div>
      <div>${gap >= 0 ? '+' : ''}${fmt1(gap)}</div>
      ${areaRows ? `<div class="rpt-h2">${ui.exiAreasTitle}</div><table class="rpt-table"><thead><tr><th>${ui.analisiPageTitle}</th><th>${ui.exiAreaCriticalityLabel}</th></tr></thead><tbody>${areaRows}</tbody></table>` : ''}
      ${riskLis ? `<div class="rpt-h2">${ui.exiAns5Title}</div><ul>${riskLis}</ul>` : ''}
      ${objLis ? `<div class="rpt-h2">${ui.exiAns6Title}</div><ul>${objLis}</ul>` : ''}
      ${decs ? `<div class="rpt-h2">${ui.exiAns7Title}</div><div>${decs}</div>` : ''}
    `)
  }

  function exportJson() {
    const roles = ui.exiRoles as string[]
    const areas = ui.exiAreas as string[]
    const decisions = ui.exiDecisions as { ic: string; nm: string; ds: string }[]
    const data = {
      azienda: a.azienda,
      settore: a.settore,
      intervistato: a.intervistato,
      ruolo: roles[a.ruolo] || '',
      dipendenti: a.dipendenti,
      data: a.data,
      q1: a.q1,
      q1c: a.q1c,
      q2: a.q2,
      q2c: a.q2c,
      aree: Object.entries(a.aree || {}).map(([i, v]) => ({ area: areas[Number(i)] || '', criticita: v })),
      q3c: a.q3c,
      q4: a.q4,
      q4c: a.q4c,
      q5: a.q5,
      rischi: a.rischi || [],
      q6: a.q6,
      obiettivi: a.obiettivi || [],
      decisioni: (a.decisioni || []).map((i) => (decisions[i] ? decisions[i].nm : '')),
      q7c: a.q7c,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `executive_interview_${(a.azienda || 'azienda').replace(/[^a-z0-9]/gi, '_')}.json`
    link.click()
    toast(ui.toastExiSaved, 'ok')
  }

  useTopbarActions(
    <>
      <button className="btn btn-ghost btn-sm" onClick={printReport}>
        {ui.exiPrintBtn}
      </button>
      <button className="btn btn-ghost btn-sm" onClick={exportJson}>
        {ui.exiSaveBtn}
      </button>
      {canEdit && (
        <button className="btn btn-ghost btn-sm" onClick={newInterview}>
          {ui.exiNewInterviewBtn}
        </button>
      )}
      {canEdit && (
        <button className="btn btn-primary btn-sm" onClick={onEditAnswers}>
          <Icon name="edit" />
          {ui.exiEditAnswersBtn}
        </button>
      )}
    </>,
    [a, ui, canEdit],
  )

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>{ui.exiRepBadge}</h2>
          <p>
            {a.azienda || ui.analisiPageTitle}
            {meta ? ` · ${meta}` : ''}
          </p>
        </div>
      </div>

      <div className="exi-hero">
        <div className="exi-hero-label">{ui.exiHeroLabel}</div>
        <div className="exi-hero-num" style={{ color: heroTier.color }}>
          {fmt1(phcv)}
          <small>{ui.exiPointsOf10}</small>
        </div>
        <div className="exi-hero-text">{heroText}</div>
      </div>

      <div className="exi-kpi-grid">
        {KS.map((k, i) => {
          const tier = k.inverted ? exiRiskTier(k.v, lang) : exiScoreTier(k.v, lang)
          return (
            <div className="exi-kpi" key={i} style={{ borderTopColor: k.color }}>
              {/* exiK*Label strings carry a literal <br> (legacy renders them via
                  innerHTML); plain JSX text would print the tag itself. */}
              <div className="exi-kpi-l" dangerouslySetInnerHTML={{ __html: k.label }} />
              <div className="exi-kpi-v" style={{ color: tier.color }}>
                {fmt1(k.v)}
                <small>{ui.exiPointsOf10}</small>
              </div>
              <div className="exi-kpi-track">
                <div className="exi-kpi-fill" style={{ width: `${k.v * 10}%`, background: k.color }} />
              </div>
              <div className="exi-kpi-s">{k.sub}</div>
            </div>
          )
        })}
      </div>

      <div className="card exi-gapbox">
        <div className="card-title-row">
          <div className="card-title">{ui.exiGapTitle}</div>
        </div>
        <div className="exi-gap-row">
          <div className="exi-gap-lbl">{ui.exiGapLabel1}</div>
          <div className="exi-gap-track">
            <div className="exi-gap-fill" style={{ width: `${v1 * 10}%`, background: 'var(--accent)' }} />
          </div>
          <div className="exi-gap-v" style={{ color: 'var(--accent-dark)' }}>
            {fmt1(v1)}
          </div>
        </div>
        <div className="exi-gap-row">
          <div className="exi-gap-lbl">{ui.exiGapLabel2}</div>
          <div className="exi-gap-track">
            <div className="exi-gap-fill" style={{ width: `${v2 * 10}%`, background: 'var(--success)' }} />
          </div>
          <div className="exi-gap-v" style={{ color: 'var(--success)' }}>
            {fmt1(v2)}
          </div>
        </div>
        <div className="exi-gap-summary">
          <div className="exi-gap-sum-n" style={{ color: gapColor }}>
            {gap >= 0 ? '+' : ''}
            {fmt1(gap)}
          </div>
          {/* gapText (exiGapTextNegative/...) carries <strong> tags — see exi-kpi-l note above. */}
          <div className="exi-gap-sum-t" dangerouslySetInnerHTML={{ __html: gapText }} />
        </div>
      </div>

      <div className="card exi-gapbox">
        <div className="card-title-row">
          <div className="card-title">{ui.exiAreasTitle}</div>
        </div>
        {areaKeys.length ? (
          areaKeys.map((i) => {
            const v = a.aree[i]
            const c = v >= 8 ? 'var(--danger)' : v >= 6 ? 'var(--warning)' : 'var(--accent)'
            return (
              <div className="exi-gap-row" key={i}>
                <div className="exi-gap-lbl">{ui.exiAreas[Number(i)] || ''}</div>
                <div className="exi-gap-track">
                  <div className="exi-gap-fill" style={{ width: `${v * 10}%`, background: c }} />
                </div>
                <div className="exi-gap-v" style={{ color: c }}>
                  {v}
                </div>
              </div>
            )
          })
        ) : (
          <div className="small-note">{ui.exiAreasEmpty}</div>
        )}
      </div>

      <div className="card exi-ans">
        <div className="exi-ans-q">{ui.exiQ1Eyebrow}</div>
        <div className="exi-ans-t">{ui.exiAns1Title}</div>
        <div className="exi-ans-v" style={{ color: exiScoreTier(v1, lang).color }}>
          {fmt1(v1)} {ui.exiPointsOf10} — {exiScoreTier(v1, lang).label}
        </div>
        {a.q1c && <div className="exi-ans-quote">"{a.q1c}"</div>}
      </div>
      <div className="card exi-ans">
        <div className="exi-ans-q">{ui.exiQ2Eyebrow}</div>
        <div className="exi-ans-t">{ui.exiAns2Title}</div>
        <div className="exi-ans-v" style={{ color: exiScoreTier(v2, lang).color }}>
          {fmt1(v2)} {ui.exiPointsOf10} — {exiScoreTier(v2, lang).label}
        </div>
        {a.q2c && <div className="exi-ans-quote">"{a.q2c}"</div>}
      </div>
      <div className="card exi-ans">
        <div className="exi-ans-q">{ui.exiQ4Eyebrow}</div>
        <div className="exi-ans-t">{ui.exiAns4Title}</div>
        <div className="exi-ans-v" style={{ color: exiScoreTier(v4, lang).color }}>
          {fmt1(v4)} {ui.exiPointsOf10} — {exiScoreTier(v4, lang).label}
        </div>
        {a.q4c && <div className="exi-ans-quote">"{a.q4c}"</div>}
      </div>
      <div className="card exi-ans">
        <div className="exi-ans-q">{ui.exiQ5Eyebrow}</div>
        <div className="exi-ans-t">{ui.exiAns5Title}</div>
        <div className="exi-ans-v">
          {ui.exiRiskInlineLabel} <strong style={{ color: exiRiskTier(v5, lang).color }}>{fmt1(v5)} {ui.exiPointsOf10}</strong>
          {risk.length > 0 && (
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
              {risk.map((r, i) => (
                <span className="chip chip-red" key={i}>
                  {i + 1}. {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="card exi-ans">
        <div className="exi-ans-q">{ui.exiQ6Eyebrow}</div>
        <div className="exi-ans-t">{ui.exiAns6Title}</div>
        <div className="exi-ans-v">
          {ui.exiUrgencyInlineLabel} <strong style={{ color: exiScoreTier(v6, lang).color }}>{fmt1(v6)} {ui.exiPointsOf10}</strong>
          {obj.length > 0 && (
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
              {obj.map((o, i) => (
                <span className="chip chip-blue" key={i}>
                  {i + 1}. {o}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="card exi-ans">
        <div className="exi-ans-q">{ui.exiQ7Eyebrow}</div>
        <div className="exi-ans-t">{ui.exiAns7Title}</div>
        <div className="exi-ans-v">
          {(a.decisioni || []).length ? (
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {a.decisioni.map((i) =>
                ui.exiDecisions[i] ? (
                  <span className="chip chip-gold" key={i}>
                    {ui.exiDecisions[i].ic} {ui.exiDecisions[i].nm}
                  </span>
                ) : null,
              )}
            </div>
          ) : (
            <span style={{ color: 'var(--text-3)' }}>{ui.exiNoDecisions}</span>
          )}
        </div>
        {a.q7c && <div className="exi-ans-quote">"{a.q7c}"</div>}
      </div>

      <div className="exi-cta">
        <h3>{ui.exiCtaTitle}</h3>
        <p>{ui.exiCtaText}</p>
        <button
          className="btn"
          onClick={() => {
            toast(ui.exiCtaToast, 'ok')
            onStartAssessment()
          }}
        >
          {ui.exiCtaBtn}
        </button>
      </div>

      <div className="exi-footer-note" dangerouslySetInnerHTML={{ __html: ui.exiFooterNote }} />
    </div>
  )
}
