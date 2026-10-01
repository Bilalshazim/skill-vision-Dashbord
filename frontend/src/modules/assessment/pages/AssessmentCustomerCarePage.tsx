import { ArrowDown, ArrowUp } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Note } from '@/components/patterns/Note'
import { PersonRow } from '@/components/patterns/PersonRow'
import { StatCard } from '@/components/patterns/StatCard'
import { PageHeader } from '@/components/patterns/PageHeader'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Initials } from '@/components/ui/avatar'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { chipTone } from '@/modules/assessment/lib/chip-tone'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { Icon } from '@/modules/assessment/components/Icon'
import { useAssessment, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import { avg, fmt1, getSoftSkills, round1 } from '@/modules/assessment/lib/legacy-utils'
import type { Employee } from '@/modules/assessment/lib/types'
import { CategoryBars } from '@/components/patterns/CategoryBars'
import { TrendChart } from '@/components/patterns/TrendChart'

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
  const mag = Math.abs(d).toFixed(opts.dec == null ? 1 : opts.dec) + (opts.unit || '')
  return { cls, mag }
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
      <EmptyState title={ui.ccNoAgentsTitle} description={ui.ccNoAgentsDesc} />
    )
  }

  const tabs: { id: CCView; label: string }[] = [
    { id: 'overview', label: ui.ccTabOverview },
    { id: 'agents', label: ui.ccTabAgents },
    { id: 'matrix', label: ui.ccTabMatrix },
  ]

  return (
    <div>
      <PageHeader eyebrow={ui.ccEyebrow} title={ui.ccPageTitle} description={ui.ccPageSub} />
      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="mb-6">
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Note className="mb-4">
        {ui.ccDemoNote}
      </Note>

      {view === 'overview' && <CCOverview model={model} onOpenDrawer={setDrawerId} />}
      {view === 'agents' && <CCAgents model={model} competencyName={competencyName} onOpenDrawer={setDrawerId} />}
      {view === 'matrix' && <CCMatrix model={model} competencyName={competencyName} onOpenDrawer={setDrawerId} />}

      {drawerId && <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} />}
    </div>
  )
}

// Lo scarto di un indicatore per StatCard: la freccia segue il segno, il
// colore dice se è un miglioramento (anche quando più basso è meglio).
function ccDelta(cur: number, prev: number, fallbackLabel: string, opts?: { eps?: number; lowerIsBetter?: boolean; dec?: number; unit?: string; label?: string }) {
  const { cls, mag } = ccDeltaBadge(cur, prev, opts)
  const d = cur - prev
  return {
    label: `${mag} ${opts?.label || fallbackLabel}`,
    direction: cls === 'flat' ? ('flat' as const) : d > 0 ? ('up' as const) : ('down' as const),
    tone: cls === 'up' ? ('success' as const) : cls === 'down' ? ('destructive' as const) : ('neutral' as const),
  }
}

