import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { IsometricBarsChart } from '@/modules/assessment/components/Chart3D'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { EvaluationManagerModal } from '@/modules/assessment/components/EvaluationManagerModal'
import { HardEvalModal } from '@/modules/assessment/components/HardEvalModal'
import { Icon } from '@/modules/assessment/components/Icon'
import { StatTile } from '@/modules/assessment/components/StatTile'
import { useAssessment, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import { computeHardSummary, gapInterpretation, matchCellClasses } from '@/modules/assessment/lib/calculations'
import { avg, fmt1, getApex5dDimensions, initials, levelFor, round1 } from '@/modules/assessment/lib/legacy-utils'

type HardView = 'individuale' | 'area' | 'ranking' | 'match'

// Migrated from renderHard()/renderHardViewBody()/renderHard*View()
// (js/assessment.js ~6961-7358) — all 4 legacy tabs plus the evaluators
// panel, "Gestione Valutatori" (Evaluation Manager) modal, and the direct
// admin "Nuova valutazione" modal, completed in Phase 25 (Phase 24 had
// shipped only a simplified Individuale table). The Evaluation Manager is
// what actually creates real ?evalToken= assignments, so this page is also
// what makes /assessment/evaluate testable end-to-end with real data.
// `defaultView` lets "Area Valutazioni" (id:'hard', evaluation entry) and
// "Risultati" (id:'hard-risultati', reporting) open the same tab set on a
// different default tab — see pages/AssessmentHardRisultatiPage.tsx.
export default function AssessmentHardPage({ defaultView = 'individuale' }: { defaultView?: HardView }) {
  const { state, setState, ui, canEdit, toast } = useAssessment()
  const [view, setView] = useState<HardView>(defaultView)
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null)
  const [rankSort, setRankSort] = useState<'score' | 'gap'>('score')
  const [match, setMatch] = useState<string[]>([])
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [showEvalModal, setShowEvalModal] = useState(false)
  const [showManagerModal, setShowManagerModal] = useState(false)
  const [newEvaluatorName, setNewEvaluatorName] = useState('')

  useTopbarActions(
    canEdit ? (
      <>
        <Button variant="outline" size="sm" onClick={() => setShowManagerModal(true)}>
          <Icon name="userGear" />
          {ui.evalManagerBtn}
        </Button>
        <Button variant="default" onClick={() => setShowEvalModal(true)}>
          <Icon name="plus" />
          {ui.newEvaluation}
        </Button>
      </>
    ) : null,
    [canEdit, ui],
  )

  function addEvaluator() {
    const name = newEvaluatorName.trim()
    if (!name) {
      toast(ui.toastEnterEvaluatorName, 'err')
      return
    }
    if (state.evaluators.some((n) => n.toLowerCase() === name.toLowerCase())) {
      toast(ui.toastEvaluatorExists, 'err')
      return
    }
    setState((prev) => ({ ...prev, evaluators: [...prev.evaluators, name] }))
    setNewEvaluatorName('')
    toast(ui.toastEvaluatorAdded, 'ok')
  }
  function removeEvaluator(i: number) {
    const name = state.evaluators[i]
    if (!window.confirm(ui.confirmRemoveEvaluator(name))) return
    setState((prev) => ({ ...prev, evaluators: prev.evaluators.filter((_, idx) => idx !== i) }))
    toast(ui.toastEvaluatorRemoved, 'ok')
  }

  const tabs: { id: HardView; label: string }[] = [
    { id: 'individuale', label: ui.softTabIndividuale },
    { id: 'area', label: ui.softTabArea },
    { id: 'ranking', label: ui.softTabRanking },
    { id: 'match', label: ui.matchUpTo5 },
  ]

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title-row">
          <div className="card-title">{ui.evaluatorsTitle}</div>
        </div>
        <div className="small-note" style={{ marginBottom: 10 }}>
          {ui.evaluatorsHint}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: canEdit ? 12 : 0 }}>
          {state.evaluators.length ? (
            state.evaluators.map((name, i) => (
              <span className="chip chip-gray" style={{ gap: 7 }} key={name + i}>
                {name}
                {canEdit && (
                  <span style={{ cursor: 'pointer', fontWeight: 800 }} onClick={() => removeEvaluator(i)} title={ui.removeEvaluator}>
                    ✕
                  </span>
                )}
              </span>
            ))
          ) : (
            <span className="small-note">{ui.noEvaluators}</span>
          )}
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
              <label>{ui.newEvaluatorName}</label>
              <input type="text" placeholder={ui.evaluatorNameExamplePh} value={newEvaluatorName} onChange={(e) => setNewEvaluatorName(e.target.value)} />
            </div>
            <Button variant="default" size="sm" onClick={addEvaluator}>
              <Icon name="plus" />
              {ui.addEvaluator}
            </Button>
          </div>
        )}
      </div>

      <div className="view-tabs">
        {tabs.map((t) => (
          <div key={t.id} className={`view-tab ${view === t.id ? 'active' : ''}`} onClick={() => setView(t.id)}>
            {t.label}
          </div>
        ))}
      </div>
      <div className="small-note" style={{ marginBottom: 14 }}>
        <b>APEX 5D™ Protocol</b> — SKILL-VISION S.r.l. · {ui.hardProtocolNote}
      </div>

      {view === 'individuale' && <HardIndividualeView selectedEmp={selectedEmp} onSelectEmp={setSelectedEmp} />}
      {view === 'area' && <HardAreaView />}
      {view === 'ranking' && <HardRankingView sort={rankSort} onSort={setRankSort} onOpenDrawer={setDrawerId} />}
      {view === 'match' && <HardMatchView match={match} onChangeMatch={setMatch} />}

      {showEvalModal && <HardEvalModal onClose={() => setShowEvalModal(false)} />}
      {showManagerModal && <EvaluationManagerModal onClose={() => setShowManagerModal(false)} />}
      {drawerId && <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} />}
    </div>
  )
}

