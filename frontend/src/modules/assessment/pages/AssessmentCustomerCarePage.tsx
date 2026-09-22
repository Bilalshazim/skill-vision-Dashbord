import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { Icon } from '@/modules/assessment/components/Icon'
import { useAssessment, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import { avg, fmt1, getSoftSkills, round1 } from '@/modules/assessment/lib/legacy-utils'
import type { Employee } from '@/modules/assessment/lib/types'
import { CustomerCareTrendChart } from '@/modules/assessment/components/CustomerCareCharts'
import { CapsuleBarsChart } from '@/modules/assessment/components/Chart3D'

const CC_COMPETENCY_IDS = ['so2', 'so3', 'in1', 'ps8', 'ps2']
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

// Ported verbatim from ccHashId()/customerCareModel() (js/assessment.js
// ~7602-7690) — a seeded-per-agent demo model (ticket volume, FRT, CSAT,
// resolution %, and the 5 Customer Care competencies), same formulas, same
// deterministic seed per agent id. Legacy's own explicit UI.ccDemoNote
// already tells the user this view is illustrative/demo data, not live
// support-desk data.
function ccHashId(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function seedRandom(seed: number) {
  let t = seed
  return function () {
    t |= 0
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function ccGapTag(obtained: number, expected: number): 'gap-ok' | 'gap-warn' | 'gap-bad' {
  const g = obtained - expected
  if (g >= -0.3) return 'gap-ok'
  if (g >= -1.5) return 'gap-warn'
  return 'gap-bad'
}
function ccChipClass(obtained: number, expected: number): string {
  const t = ccGapTag(obtained, expected)
  return t === 'gap-ok' ? 'chip-green' : t === 'gap-warn' ? 'chip-amber' : 'chip-red'
}
function ccDeltaBadge(cur: number, prev: number, opts: { eps?: number; lowerIsBetter?: boolean; dec?: number; unit?: string; label?: string } = {}) {
  const d = round1(cur - prev)
  const cls = Math.abs(d) < (opts.eps ?? 0.05) ? 'flat' : (opts.lowerIsBetter ? d < 0 : d > 0) ? 'up' : 'down'
  const arrow = cls === 'flat' ? '→' : d > 0 ? '▲' : '▼'
  const mag = Math.abs(d).toFixed(opts.dec == null ? 1 : opts.dec) + (opts.unit || '')
  return { cls, arrow, mag }
}

function customerCareModel(employees: Employee[], ui: { ccWeekPrefix: string }) {
  let agents = employees.filter((e) => e.area === 'Customer Service')
  if (agents.length < 2) agents = [...employees].slice(0, 6)
  agents = [...agents].sort((a, b) => a.cognome.localeCompare(b.cognome))

  const rows = agents.map((a) => {
    const r = seedRandom(ccHashId(a.id))
    const tickets = Math.round(60 + r() * 170)
    const frt = round1(6 + r() * 30)
    const frtPrev = round1(clamp(frt + (r() * 8 - 3.2), 4, 48))
    const csat = Math.round(clamp(78 + r() * 20, 60, 100))
    const csatPrev = Math.round(clamp(csat + (r() * 10 - 5.5), 60, 100))
    const resolution = Math.round(clamp(84 + r() * 14, 70, 100))
    const comps = CC_COMPETENCY_IDS.map((id) => {
      const s = (a.soft && a.soft[id]) || { ottenuto: round1(5 + r() * 3.4), atteso: 7 }
      return { id, ottenuto: round1(s.ottenuto || 0), atteso: round1(s.atteso || 7) }
    })
    const compOtt = round1(avg(comps.map((c) => c.ottenuto)))
    const compAtt = round1(avg(comps.map((c) => c.atteso)))
    const matchPct = Math.round(clamp(compAtt ? (compOtt / compAtt) * 100 : 0, 0, 145))
    return { emp: a, tickets, frt, frtPrev, csat, csatPrev, resolution, comps, compOtt, compAtt, matchPct }
  })

  const org = {
    frt: round1(avg(rows.map((r) => r.frt))),
    frtPrev: round1(avg(rows.map((r) => r.frtPrev))),
    csat: round1(avg(rows.map((r) => r.csat))),
    csatPrev: round1(avg(rows.map((r) => r.csatPrev))),
    volume: rows.reduce((s, r) => s + r.tickets, 0),
    match: round1(avg(rows.map((r) => r.matchPct))),
  }

  const tr = seedRandom(ccHashId('cc-trend-v1'))
  const weeks: string[] = []
  const csatSeries: number[] = []
  const resolvedSeries: number[] = []
  let csatWalk = org.csat - 3.5
  const weeklyBase = org.volume / 4
  for (let i = 0; i < 8; i++) {
    weeks.push(`${ui.ccWeekPrefix} ${i + 1}`)
    csatWalk = clamp(csatWalk + (tr() * 2.6 - 1.0), 70, 99)
    csatSeries.push(round1(csatWalk))
    resolvedSeries.push(Math.round(weeklyBase * (0.82 + tr() * 0.3)))
  }

  return { rows, org, weeks, csatSeries, resolvedSeries }
}

function exportCustomerCareCsv(model: ReturnType<typeof customerCareModel>, competencyName: (id: string) => string) {
  const head = ['Agent', 'Ruolo', 'Ticket', 'FRT_min', 'CSAT_%', 'Resolution_%', 'Match_%', ...CC_COMPETENCY_IDS.map(competencyName)]
  let csv = head.join(';') + '\n'
  model.rows.forEach((r) => {
    csv += [`${r.emp.cognome} ${r.emp.nome}`, r.emp.ruolo, r.tickets, fmt1(r.frt), Math.round(r.csat), Math.round(r.resolution), r.matchPct, ...r.comps.map((c) => fmt1(c.ottenuto))].join(';') + '\n'
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'customer_care_logic.csv'
  a.click()
  URL.revokeObjectURL(url)
}

type CCView = 'overview' | 'agents' | 'matrix'

// Migrated from renderCustomerCare()/renderCustomerCareOverview()/
// renderCustomerCareAgents()/renderCustomerCareMatrix()/exportCustomerCareCsv()
// (js/assessment.js ~7692-7879) — the full 3-tab split (Phase 24 had shipped
// one consolidated view), completed in Phase 25: Overview's 4 KPI cards +
// weekly CSAT/resolved-tickets trend chart, Agents' capsule-bar chart +
// per-competency table, Matrix's per-competency strong/weak breakdown cards,
// and the "Esporta CSV" topbar action.
export default function AssessmentCustomerCarePage() {
  const { state, lang, ui } = useAssessment()
  const [view, setView] = useState<CCView>('overview')
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const SOFT_SKILLS = getSoftSkills(lang)
  const competencyName = (id: string) => SOFT_SKILLS.find((s) => s.id === id)?.name || id
  const model = useMemo(() => customerCareModel(state.employees, ui), [state.employees, ui])

  useTopbarActions(
    <Button variant="outline" size="sm" onClick={() => exportCustomerCareCsv(model, competencyName)}>
      <Icon name="download" />
      {ui.ccExportCsv}
    </Button>,
    [model, ui],
  )

  if (!model.rows.length) {
    return (
      <div className="empty-state">
        <div className="t">{ui.ccNoAgentsTitle}</div>
        <div className="d">{ui.ccNoAgentsDesc}</div>
      </div>
    )
  }

  const tabs: { id: CCView; label: string }[] = [
    { id: 'overview', label: ui.ccTabOverview },
    { id: 'agents', label: ui.ccTabAgents },
    { id: 'matrix', label: ui.ccTabMatrix },
  ]

  return (
    <div>
      <div className="section-head">
        <div>
          <div className="card-eyebrow">{ui.ccEyebrow}</div>
          <h2>{ui.ccPageTitle}</h2>
          <p>{ui.ccPageSub}</p>
        </div>
      </div>
      <div className="view-tabs">
        {tabs.map((t) => (
          <div key={t.id} className={`view-tab ${view === t.id ? 'active' : ''}`} onClick={() => setView(t.id)}>
            {t.label}
          </div>
        ))}
      </div>
      <div className="small-note" style={{ marginBottom: 14 }}>
        {ui.ccDemoNote}
      </div>

      {view === 'overview' && <CCOverview model={model} onOpenDrawer={setDrawerId} />}
      {view === 'agents' && <CCAgents model={model} competencyName={competencyName} onOpenDrawer={setDrawerId} />}
      {view === 'matrix' && <CCMatrix model={model} competencyName={competencyName} onOpenDrawer={setDrawerId} />}

      {drawerId && <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} />}
    </div>
  )
}

function DeltaBadge({ cur, prev, opts }: { cur: number; prev: number; opts?: { eps?: number; lowerIsBetter?: boolean; dec?: number; unit?: string; label?: string } }) {
  const { ui } = useAssessment()
  const { cls, arrow, mag } = ccDeltaBadge(cur, prev, opts)
  return (
    <div className={`kpi-delta ${cls}`}>
      {arrow} {mag} {opts?.label || ui.ccDeltaVsPrev}
    </div>
  )
}

function CCOverview({ model, onOpenDrawer }: { model: ReturnType<typeof customerCareModel>; onOpenDrawer: (id: string) => void }) {
  const { ui } = useAssessment()
  const o = model.org
  return (
    <>
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-eyebrow">{ui.ccKpiFrt}</div>
          <div className="kpi-value">
            {fmt1(o.frt)}
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-3)' }}>{ui.ccUnitMin}</span>
          </div>
          <div className="kpi-label">{ui.ccKpiFrtSub}</div>
          <DeltaBadge cur={o.frt} prev={o.frtPrev} opts={{ lowerIsBetter: true, unit: ui.ccUnitMin }} />
        </div>
        <div className="card">
          <div className="card-eyebrow">{ui.ccKpiCsat}</div>
          <div className="kpi-value">
            {Math.round(o.csat)}
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-3)' }}>%</span>
          </div>
          <div className="kpi-label">{ui.ccKpiCsatSub}</div>
          <DeltaBadge cur={o.csat} prev={o.csatPrev} opts={{ unit: '%', dec: 0 }} />
        </div>
        <div className="card">
          <div className="card-eyebrow">{ui.ccKpiVolume}</div>
          <div className="kpi-value">{o.volume.toLocaleString('it-IT')}</div>
          <div className="kpi-label">{ui.ccKpiVolumeSub}</div>
          <div className="kpi-delta flat">{model.rows.length} agent</div>
        </div>
        <div className="card">
          <div className="card-eyebrow">{ui.ccKpiMatch}</div>
          <div className="kpi-value">
            {Math.round(o.match)}
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-3)' }}>%</span>
          </div>
          <div className="kpi-label">{ui.ccKpiMatchSub}</div>
          <DeltaBadge cur={o.match} prev={100} opts={{ unit: '%', dec: 0, label: ui.ccDeltaVsTarget }} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title-row">
          <div className="card-title">{ui.ccTrendTitle}</div>
        </div>
        <div style={{ position: 'relative', height: 320 }}>
          <CustomerCareTrendChart weeks={model.weeks} csatSeries={model.csatSeries} resolvedSeries={model.resolvedSeries} csatLabel={ui.ccTrendCsat} resolvedLabel={ui.ccTrendResolved} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="card-title-row" style={{ padding: '16px 20px 0 20px' }}>
          <div className="card-title">{ui.ccAgentTableTitle}</div>
        </div>
        <div className="table-wrap">
          <table className="dtable">
            <thead>
              <tr>
                <th>#</th>
                <th>{ui.ccColAgent}</th>
                <th>{ui.colRole}</th>
                <th>{ui.ccColTickets}</th>
                <th>{ui.ccColFrt}</th>
                <th>{ui.ccColCsat}</th>
                <th>{ui.ccColResolution}</th>
                <th>{ui.ccColMatch}</th>
              </tr>
            </thead>
            <tbody>
              {model.rows.map((r, i) => (
                <tr key={r.emp.id} onClick={() => onOpenDrawer(r.emp.id)}>
                  <td>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar">{(r.emp.nome[0] || '') + (r.emp.cognome[0] || '')}</div>
                      <b>
                        {r.emp.nome} {r.emp.cognome}
                      </b>
                    </div>
                  </td>
                  <td>{r.emp.ruolo}</td>
                  <td>{r.tickets}</td>
                  <td>
                    {fmt1(r.frt)}
                    {ui.ccUnitMin}
                  </td>
                  <td>
                    <span className={`chip ${r.csat >= 90 ? 'chip-green' : r.csat >= 80 ? 'chip-amber' : 'chip-red'}`}>
                      <span className="dt" />
                      {Math.round(r.csat)}%
                    </span>
                  </td>
                  <td>{Math.round(r.resolution)}%</td>
                  <td>
                    <span className={`gap-tag ${ccGapTag(r.compOtt, r.compAtt)}`}>{r.matchPct}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function CCAgents({ model, competencyName, onOpenDrawer }: { model: ReturnType<typeof customerCareModel>; competencyName: (id: string) => string; onOpenDrawer: (id: string) => void }) {
  const { ui } = useAssessment()
  const compNames = CC_COMPETENCY_IDS.map(competencyName)
  const capsuleColor: Record<string, string> = { 'gap-ok': 'var(--success)', 'gap-warn': 'var(--warning)', 'gap-bad': 'var(--danger)' }
  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title-row">
          <div className="card-title">{ui.ccAgentsChartTitle}</div>
        </div>
        <CapsuleBarsChart
          items={model.rows.map((r) => ({ label: `${r.emp.cognome} ${(r.emp.nome || ' ')[0]}.`, value: r.compOtt, target: r.compAtt, color: capsuleColor[ccGapTag(r.compOtt, r.compAtt)] }))}
          max={10}
          unit=""
          dec={1}
        />
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="card-title-row" style={{ padding: '16px 20px 0 20px' }}>
          <div className="card-title">
            {ui.ccTabAgents} <span className="muted">{ui.ccMatrixSub}</span>
          </div>
        </div>
        <div className="table-wrap">
          <table className="dtable">
            <thead>
              <tr>
                <th>{ui.ccColAgent}</th>
                <th>{ui.colRole}</th>
                {compNames.map((n) => (
                  <th key={n}>{n}</th>
                ))}
                <th>{ui.ccColOverall}</th>
              </tr>
            </thead>
            <tbody>
              {model.rows.map((r) => (
                <tr key={r.emp.id} onClick={() => onOpenDrawer(r.emp.id)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar">{(r.emp.nome[0] || '') + (r.emp.cognome[0] || '')}</div>
                      <b>
                        {r.emp.nome} {r.emp.cognome}
                      </b>
                    </div>
                  </td>
                  <td>{r.emp.ruolo}</td>
                  {r.comps.map((c) => (
                    <td key={c.id}>
                      <span className={`gap-tag ${ccGapTag(c.ottenuto, c.atteso)}`}>{fmt1(c.ottenuto)}</span>
                    </td>
                  ))}
                  <td>
                    <span className={`chip ${r.compOtt >= 7 ? 'chip-green' : r.compOtt >= 5 ? 'chip-amber' : 'chip-red'}`}>
                      <span className="dt" />
                      {fmt1(r.compOtt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function CCMatrix({ model, competencyName, onOpenDrawer }: { model: ReturnType<typeof customerCareModel>; competencyName: (id: string) => string; onOpenDrawer: (id: string) => void }) {
  const { ui } = useAssessment()
  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          {ui.ccMatrixTitle} <span className="muted">{ui.ccMatrixSub}</span>
        </div>
        <div className="small-note" style={{ marginTop: 6 }}>
          {ui.ccMatrixNote}
        </div>
      </div>
      <div className="grid grid-2">
        {CC_COMPETENCY_IDS.map((id) => {
          const scored = model.rows
            .map((r) => {
              const c = r.comps.find((x) => x.id === id)!
              return { emp: r.emp, ott: c.ottenuto, att: c.atteso }
            })
            .sort((a, b) => b.ott - a.ott)
          const ott = round1(avg(scored.map((s) => s.ott)))
          const att = round1(avg(scored.map((s) => s.att)))
          const strong = scored.filter((s) => s.ott >= 8).length
          const weak = scored.filter((s) => s.ott < 6).length
          return (
            <div className="card" key={id}>
              <div className="card-title-row">
                <div className="card-title">{competencyName(id)}</div>
                <span className={`chip ${ott >= 7 ? 'chip-green' : ott >= 5 ? 'chip-amber' : 'chip-red'}`} style={{ marginLeft: 'auto' }}>
                  <span className="dt" />
                  {fmt1(ott)}
                </span>
              </div>
              <div className="legend-row" style={{ marginBottom: 8 }}>
                <span className="legend-dot">
                  <i style={{ background: 'var(--success)' }} />
                  {ui.ccMatrixStrong}: {strong}
                </span>
                <span className="legend-dot">
                  <i style={{ background: 'var(--danger)' }} />
                  {ui.ccMatrixToDevelop}: {weak}
                </span>
                <span className="legend-dot" style={{ marginLeft: 'auto' }}>
                  {ui.ccMatrixColOrgAvg}: <b>{fmt1(ott)}</b> / {fmt1(att)}
                </span>
              </div>
              {scored.map((s) => (
                <div key={s.emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: '1px dashed var(--border)', cursor: 'pointer' }} onClick={() => onOpenDrawer(s.emp.id)}>
                  <div className="avatar">{(s.emp.nome[0] || '') + (s.emp.cognome[0] || '')}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.emp.nome} {s.emp.cognome}
                    </div>
                  </div>
                  <span className={`chip ${ccChipClass(s.ott, s.att)}`}>
                    <span className="dt" />
                    {fmt1(s.ott)}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}
