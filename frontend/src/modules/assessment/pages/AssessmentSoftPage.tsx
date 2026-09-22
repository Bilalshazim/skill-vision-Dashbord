import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { IsometricBarsChart } from '@/modules/assessment/components/Chart3D'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { Icon } from '@/modules/assessment/components/Icon'
import { SoftEvalModal } from '@/modules/assessment/components/SoftEvalModal'
import { StatTile } from '@/modules/assessment/components/StatTile'
import { SurveyLinkModal } from '@/modules/assessment/components/SurveyLinkModal'
import { useAssessment, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import { computeSoftSummary, gapInterpretation, matchCellClasses, orgWorstSoftSkills } from '@/modules/assessment/lib/calculations'
import { avg, fmt1, getBigFiveDims, getSoftClusters, getSoftSkills, initials, round1 } from '@/modules/assessment/lib/legacy-utils'

type SoftView = 'org' | 'area' | 'alfa' | 'individuale' | 'ranking' | 'match'
const BF_ORDER = ['O', 'C', 'E', 'A', 'S'] as const

// Migrated from renderSoft()/renderSoftViewBody()/renderSoft*View()
// (js/assessment.js ~6368-6625) — all 6 legacy tabs (Org/Area/Alfa/
// Individuale/Ranking/Match) plus the "Nuova valutazione" modal, completed in
// Phase 25 (Phase 24 had shipped only Org+Alfa). The Big Five 3D bar chart
// (Org and Individuale tabs) uses the ported apex-charts-3d.ts, byte-for-byte
// the same SVG-generation code as legacy's ApexCharts3D.renderIsometricBars.
//
// Each tab is a top-level component (not defined inside AssessmentSoftPage)
// so React never remounts an entire tab's subtree just because a sibling's
// state changed — a component defined inside another component gets a new
// identity on every parent render, forcing a full unmount/remount of
// whatever's inside it.
// `defaultView` lets the "Area Valutazioni" (id:'soft', evaluation entry)
// and "Risultati" (id:'soft-risultati', reporting) nav items open the same
// tab set on a different default tab, rather than duplicating all 6 tabs'
// chart/calculation logic into a second page — see
// pages/AssessmentSoftRisultatiPage.tsx.
export default function AssessmentSoftPage({ defaultView = 'org' }: { defaultView?: SoftView }) {
  const { canEdit, ui } = useAssessment()
  const [view, setView] = useState<SoftView>(defaultView)
  const [showEvalModal, setShowEvalModal] = useState(false)
  const [showSurveyLink, setShowSurveyLink] = useState(false)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null)
  const [rankSort, setRankSort] = useState<'score' | 'gap'>('score')
  const [match, setMatch] = useState<string[]>([])

  useTopbarActions(
    canEdit ? (
      <>
        <Button variant="outline" onClick={() => setShowSurveyLink(true)}>
          <Icon name="notes" />
          {ui.surveyInviaLinkTestBtn}
        </Button>
        <Button variant="default" onClick={() => setShowEvalModal(true)}>
          <Icon name="plus" />
          {ui.newEvaluation}
        </Button>
      </>
    ) : null,
    [canEdit, ui],
  )

  const tabs: { id: SoftView; label: string }[] = [
    { id: 'org', label: ui.softTabOrg },
    { id: 'area', label: ui.softTabArea },
    { id: 'alfa', label: ui.softTabAlfa },
    { id: 'individuale', label: ui.softTabIndividuale },
    { id: 'ranking', label: ui.softTabRanking },
    { id: 'match', label: ui.matchUpTo5 },
  ]

  return (
    <div>
      <div className="view-tabs">
        {tabs.map((t) => (
          <div key={t.id} className={`view-tab ${view === t.id ? 'active' : ''}`} onClick={() => setView(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {view === 'org' && <SoftOrgView />}
      {view === 'area' && <SoftAreaView onOpenDrawer={setDrawerId} />}
      {view === 'alfa' && <SoftAlfaView onOpenDrawer={setDrawerId} />}
      {view === 'individuale' && <SoftIndividualeView selectedEmp={selectedEmp} onSelectEmp={setSelectedEmp} />}
      {view === 'ranking' && <SoftRankingView sort={rankSort} onSort={setRankSort} onOpenDrawer={setDrawerId} />}
      {view === 'match' && <SoftMatchView match={match} onChangeMatch={setMatch} />}

      {showEvalModal && <SoftEvalModal onClose={() => setShowEvalModal(false)} />}
      {showSurveyLink && <SurveyLinkModal onClose={() => setShowSurveyLink(false)} />}
      {drawerId && <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} />}
    </div>
  )
}

function SoftOrgView() {
  const { state, lang, ui } = useAssessment()
  const BIGFIVE_DIMS = getBigFiveDims(lang)
  const SOFT_CLUSTERS = getSoftClusters(lang)
  const SOFT_SKILLS = getSoftSkills(lang)
  const clusterAvgs = SOFT_CLUSTERS.map((c) => {
    const items = SOFT_SKILLS.filter((s) => s.cluster === c)
    const ott = avg(state.employees.flatMap((e) => items.map((i) => (e.soft[i.id] || { ottenuto: 0 }).ottenuto)))
    const att = avg(state.employees.flatMap((e) => items.map((i) => (e.soft[i.id] || { atteso: 6 }).atteso)))
    return { cluster: c, ott: round1(ott), att: round1(att) }
  })
  const bfOrg: Record<string, number> = {}
  const bfOrgAtteso: Record<string, number> = {}
  BF_ORDER.forEach((d) => {
    const ids = SOFT_SKILLS.filter((s) => s.dim === d).map((s) => s.id)
    bfOrg[d] = round1(avg(state.employees.flatMap((e) => ids.map((id) => (e.soft[id] || { ottenuto: 0 }).ottenuto))))
    bfOrgAtteso[d] = round1(avg(state.employees.flatMap((e) => ids.map((id) => (e.soft[id] || { atteso: 6 }).atteso))))
  })
  const worst = orgWorstSoftSkills(state, lang, 8)
  return (
    <>
      <div className="grid grid-2">
        <div className="card">
          <div className="card-title-row">
            <div className="card-title">{ui.softClusterAvgTitle}</div>
          </div>
          <div className="grid grid-2" style={{ gap: 8 }}>
            {clusterAvgs.map((c) => (
              <StatTile key={c.cluster} label={c.cluster} value={c.ott} benchmark={c.att} />
            ))}
          </div>
          <div className="small-note" style={{ marginTop: 10 }}>
            {ui.softClusterAvgNote}
          </div>
        </div>
        <div className="card">
          <div className="card-title-row">
            <div className="card-title">{ui.softBigFiveOrgTitle}</div>
          </div>
          <IsometricBarsChart
            groups={BF_ORDER.map((d) => ({ label: BIGFIVE_DIMS[d].label, values: [bfOrg[d], bfOrgAtteso[d]] }))}
            seriesNames={[ui.chartObtained, ui.chartExpected]}
            seriesColors={['var(--accent)', 'var(--text-3)']}
            max={10}
            dec={1}
          />
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title-row">
          <div className="card-title">{ui.softWorstSkillsTitle}</div>
        </div>
        <div className="grid grid-3" style={{ gap: 8 }}>
          {worst.map((s) => (
            <StatTile key={s.id} label={s.name} value={s.ottenuto} benchmark={s.atteso} />
          ))}
        </div>
      </div>
    </>
  )
}

function SoftAreaView({ onOpenDrawer }: { onOpenDrawer: (id: string) => void }) {
  const { state, lang, ui } = useAssessment()
  const areas = [...new Set(state.employees.map((e) => e.area))]
  return (
    <div className="grid grid-2">
      {areas.map((area) => {
        const emps = state.employees.filter((e) => e.area === area)
        const ott = round1(avg(emps.map((e) => computeSoftSummary(e, lang).overallOttenuto)))
        return (
          <div className="card" key={area}>
            <div className="card-title-row">
              <div className="card-title">
                {area} <span className="muted">{ui.softAreaEmpCount(emps.length)}</span>
              </div>
              <span className={`chip ${ott >= 7 ? 'chip-green' : ott >= 5 ? 'chip-amber' : 'chip-red'}`} style={{ marginLeft: 'auto' }}>
                <span className="dt" />
                {fmt1(ott)}
              </span>
            </div>
            {emps.map((e) => {
              const s = computeSoftSummary(e, lang).overallOttenuto
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: '1px dashed var(--border)', cursor: 'pointer' }} onClick={() => onOpenDrawer(e.id)}>
                  <div className="avatar">{initials(e.nome, e.cognome)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {e.nome} {e.cognome}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.ruolo}</div>
                  </div>
                  <span className={`chip ${s >= 7 ? 'chip-green' : s >= 5 ? 'chip-amber' : 'chip-red'}`}>
                    <span className="dt" />
                    {fmt1(s)}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function SoftAlfaView({ onOpenDrawer }: { onOpenDrawer: (id: string) => void }) {
  const { state, lang, ui } = useAssessment()
  const list = [...state.employees].sort((a, b) => a.cognome.localeCompare(b.cognome))
  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="table-wrap">
        <table className="dtable">
          <thead>
            <tr>
              <th>{ui.softColLastName}</th>
              <th>{ui.softColFirstName}</th>
              <th>{ui.colArea}</th>
              <th>{ui.colRole}</th>
              <th>{ui.colObtained}</th>
              <th>{ui.colExpected}</th>
              <th>{ui.colGap}</th>
              <th>{ui.softColDispatchDate}</th>
              <th>{ui.softColAwaitingTest} / {ui.softColTestDone}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => {
              const s = computeSoftSummary(e, lang)
              const gi = gapInterpretation(s.gapOverall, lang)
              // "Test effettuato" = a soft evaluation was recorded at/after the
              // last dispatch; otherwise, if a link was ever sent, the test is
              // still pending. No dispatch at all shows neither status badge.
              const testDone = !!e.surveySentAt && e.softHistory.some((h) => new Date(h.date).getTime() >= new Date(e.surveySentAt!).getTime())
              return (
                <tr key={e.id} onClick={() => onOpenDrawer(e.id)}>
                  <td>
                    <b>{e.cognome}</b>
                  </td>
                  <td>{e.nome}</td>
                  <td>{e.area}</td>
                  <td>{e.ruolo}</td>
                  <td>{fmt1(s.overallOttenuto)}</td>
                  <td>{fmt1(s.overallAtteso)}</td>
                  <td>
                    <span className={`gap-tag ${gi.tag}`}>{fmt1(s.gapOverall)}</span>
                  </td>
                  <td style={{ color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{e.surveySentAt ? new Date(e.surveySentAt).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US') : '—'}</td>
                  <td>
                    {!e.surveySentAt ? (
                      <span className="chip chip-gray">
                        <span className="dt" />
                        {ui.softStatusNotSent}
                      </span>
                    ) : testDone ? (
                      <span className="chip chip-green">
                        <span className="dt" />
                        {ui.softColTestDone}
                      </span>
                    ) : (
                      <span className="chip chip-amber">
                        <span className="dt" />
                        {ui.softColAwaitingTest}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SoftIndividualeView({ selectedEmp, onSelectEmp }: { selectedEmp: string | null; onSelectEmp: (id: string) => void }) {
  const { state, lang, ui } = useAssessment()
  const BIGFIVE_DIMS = getBigFiveDims(lang)
  const SOFT_CLUSTERS = getSoftClusters(lang)
  const SOFT_SKILLS = getSoftSkills(lang)
  const emp = state.employees.find((e) => e.id === selectedEmp) || state.employees[0]
  if (!emp) {
    return (
      <div className="empty-state">
        <div className="t">{ui.noEmployeesTitle}</div>
        <div className="d">{ui.noEmployeesDesc}</div>
      </div>
    )
  }
  const ss = computeSoftSummary(emp, lang)
  const bf: Record<string, number> = {}
  const bfAtteso: Record<string, number> = {}
  BF_ORDER.forEach((d) => {
    const ids = SOFT_SKILLS.filter((s) => s.dim === d).map((s) => s.id)
    bf[d] = round1(avg(ids.map((id) => (emp.soft[id] || { ottenuto: 0 }).ottenuto)))
    bfAtteso[d] = round1(avg(ids.map((id) => (emp.soft[id] || { atteso: 6 }).atteso)))
  })
  return (
    <>
      <div className="field" style={{ maxWidth: 360, marginBottom: 16 }}>
        <label>{ui.softSelectEmployee}</label>
        <select value={emp.id} onChange={(e) => onSelectEmp(e.target.value)}>
          {state.employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.cognome} {e.nome} — {e.ruolo}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title-row">
            <div className="card-title">{ui.softBigFiveProfile}</div>
          </div>
          <IsometricBarsChart
            groups={BF_ORDER.map((d) => ({ label: BIGFIVE_DIMS[d].label, values: [bf[d], bfAtteso[d]] }))}
            seriesNames={[`${emp.nome} (${ui.chartObtained})`, ui.chartExpected]}
            seriesColors={['var(--accent)', 'var(--text-3)']}
            max={10}
            dec={1}
          />
        </div>
        <div className="card">
          <div className="card-title-row">
            <div className="card-title">{ui.softSummaryTitle}</div>
          </div>
          <div className="kpi-value">{fmt1(ss.overallOttenuto)}</div>
          <div className="kpi-label">{ui.softOverallScoreLabel(fmt1(ss.overallAtteso))}</div>
          <div className="divider" />
          <div className="grid grid-2" style={{ gap: 8 }}>
            {ss.perCluster.map((c) => (
              <StatTile key={c.cluster} label={c.cluster} value={c.ottenuto} benchmark={c.atteso} />
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-title-row">
          <div className="card-title">{ui.softAllSkillsDetail}</div>
        </div>
        {SOFT_CLUSTERS.map((c) => (
          <div className="cluster-block" key={c}>
            <div className="cluster-title">{c}</div>
            <div className="grid grid-3" style={{ gap: 8 }}>
              {ss.perSkill
                .filter((s) => s.cluster === c)
                .map((s) => (
                  <StatTile key={s.id} label={s.name} value={s.ottenuto} benchmark={s.atteso} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function SoftRankingView({ sort, onSort, onOpenDrawer }: { sort: 'score' | 'gap'; onSort: (s: 'score' | 'gap') => void; onOpenDrawer: (id: string) => void }) {
  const { state, lang, ui } = useAssessment()
  const list = state.employees.map((e) => {
    const ss = computeSoftSummary(e, lang)
    return { e, s: ss.overallOttenuto, gap: ss.gapOverall }
  })
  list.sort((a, b) => (sort === 'gap' ? b.gap - a.gap : b.s - a.s))
  return (
    <>
      <div className="segmented" style={{ marginBottom: 14 }}>
        <button className={sort === 'score' ? 'active' : ''} onClick={() => onSort('score')}>
          {ui.softSortByScore}
        </button>
        <button className={sort === 'gap' ? 'active' : ''} onClick={() => onSort('gap')}>
          {ui.softSortByGap}
        </button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="dtable">
            <thead>
              <tr>
                <th>#</th>
                <th>{ui.colEmployee}</th>
                <th>{ui.colArea}</th>
                <th>{ui.colRole}</th>
                <th>{ui.colScore}</th>
                <th>{ui.colGapVsExpected}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r, i) => (
                <tr key={r.e.id} onClick={() => onOpenDrawer(r.e.id)}>
                  <td>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar">{initials(r.e.nome, r.e.cognome)}</div>
                      <b>
                        {r.e.nome} {r.e.cognome}
                      </b>
                    </div>
                  </td>
                  <td>{r.e.area}</td>
                  <td>{r.e.ruolo}</td>
                  <td>
                    <span className={`chip ${r.s >= 7 ? 'chip-green' : r.s >= 5 ? 'chip-amber' : 'chip-red'}`}>
                      <span className="dt" />
                      {fmt1(r.s)}
                    </span>
                  </td>
                  <td>
                    <span className={`gap-tag ${gapInterpretation(r.gap, lang).tag}`}>
                      {r.gap > 0 ? '+' : ''}
                      {fmt1(r.gap)}
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

function SoftMatchView({ match, onChangeMatch }: { match: string[]; onChangeMatch: (ids: string[]) => void }) {
  const { state, lang, ui } = useAssessment()
  const SOFT_CLUSTERS = getSoftClusters(lang)
  const SOFT_SKILLS = getSoftSkills(lang)
  const emps = match.map((id) => state.employees.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => !!e)
  function add(id: string) {
    if (match.length >= 5) return
    onChangeMatch([...match, id])
  }
  function remove(id: string) {
    onChangeMatch(match.filter((x) => x !== id))
  }
  const overallVals = emps.map((e) => computeSoftSummary(e, lang).overallOttenuto)
  const overallCls = matchCellClasses(overallVals)
  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title-row">
          <div className="card-title">{ui.softSelectUpTo5}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) add(e.target.value)
            }}
            style={{ padding: '8px 12px', border: '1px solid var(--border-strong)', borderRadius: 8 }}
          >
            <option value="">{ui.softAddToComparison}</option>
            {state.employees
              .filter((e) => !match.includes(e.id))
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.cognome} {e.nome}
                </option>
              ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {emps.map((e) => (
            <span className="chip chip-blue" key={e.id}>
              {e.nome} {e.cognome} <span style={{ cursor: 'pointer', marginLeft: 4 }} onClick={() => remove(e.id)}>✕</span>
            </span>
          ))}
        </div>
      </div>
      {emps.length ? (
        <div className="card match-col" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>{ui.colCompetency}</th>
                  {emps.map((e) => (
                    <th key={e.id}>
                      {e.nome} {e.cognome[0]}.
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: 'var(--accent-soft)' }}>
                  <td>
                    <b>{ui.colOverallScore}</b>
                  </td>
                  {overallVals.map((v, i) => (
                    <td className={overallCls[i]} key={i}>
                      <b>{fmt1(v)}</b>
                    </td>
                  ))}
                </tr>
                {SOFT_CLUSTERS.map((c) => (
                  <SoftMatchClusterRows key={c} cluster={c} skills={SOFT_SKILLS.filter((s) => s.cluster === c)} emps={emps} />
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 16px', display: 'flex', gap: 16, flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
            <span className="small-note">
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', marginRight: 5 }} />
              {ui.legendHighest}
            </span>
            <span className="small-note">
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', marginRight: 5 }} />
              {ui.legendLowest}
            </span>
            <span className="small-note">
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginRight: 5 }} />
              {ui.legendAligned}
            </span>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="t">{ui.softNoEmpSelectedTitle}</div>
          <div className="d">{ui.softNoEmpSelectedDesc}</div>
        </div>
      )}
    </>
  )
}

function SoftMatchClusterRows({ cluster, skills, emps }: { cluster: string; skills: { id: string; name: string }[]; emps: { id: string; soft: Record<string, { ottenuto: number }> }[] }) {
  return (
    <>
      <tr>
        <td colSpan={emps.length + 1} style={{ background: 'var(--surface-alt)', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--accent-dark)' }}>
          {cluster}
        </td>
      </tr>
      {skills.map((s) => {
        const vals = emps.map((e) => (e.soft[s.id] || { ottenuto: 0 }).ottenuto)
        const cls = matchCellClasses(vals)
        return (
          <tr key={s.id}>
            <td>{s.name}</td>
            {vals.map((v, i) => (
              <td className={cls[i]} key={i}>
                {fmt1(v)}
              </td>
            ))}
          </tr>
        )
      })}
    </>
  )
}
