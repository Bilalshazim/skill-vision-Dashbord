import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { Icon } from '@/modules/assessment/components/Icon'
import { ValoreAreaChart } from '@/modules/assessment/components/ValoreAreaChart'
import { ValoreTierDistChart } from '@/modules/assessment/components/ValoreChart'
import { useAssessment, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import { bothActive, classifyPopulation, computeHardSummary, computeSoftSummary, primaryScore, primaryScoreLabel, tierFor } from '@/modules/assessment/lib/calculations'
import { fmt1, getTierDefs } from '@/modules/assessment/lib/legacy-utils'

// PHASE 25 fix: legacy's data-theme dark-mode tiers use different hex values
// than what this file originally used ('#B0208C' etc were the LIGHT-mode
// values only) — ported both from tierColors() (js/assessment.js
// ~7462-7465) so the matrix/chart/table colors track the theme exactly like
// legacy's tierColors() (which re-reads document.documentElement's
// data-theme on every call).
function tierColors(isDark: boolean): Record<string, string> {
  return {
    top: isDark ? '#D65FB8' : '#B0208C',
    valorizzare: 'var(--success)',
    adeguata: isDark ? '#2AA5B0' : '#0F7A85',
    sviluppo: 'var(--warning)',
    critica: 'var(--danger)',
  }
}

function exportValoreCsv(rows: { e: { cognome: string; nome: string; area: string; ruolo: string }; soft: number; hard: number; combined: number; tier: { label: string } }[], csvHeader: string) {
  let csv = csvHeader + '\n'
  rows.forEach((r) => {
    csv += [r.e.cognome, r.e.nome, r.e.area, r.e.ruolo, fmt1(r.soft), fmt1(r.hard), fmt1(r.combined), r.tier.label].join(';') + '\n'
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'overall_value.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// Migrated from renderValore()/exportValoreCsv() (js/assessment.js
// ~7462-7592) — 5-tier classification list, tier matrix, ranked employee
// table, the "Esporta CSV" topbar action, and (Phase 25) the Chart.js
// ranked-value/tier-distribution canvas + real employee-drawer wiring
// (Phase 24 had a leftover placeholder card instead of the chart, and
// neither the matrix rows nor the table rows opened the employee drawer).
export default function AssessmentValorePage() {
  const { state, lang, ui, theme } = useAssessment()
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const both = bothActive(state)
  const TIER_DEFS = getTierDefs(lang)
  const tiers = classifyPopulation(state, lang)
  // Memoized: this used to be rebuilt (new array reference) on every render
  // and fed straight into useTopbarActions' deps below, which made that
  // effect re-fire every render -> setTopbarActions -> context update ->
  // re-render -> rebuilt again, an infinite loop that froze this tab.
  const rows = useMemo(
    () =>
      state.employees
        .map((e) => ({ e, soft: computeSoftSummary(e, lang).overallOttenuto, hard: computeHardSummary(e, lang).apexScore, combined: primaryScore(e, state, lang) }))
        .map((r) => ({ ...r, tier: tierFor(r.combined, lang) }))
        .sort((a, b) => b.combined - a.combined),
    [state, lang],
  )
  const colors = tierColors(theme === 'dark')

  useTopbarActions(
    <Button variant="outline" size="sm" onClick={() => exportValoreCsv(rows, ui.csvHeaderValore)}>
      <Icon name="download" />
      {ui.valoreExportCsv}
    </Button>,
    [rows, ui],
  )

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>{primaryScoreLabel(state, lang)}</h2>
          <p>{both ? ui.valoreSubBoth : state.settings.modulo === 'A' ? ui.valoreSubAOnly : ui.valoreSubBOnly}</p>
        </div>
      </div>

      {!both && (
        <div className="small-note" style={{ marginBottom: 14, padding: '10px 12px', background: 'var(--warning-soft)', border: '1px solid #F0D6A6', borderRadius: 'var(--radius-sm)' }}>
          {ui.valoreOnlyModuleNote(state.settings.modulo === 'A' ? ui.valoreModuleALabel : ui.valoreModuleBLabel)}
        </div>
      )}

      <div className="valore-top-grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title-row">
            <div className="card-title" style={{ fontSize: 13 }}>
              {ui.valoreClassificationTitle}
            </div>
          </div>
          <div className="tier-list">
            {TIER_DEFS.map((t) => (
              <div className="tier-row" key={t.key} style={{ padding: '8px 10px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[t.key], display: 'inline-block' }} />
                <div className="tname" style={{ fontSize: 11.5 }}>
                  {t.label}
                </div>
                <div className="tcount" style={{ fontSize: 13, color: colors[t.key] }}>
                  {tiers[t.key].length}
                </div>
              </div>
            ))}
          </div>
          <div className="small-note" style={{ marginTop: 12 }}>
            {ui.valoreIndexNote(both ? ui.valoreIndexBoth : state.settings.modulo === 'A' ? ui.valoreIndexAOnly : ui.valoreIndexBOnly)}
          </div>
        </div>
        <div className={both ? 'card dark-chart-card' : 'card'} style={{ minHeight: 480 }}>
          <div className="card-title-row">
            <div className="card-title">{both ? ui.valoreScatterTitle : ui.valoreTierDistTitle}</div>
          </div>
          {both && (
            <div className="small-note" style={{ marginBottom: 4 }}>
              {ui.valoreBubbleSizeNote}
            </div>
          )}
          <div style={{ position: 'relative', height: 420 }}>
            {both ? (
              <ValoreAreaChart rows={rows} onOpenDrawer={setDrawerId} softSeriesLabel={ui.valoreModuleALabel} hardSeriesLabel={ui.valoreModuleBLabel} theme={theme} />
            ) : (
              <ValoreTierDistChart labels={TIER_DEFS.map((t) => t.label)} counts={TIER_DEFS.map((t) => tiers[t.key].length)} colors={TIER_DEFS.map((t) => colors[t.key])} />
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          {ui.valoreMatrixTitle} <span className="muted">{ui.valoreMatrixSub}</span>
        </div>
        <div className="grid grid-5" style={{ gap: 10, marginTop: 14, alignItems: 'start' }}>
          {TIER_DEFS.map((t) => (
            <div key={t.key} style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: colors[t.key], display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: colors[t.key] }}>{t.label}</span>
                <span className="small-note" style={{ marginLeft: 'auto' }}>
                  {tiers[t.key].length}
                </span>
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {tiers[t.key].length ? (
                  tiers[t.key].map((e) => {
                    const score = primaryScore(e, state, lang)
                    return (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px dashed var(--border)', cursor: 'pointer' }} onClick={() => setDrawerId(e.id)}>
                        <div className="avatar" style={{ width: 30, height: 30 }}>
                          {(e.nome[0] || '') + (e.cognome[0] || '')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 12.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {e.nome} {e.cognome}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.ruolo}</div>
                        </div>
                        <span className={`chip ${score >= 7 ? 'chip-green' : score >= 5 ? 'chip-amber' : 'chip-red'}`}>
                          <span className="dt" />
                          {fmt1(score)}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <div className="small-note" style={{ textAlign: 'center', padding: '14px 0' }}>
                    {ui.noEmployeesTitle}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="card-title-row" style={{ padding: '16px 20px 0 20px' }}>
          <div className="card-title">{ui.valoreByEmployeeTitle}</div>
        </div>
        <div className="table-wrap">
          <table className="dtable">
            <thead>
              <tr>
                <th>#</th>
                <th>{ui.colEmployee}</th>
                <th>{ui.colArea}</th>
                <th>{ui.colRole}</th>
                {both ? (
                  <>
                    <th>{ui.colSoftA}</th>
                    <th>{ui.colHardB}</th>
                    <th>{ui.colCombined}</th>
                  </>
                ) : (
                  <th>{primaryScoreLabel(state, lang)}</th>
                )}
                <th>{ui.colClassification}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.e.id} onClick={() => setDrawerId(r.e.id)}>
                  <td>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>
                        {(r.e.nome[0] || '') + (r.e.cognome[0] || '')}
                      </div>
                      <b>
                        {r.e.nome} {r.e.cognome}
                      </b>
                    </div>
                  </td>
                  <td>{r.e.area}</td>
                  <td>{r.e.ruolo}</td>
                  {both ? (
                    <>
                      <td>{fmt1(r.soft)}</td>
                      <td>{fmt1(r.hard)}</td>
                      <td>
                        <b>{fmt1(r.combined)}</b>
                      </td>
                    </>
                  ) : (
                    <td>
                      <b>{fmt1(r.combined)}</b>
                    </td>
                  )}
                  <td>
                    <span className={`chip ${r.tier.chip}`}>
                      <span className="dt" />
                      {r.tier.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drawerId && <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} />}
    </div>
  )
}