function CCOverview({ model, onOpenDrawer }: { model: ReturnType<typeof customerCareModel>; onOpenDrawer: (id: string) => void }) {
  const { ui } = useAssessment()
  const o = model.org
  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={ui.ccKpiFrt} value={fmt1(o.frt)} unit={ui.ccUnitMin} note={ui.ccKpiFrtSub} delta={ccDelta(o.frt, o.frtPrev, ui.ccDeltaVsPrev, { lowerIsBetter: true, unit: ui.ccUnitMin })} />
        <StatCard label={ui.ccKpiCsat} value={Math.round(o.csat)} unit="%" note={ui.ccKpiCsatSub} delta={ccDelta(o.csat, o.csatPrev, ui.ccDeltaVsPrev, { unit: '%', dec: 0 })} />
        <StatCard label={ui.ccKpiVolume} value={o.volume.toLocaleString('it-IT')} note={`${ui.ccKpiVolumeSub} · ${model.rows.length} agent`} />
        <StatCard label={ui.ccKpiMatch} value={Math.round(o.match)} unit="%" note={ui.ccKpiMatchSub} delta={ccDelta(o.match, 100, ui.ccDeltaVsPrev, { unit: '%', dec: 0, label: ui.ccDeltaVsTarget })} />
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{ui.ccTrendTitle}</CardTitle>
        </CardHeader>
        {/* G10 (DECISIONI): CSAT e ticket risolti per settimana sullo stesso
            asse del tempo — i ticket a barre (asse sinistro), il CSAT come
            linea (asse destro, in %). */}
        <TrendChart
          title={ui.ccTrendTitle}
          scale={{ right: [0, 100] }}
          height="lg"
          series={[
            { key: 'csat', label: ui.ccTrendCsat, kind: 'line', axis: 'right' },
            { key: 'resolved', label: ui.ccTrendResolved, kind: 'bar' },
          ]}
          points={model.weeks.map((w, i) => ({ date: new Date(Date.now() - (model.weeks.length - 1 - i) * 7 * 86400000), label: w, values: { csat: model.csatSeries[i], resolved: model.resolvedSeries[i] } }))}
        />
      </Card>

      <Card padding="none">
        <CardHeader className="px-4 pt-4">
          <CardTitle>{ui.ccAgentTableTitle}</CardTitle>
        </CardHeader>
        <Table frame>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{ui.ccColAgent}</TableHead>
                <TableHead>{ui.colRole}</TableHead>
                <TableHead>{ui.ccColTickets}</TableHead>
                <TableHead>{ui.ccColFrt}</TableHead>
                <TableHead>{ui.ccColCsat}</TableHead>
                <TableHead>{ui.ccColResolution}</TableHead>
                <TableHead>{ui.ccColMatch}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {model.rows.map((r, i) => (
                <TableRow key={r.emp.id} onClick={() => onOpenDrawer(r.emp.id)}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Initials first={r.emp.nome} last={r.emp.cognome} />
                      <b>
                        {r.emp.nome} {r.emp.cognome}
                      </b>
                    </div>
                  </TableCell>
                  <TableCell>{r.emp.ruolo}</TableCell>
                  <TableCell>{r.tickets}</TableCell>
                  <TableCell>
                    {fmt1(r.frt)}
                    {ui.ccUnitMin}
                  </TableCell>
                  <TableCell>
                    <Badge tone={r.csat >= 90 ? 'success' : r.csat >= 80 ? 'warning' : 'destructive'} dot>
                      {Math.round(r.csat)}%
                    </Badge>
                  </TableCell>
                  <TableCell>{Math.round(r.resolution)}%</TableCell>
                  <TableCell>
                    <Badge tone={chipTone(ccGapTag(r.compOtt, r.compAtt))}>{r.matchPct}%</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </Card>
    </>
  )
}

function CCAgents({ model, competencyName, onOpenDrawer }: { model: ReturnType<typeof customerCareModel>; competencyName: (id: string) => string; onOpenDrawer: (id: string) => void }) {
  const { ui } = useAssessment()
  const compNames = CC_COMPETENCY_IDS.map(competencyName)
  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{ui.ccAgentsChartTitle}</CardTitle>
        </CardHeader>
        {/* Competenza ottenuta contro attesa per agente: barre orizzontali
            (Bklit), l'atteso come serie di confronto. Lo scarto di ciascuno è
            nella matrice sotto, con la sua parola. */}
        <CategoryBars
          title={ui.ccAgentsChartTitle}
          orientation="horizontal"
          valueMax={10}
          height={model.rows.length > 6 ? 'lg' : 'md'}
          series={[
            { key: 'ott', label: ui.chartObtained },
            { key: 'att', label: ui.chartExpected, reference: true },
          ]}
          rows={model.rows.map((r) => ({ label: `${r.emp.cognome} ${(r.emp.nome || ' ')[0]}.`, values: { ott: r.compOtt, att: r.compAtt } }))}
        />
      </Card>
      <Card padding="none">
        <CardHeader className="px-4 pt-4">
          <CardTitle>
            {ui.ccTabAgents} <span className="text-app-small font-normal text-muted-foreground">{ui.ccMatrixSub}</span>
          </CardTitle>
        </CardHeader>
        <Table frame>
            <TableHeader>
              <TableRow>
                <TableHead>{ui.ccColAgent}</TableHead>
                <TableHead>{ui.colRole}</TableHead>
                {compNames.map((n) => (
                  <TableHead key={n}>{n}</TableHead>
                ))}
                <TableHead>{ui.ccColOverall}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {model.rows.map((r) => (
                <TableRow key={r.emp.id} onClick={() => onOpenDrawer(r.emp.id)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Initials first={r.emp.nome} last={r.emp.cognome} />
                      <b>
                        {r.emp.nome} {r.emp.cognome}
                      </b>
                    </div>
                  </TableCell>
                  <TableCell>{r.emp.ruolo}</TableCell>
                  {r.comps.map((c) => (
                    <TableCell key={c.id}>
                      <Badge tone={chipTone(ccGapTag(c.ottenuto, c.atteso))}>{fmt1(c.ottenuto)}</Badge>
                    </TableCell>
                  ))}
                  <TableCell>
                    <Badge tone={r.compOtt >= 7 ? 'success' : r.compOtt >= 5 ? 'warning' : 'destructive'} dot>
                      {fmt1(r.compOtt)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </Card>
    </>
  )
}

function CCMatrix({ model, competencyName, onOpenDrawer }: { model: ReturnType<typeof customerCareModel>; competencyName: (id: string) => string; onOpenDrawer: (id: string) => void }) {
  const { ui } = useAssessment()
  return (
    <>
      <Card className="mb-4">
        <CardTitle>
          {ui.ccMatrixTitle} <span className="text-app-small font-normal text-muted-foreground">{ui.ccMatrixSub}</span>
        </CardTitle>
        <Note className="mt-2">
          {ui.ccMatrixNote}
        </Note>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Card key={id}>
              <CardHeader>
                <CardTitle>{competencyName(id)}</CardTitle>
                <Badge className="ml-auto" tone={ott >= 7 ? 'success' : ott >= 5 ? 'warning' : 'destructive'} dot>
                  {fmt1(ott)}
                </Badge>
              </CardHeader>
              <ul className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-app-small text-muted-foreground [&_b]:font-medium [&_b]:text-foreground">
                <li className="inline-flex items-center gap-2">
                  <ArrowUp className="size-3.5 text-success" aria-hidden="true" />
                  {ui.ccMatrixStrong}: {strong}
                </li>
                <li className="inline-flex items-center gap-2">
                  <ArrowDown className="size-3.5 text-destructive" aria-hidden="true" />
                  {ui.ccMatrixToDevelop}: {weak}
                </li>
                <li className="ml-auto">
                  {ui.ccMatrixColOrgAvg}: <b>{fmt1(ott)}</b> / {fmt1(att)}
                </li>
              </ul>
              {scored.map((s) => (
                <PersonRow key={s.emp.id} first={s.emp.nome} last={s.emp.cognome} onClick={() => onOpenDrawer(s.emp.id)} trailing={<Badge tone={chipTone(ccChipClass(s.ott, s.att))} dot>{fmt1(s.ott)}</Badge>} />
              ))}
            </Card>
          )
        })}
      </div>
    </>
  )
}
