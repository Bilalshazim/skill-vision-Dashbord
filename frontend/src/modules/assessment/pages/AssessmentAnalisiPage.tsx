import { fmtDec } from '@/lib/format'
import { ArrowRight, Download, Printer, RotateCcw } from 'lucide-react'
import { useState } from 'react'

import { Note } from '@/components/patterns/Note'
import { StatCard } from '@/components/patterns/StatCard'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/patterns/PageHeader'
import { useConfirm } from '@/hooks/use-confirm'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardLabel, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/modules/assessment/components/Icon'
import { AnalisiWizard } from '@/modules/assessment/components/AnalisiWizard'
import { useAssessment, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import { exiBlankData } from '@/modules/assessment/lib/demo-data'
import { exiRiskTier, exiScoreTier, fmt1, round1 } from '@/modules/assessment/lib/legacy-utils'
import { printReportHtml } from '@/modules/assessment/lib/print'
import { useNavigate } from 'react-router-dom'
import type { ExiData } from '@/modules/assessment/lib/types'
import { assessmentAiApi } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'
import type { getUI } from '@/modules/assessment/lib/legacy-utils'

// The exact Q&A pairs sent to POST /assessment-ai/expert-review (real,
// server-side Claude call — see backend/src/modules/assessmentAi/routes.ts).
// Kept to a plain question/answer transcript rather than the raw ExiData
// shape so the prompt built server-side stays simple and doesn't need to
// know this module's internal field names.
function buildInterviewTranscript(a: ExiData, ui: ReturnType<typeof getUI>): { question: string; answer: string }[] {
  return [
    { question: ui.exiQ1Title, answer: `${a.q1}/10 — ${a.q1c}` },
    { question: ui.exiQ2Title, answer: `${a.q2}/10 — ${a.q2c}` },
    { question: ui.exiQ3Title, answer: [a.q3c, ...a.q3Altro].filter(Boolean).join('; ') },
    { question: ui.exiQ4Title, answer: `${a.q4}/10 — ${a.q4c}` },
    { question: ui.exiQ5Title, answer: [...a.rischi, a.q5 ? `${a.q5}/10` : ''].filter(Boolean).join('; ') },
    { question: ui.exiQ6Title, answer: [...a.obiettivi, a.q6 ? `${a.q6}/10` : ''].filter(Boolean).join('; ') },
    { question: ui.exiQ7Title, answer: [a.q7c, ...a.q7Altro].filter(Boolean).join('; ') },
  ].filter((qa) => qa.answer.trim().length > 0)
}

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
  const { setState, lang, ui, canEdit, toast, state } = useAssessment()
  const [confirm, confirmDialog] = useConfirm()
  const [expertReview, setExpertReview] = useState<{ status: 'idle' | 'loading' | 'done' | 'error'; text?: string }>({ status: 'idle' })

  async function requestExpertReview() {
    setExpertReview({ status: 'loading' })
    try {
      const transcript = buildInterviewTranscript(a, ui)
      const { insight } = await assessmentAiApi.expertReview(state.settings.companyName || 'Azienda', transcript)
      setExpertReview({ status: 'done', text: insight })
    } catch (err) {
      setExpertReview({ status: 'error', text: err instanceof ApiError ? err.message : 'Errore di connessione' })
    }
  }

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
    { v: v1, color: 'var(--primary)', label: ui.exiK1Label, sub: ui.exiK1Sub, inverted: false },
    { v: v2, color: 'var(--success)', label: ui.exiK2Label, sub: ui.exiK2Sub, inverted: false },
    { v: v4, color: 'var(--gold)', label: ui.exiK4Label, sub: ui.exiK4Sub, inverted: false },
    { v: v5, color: 'var(--danger)', label: ui.exiK5Label, sub: ui.exiK5Sub, inverted: true },
    { v: v6, color: 'var(--warning)', label: ui.exiK6Label, sub: ui.exiK6Sub, inverted: false },
  ]

  const gapText = gap < 0 ? ui.exiGapTextNegative(fmt1(Math.abs(gap)), fmtDec(Math.abs(gapPc))) : gap === 0 ? ui.exiGapTextZero : ui.exiGapTextPositive

  const areaKeys = Object.keys(a.aree || {}).sort((x, y) => a.aree[y] - a.aree[x])
  const risk = (a.rischi || []).filter(Boolean)
  const obj = (a.obiettivi || []).filter(Boolean)
  const meta = [a.intervistato, ui.exiRoles[a.ruolo], a.settore, a.data].filter(Boolean).join(' · ')

  async function newInterview() {
    if (!canEdit) return
    if (a.completed && !(await confirm({ title: ui.exiConfirmNew, confirmLabel: ui.exiNewInterviewConfirmBtn, cancelLabel: ui.confirmCancel, destructive: true }))) return
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
      <div style="font-size:12px;color:var(--color-neutral-600);margin-top:2px">${a.data || ''}</div>
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
      <Button variant="ghost" size="sm" onClick={printReport}>
        <Printer />
        {ui.exiPrintBtn}
      </Button>
      <Button variant="ghost" size="sm" onClick={exportJson}>
        <Download />
        {ui.exiSaveBtn}
      </Button>
      {canEdit && (
        <Button variant="ghost" size="sm" onClick={newInterview}>
          <RotateCcw />
          {ui.exiNewInterviewBtn}
        </Button>
      )}
      {canEdit && (
        <Button variant="default" size="sm" onClick={onEditAnswers}>
          <Icon name="edit" />
          {ui.exiEditAnswersBtn}
        </Button>
      )}
    </>,
    [a, ui, canEdit],
  )

  return (
    <div>
      <PageHeader title={ui.exiRepBadge} description={`${a.azienda || ui.analisiPageTitle}${meta ? ` · ${meta}` : ''}`} />

      {/* Il report, sui componenti della libreria. Il numero principale è
          l'unico riquadro in evidenza; ogni valore porta la parola della sua
          fascia (Critico … Eccellente) accanto al tono. */}
      <StatCard
        tone="accent"
        size="lg"
        className="mb-4"
        label={ui.exiHeroLabel}
        value={fmt1(phcv)}
        unit={ui.exiPointsOf10}
        note={heroText}
        delta={{ label: heroTier.label, direction: 'flat', tone: 'neutral' }}
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {KS.map((k, i) => {
          const tier = k.inverted ? exiRiskTier(k.v, lang) : exiScoreTier(k.v, lang)
          return (
            <StatCard
              key={i}
              size="sm"
              label={k.label.replace(/<br\s*\/?>/gi, ' ')}
              value={fmt1(k.v)}
              unit={ui.exiPointsOf10}
              progress={k.v * 10}
              progressTone={tier.tone === 'neutral' ? undefined : tier.tone}
              note={k.sub}
            >
              <Badge tone={tier.tone} className="self-start">
                {tier.label}
              </Badge>
            </StatCard>
          )
        })}
      </div>

      {/* Domanda centrale e aree critiche affiancate: due riepiloghi brevi
          (CLAUDE.md, Fase 6 — impaginazione). */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{ui.exiGapTitle}</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3">
            <ScoreRow label={ui.exiGapLabel1} value={v1} />
            <ScoreRow label={ui.exiGapLabel2} value={v2} />
          </div>
          <StatCard
            className="mt-4"
            surface="none"
            label={ui.exiGapDeltaLabel}
            value={`${gap >= 0 ? '+' : ''}${fmt1(gap)}`}
          >
            {/* gapText (exiGapText*) porta tag <strong>: viene dal dizionario. */}
            <Note as="div" dangerouslySetInnerHTML={{ __html: gapText }} />
          </StatCard>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{ui.exiAreasTitle}</CardTitle>
          </CardHeader>
          {areaKeys.length ? (
            <div className="flex flex-col gap-3">
              {areaKeys.map((i) => {
                const v = a.aree[i]
                return <ScoreRow key={i} label={ui.exiAreas[Number(i)] || ''} value={v} tone={v >= 8 ? 'destructive' : v >= 6 ? 'warning' : undefined} format={(n) => String(n)} />
              })}
            </div>
          ) : (
            <Note>{ui.exiAreasEmpty}</Note>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnswerCard eyebrow={ui.exiQ1Eyebrow} title={ui.exiAns1Title} quote={a.q1c}>
          <TierValue value={v1} tier={exiScoreTier(v1, lang)} unit={ui.exiPointsOf10} />
        </AnswerCard>
        <AnswerCard eyebrow={ui.exiQ2Eyebrow} title={ui.exiAns2Title} quote={a.q2c}>
          <TierValue value={v2} tier={exiScoreTier(v2, lang)} unit={ui.exiPointsOf10} />
        </AnswerCard>
        <AnswerCard eyebrow={ui.exiQ4Eyebrow} title={ui.exiAns4Title} quote={a.q4c}>
          <TierValue value={v4} tier={exiScoreTier(v4, lang)} unit={ui.exiPointsOf10} />
        </AnswerCard>
        <AnswerCard eyebrow={ui.exiQ5Eyebrow} title={ui.exiAns5Title}>
          <TierValue prefix={ui.exiRiskInlineLabel} value={v5} tier={exiRiskTier(v5, lang)} unit={ui.exiPointsOf10} />
          {risk.length > 0 && (
            <ol className="mt-3 list-decimal pl-5 text-app-small">
              {risk.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          )}
        </AnswerCard>
        <AnswerCard eyebrow={ui.exiQ6Eyebrow} title={ui.exiAns6Title}>
          <TierValue prefix={ui.exiUrgencyInlineLabel} value={v6} tier={exiScoreTier(v6, lang)} unit={ui.exiPointsOf10} />
          {obj.length > 0 && (
            <ol className="mt-3 list-decimal pl-5 text-app-small">
              {obj.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ol>
          )}
        </AnswerCard>
        <AnswerCard eyebrow={ui.exiQ7Eyebrow} title={ui.exiAns7Title} quote={a.q7c}>
          {(a.decisioni || []).length ? (
            <div className="flex flex-wrap gap-2">
              {a.decisioni.map((i) => (ui.exiDecisions[i] ? <Badge key={i}>{ui.exiDecisions[i].nm}</Badge> : null))}
            </div>
          ) : (
            <Note>{ui.exiNoDecisions}</Note>
          )}
        </AnswerCard>
      </div>

      <Card padding="lg" className="my-6 items-center text-center">
        <CardTitle>{ui.exiCtaTitle}</CardTitle>
        <CardDescription className="mt-2 max-w-prose">{ui.exiCtaText}</CardDescription>
        <Button
          className="mt-4"
          onClick={() => {
            toast(ui.exiCtaToast, 'ok')
            onStartAssessment()
          }}
        >
          {ui.exiCtaBtn}
          <ArrowRight />
        </Button>
      </Card>

      {/* "CONSIDERAZIONI DELL'ESPERTO" — a real, server-side Claude call
          (backend/src/modules/assessmentAi/routes.ts) reviewing this exact
          interview's answers, for the consultant to read with the client.
          Distinct from the fully-local "Assistenza AI" page/canned Q&A
          (AssessmentAiPage.tsx) — this is genuine generative text, so it
          can be slow/fail (network, quota), unlike that page's instant
          local answers. */}
      <Card className="mt-4">
        <Button variant="outline" className="self-start" onClick={requestExpertReview} disabled={expertReview.status === 'loading'}>
          <Icon name="sparkles" />
          {expertReview.status === 'loading' ? ui.exiExpertReviewLoading : ui.exiExpertReviewBtn}
        </Button>
        {expertReview.status === 'done' && (
          <p className="mt-3 max-w-prose whitespace-pre-wrap text-app-body">{expertReview.text}</p>
        )}
        {expertReview.status === 'error' && (
          <p className="mt-3 text-destructive" role="alert" >
            {expertReview.text}
          </p>
        )}
      </Card>

      <Note as="div" size="caption" className="mt-6 text-center" dangerouslySetInnerHTML={{ __html: ui.exiFooterNote }} />
      {confirmDialog}
    </div>
  )
}

// Un valore su 10 come barra con l'etichetta a sinistra e il numero a
// destra (percezione / utilizzo, criticità delle aree).
function ScoreRow({ label, value, tone, format = fmt1 }: { label: string; value: number; tone?: 'warning' | 'destructive'; format?: (n: number) => string }) {
  return (
    <div className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3">
      <span className="text-app-small text-muted-foreground">{label}</span>
      <Progress value={value * 10} tone={tone ?? 'primary'} aria-label={label} />
      <span className="text-app-subtitle tabular-nums">{format(value)}</span>
    </div>
  )
}

// Il valore di una risposta con la parola della sua fascia accanto.
function TierValue({ prefix, value, tier, unit }: { prefix?: string; value: number; tier: { label: string; tone: 'success' | 'warning' | 'destructive' | 'neutral' }; unit: string }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-app-body">
      {prefix ? <span className="text-muted-foreground">{prefix}</span> : null}
      <span className="font-medium tabular-nums">
        {fmt1(value)} {unit}
      </span>
      <Badge tone={tier.tone} dot>
        {tier.label}
      </Badge>
    </p>
  )
}

// Una risposta dell'Intervista nel report: sovratitolo, domanda, valore,
// e il commento citato dell'intervistato se c'è.
function AnswerCard({ eyebrow, title, quote, children }: { eyebrow: string; title: string; quote?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardLabel>{eyebrow}</CardLabel>
      <CardTitle className="mt-1 mb-3 text-app-subtitle">{title}</CardTitle>
      {children}
      {quote ? <blockquote className="mt-3 border-l-2 border-border-strong pl-3 text-app-small text-muted-foreground italic">“{quote}”</blockquote> : null}
    </Card>
  )
}