function HardIndividualeView({ selectedEmp, onSelectEmp }: { selectedEmp: string | null; onSelectEmp: (id: string) => void }) {
  const { state, lang, ui } = useAssessment()
  const emp = state.employees.find((e) => e.id === selectedEmp) || state.employees[0]
  if (!emp) {
    return (
      <div className="empty-state">
        <div className="t">{ui.noEmployeesTitle}</div>
        <div className="d">{ui.noEmployeesDesc}</div>
      </div>
    )
  }
  const hsm = computeHardSummary(emp, lang)
  const evalBy = emp.hardEvaluatedBy || { resp: '', peer: '', auto: '' }
  const evalByLine = [evalBy.resp ? `${ui.evalByManagerPrefix}: ${evalBy.resp}` : '', evalBy.peer ? `${ui.evalByPeerPrefix}: ${evalBy.peer}` : '', evalBy.auto ? `${ui.evalBySelfPrefix}: ${evalBy.auto}` : ''].filter(Boolean).join(' · ')

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
      {evalByLine && (
        <div className="small-note" style={{ marginBottom: 12 }}>
          <b>{ui.evaluatedByPrefix}:</b> {evalByLine}
        </div>
      )}
      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title-row">
            <div className="card-title">{ui.hardMultiSourceTitle}</div>
          </div>
          {/* Manager/Peer/Self are rating sources, not a severity signal — was
              lime for Manager; charts stay off lime, so it uses the app's
              designated multi-series categorical hue instead. */}
          <IsometricBarsChart
            groups={hsm.dims.map((d) => ({ label: d.code, values: [d.perSource.resp, d.perSource.peer, d.perSource.auto], target: 6.5 }))}
            seriesNames={[ui.hardColManager, ui.hardColPeer, ui.hardColSelf]}
            seriesColors={['var(--chart-2)', 'rgba(171,167,154,0.9)', 'var(--warning)']}
            max={10}
            dec={1}
          />
        </div>
        <div className="card">
          <div className="card-title-row">
            <div className="card-title">{ui.hardApex5dProfile}</div>
          </div>
          <div className="kpi-value">{fmt1(hsm.apexScore)}</div>
          <div className="kpi-label">{ui.hardOverallApexLabel}</div>
          <div className="divider" />
          <div className="grid grid-2" style={{ gap: 8 }}>
            {hsm.dims.map((d) => (
              <StatTile key={d.code} label={`${d.code} · ${d.name}`} value={d.mediaTotale} benchmark={6.5} />
            ))}
          </div>
        </div>
      </div>
      <div className="card" style={{ padding: 0, marginBottom: 16 }}>
        <div className="table-wrap">
          <table className="dtable">
            <thead>
              <tr>
                <th>{ui.hardColDimension}</th>
                <th>{ui.hardColManager}</th>
                <th>{ui.hardColPeer}</th>
                <th>{ui.hardColSelf}</th>
                <th>{ui.hardColOverallAvg}</th>
                <th>{ui.hardColLevel}</th>
              </tr>
            </thead>
            <tbody>
              {hsm.dims.map((d) => {
                const lvl = levelFor(d.mediaTotale, lang)
                return (
                  <tr key={d.code}>
                    <td>
                      <b>{d.code}</b> · {d.name}
                    </td>
                    <td>{fmt1(d.perSource.resp)}</td>
                    <td>{fmt1(d.perSource.peer)}</td>
                    <td>{fmt1(d.perSource.auto)}</td>
                    <td>
                      <b>{fmt1(d.mediaTotale)}</b>
                    </td>
                    <td>
                      <span className="chip" style={{ background: `${lvl.color}22`, color: lvl.color }}>
                        <span className="dt" style={{ background: lvl.color }} />
                        {lvl.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
              <tr style={{ background: 'var(--accent-soft)' }}>
                <td>
                  <b>◆ {ui.hardApexScoreRow}</b>
                </td>
                <td colSpan={3} />
                <td>
                  <b>{fmt1(hsm.apexScore)}</b>
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title-row">
          <div className="card-title">{ui.hardGapAnalysisTitle}</div>
        </div>
        <div className="table-wrap">
          <table className="dtable">
            <thead>
              <tr>
                <th>{ui.colDimension}</th>
                <th>{ui.hardColGapMgrSelf}</th>
                <th>{ui.hardColGapPeerSelf}</th>
                <th>{ui.hardColGapMgrPeer}</th>
                <th>{ui.hardColInterpretation}</th>
              </tr>
            </thead>
            <tbody>
              {hsm.dims.map((d) => {
                const gi = gapInterpretation(d.gapRespAuto, lang)
                return (
                  <tr key={d.code}>
                    <td>
                      {d.code} · {d.name}
                    </td>
                    <td>{fmt1(d.gapRespAuto)}</td>
                    <td>{fmt1(d.gapPeerAuto)}</td>
                    <td>{fmt1(d.gapRespPeer)}</td>
                    <td>
                      <span className={`gap-tag ${gi.tag}`}>{gi.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function HardAreaView() {
  const { state, lang, ui } = useAssessment()
  const APEX5D_DIMENSIONS = getApex5dDimensions(lang)
  const areas = [...new Set(state.employees.map((e) => e.area))]
  return (
    <div className="grid grid-2">
      {areas.map((area) => {
        const emps = state.employees.filter((e) => e.area === area)
        const apex = round1(avg(emps.map((e) => computeHardSummary(e, lang).apexScore)))
        return (
          <div className="card" key={area}>
            <div className="card-title-row">
              <div className="card-title">
                {area} <span className="muted">{ui.softAreaEmpCount(emps.length)}</span>
              </div>
              <span className={`chip ${apex >= 7 ? 'chip-green' : apex >= 5 ? 'chip-amber' : 'chip-red'}`} style={{ marginLeft: 'auto' }}>
                <span className="dt" />
                {fmt1(apex)}
              </span>
            </div>
            <div className="grid grid-2" style={{ gap: 8 }}>
              {APEX5D_DIMENSIONS.map((dim) => {
                const v = round1(avg(emps.map((e) => computeHardSummary(e, lang).dims.find((d) => d.code === dim.code)!.mediaTotale)))
                return <StatTile key={dim.code} label={`${dim.code} · ${dim.name}`} value={v} benchmark={6.5} />
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HardRankingView({ sort, onSort, onOpenDrawer }: { sort: 'score' | 'gap'; onSort: (s: 'score' | 'gap') => void; onOpenDrawer: (id: string) => void }) {
  const { state, lang, ui } = useAssessment()
  const list = state.employees.map((e) => {
    const s = computeHardSummary(e, lang).apexScore
    return { e, s, gap: round1(s - 6.5) }
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
                <th>{ui.hardApexScoreCol}</th>
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

function HardMatchView({ match, onChangeMatch }: { match: string[]; onChangeMatch: (ids: string[]) => void }) {
  const { state, lang, ui } = useAssessment()
  const APEX5D_DIMENSIONS = getApex5dDimensions(lang)
  const emps = match.map((id) => state.employees.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => !!e)
  function add(id: string) {
    if (match.length >= 5) return
    onChangeMatch([...match, id])
  }
  function remove(id: string) {
    onChangeMatch(match.filter((x) => x !== id))
  }
  const overallVals = emps.map((e) => computeHardSummary(e, lang).apexScore)
  const overallCls = matchCellClasses(overallVals)
  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title-row">
          <div className="card-title">{ui.softSelectUpTo5}</div>
        </div>
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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {emps.map((e) => (
            <span className="chip chip-blue" key={e.id}>
              {e.nome} {e.cognome} <span style={{ cursor: 'pointer', marginLeft: 4 }} onClick={() => remove(e.id)}>✕</span>
            </span>
          ))}
        </div>
      </div>
      {emps.length ? (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>{ui.colDimension}</th>
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
                    <b>{ui.hardApexScoreCol}</b>
                  </td>
                  {overallVals.map((v, i) => (
                    <td className={overallCls[i]} key={i}>
                      <b>{fmt1(v)}</b>
                    </td>
                  ))}
                </tr>
                {APEX5D_DIMENSIONS.map((dim) => {
                  const vals = emps.map((e) => computeHardSummary(e, lang).dims.find((d) => d.code === dim.code)!.mediaTotale)
                  const cls = matchCellClasses(vals)
                  return (
                    <tr key={dim.code}>
                      <td>
                        {dim.code} · {dim.name}
                      </td>
                      {vals.map((v, i) => (
                        <td className={cls[i]} key={i}>
                          {fmt1(v)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
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
