import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Note } from '@/components/patterns/Note'
import { chipTone } from '@/modules/assessment/lib/chip-tone'
import { PersonRow } from '@/components/patterns/PersonRow'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Initials } from '@/components/ui/avatar'
import { StatCard } from '@/components/patterns/StatCard'
import { Separator } from '@/components/ui/separator'
import { MatchLegend } from '@/modules/assessment/components/MatchLegend'
import { MatchCell } from '@/modules/assessment/components/MatchCell'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SelectField } from '@/components/patterns/SelectField'
import { Field } from '@/components/patterns/Field'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardLabel } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { CategoryBars } from '@/components/patterns/CategoryBars'
import { ProfileRadar } from '@/components/patterns/ProfileRadar'
import { Icon } from '@/modules/assessment/components/Icon'
import { SoftEvalModal } from '@/modules/assessment/components/SoftEvalModal'
import { StatTile } from '@/modules/assessment/components/StatTile'
import { SurveyLinkModal } from '@/modules/assessment/components/SurveyLinkModal'
import { useAssessment, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import { computeSoftSummary, gapInterpretation, matchCellClasses, orgWorstSoftSkills } from '@/modules/assessment/lib/calculations'
import { avg, fmt1, getBigFiveDims, getSoftClusters, getSoftSkills, round1 } from '@/modules/assessment/lib/legacy-utils'

type SoftView = 'org' | 'area' | 'alfa' | 'individuale' | 'ranking' | 'match'
const BF_ORDER = ['O', 'C', 'E', 'A', 'S'] as const

// Migrated from renderSoft()/renderSoftViewBody()/renderSoft*View()
// (js/assessment.js ~6368-6625) — all 6 legacy tabs (Org/Area/Alfa/
// Individuale/Ranking/Match) plus the "Nuova valutazione" modal, completed in
// Phase 25 (Phase 24 had shipped only Org+Alfa). The Big Five chart (Org and
// Individuale tabs) is GroupedBarsChart.tsx, a real Chart.js bar chart —
// it used to be the ported apex-charts-3d.ts isometric-SVG renderer, moved
// off that for a flat/rounded bar restyle (see GroupedBarsChart.tsx).
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
  // Lets Home's "Confronta Aree" (see AssessmentHomePage.tsx's Il Valore
  // card) deep-link straight into the Area tab instead of always landing
  // on defaultView — read once on mount, same as defaultView itself.
  const [searchParams] = useSearchParams()
  const initialView = (searchParams.get('view') as SoftView | null) || defaultView
  const [view, setView] = useState<SoftView>(initialView)
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
      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="mb-6">
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{ui.softClusterAvgTitle}</CardTitle>
          </CardHeader>
          {/* G2 — cluster aziendali, ottenuto contro atteso (DECISIONI). */}
          <CategoryBars
            title={ui.softClusterAvgTitle}
            valueMax={10}
            orientation="horizontal"
            series={[
              { key: 'ott', label: ui.chartObtained },
              { key: 'att', label: ui.chartExpected, reference: true },
            ]}
            rows={clusterAvgs.map((c) => ({ label: c.cluster, values: { ott: c.ott, att: c.att } }))}
          />
          <Note className="mt-3">
            {ui.softClusterAvgNote}
          </Note>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{ui.softBigFiveOrgTitle}</CardTitle>
          </CardHeader>
          {/* G1 — Big Five aziendale, ottenuto contro atteso (DECISIONI). */}
          <CategoryBars
            title={ui.softBigFiveOrgTitle}
            valueMax={10}
            series={[
              { key: 'ott', label: ui.chartObtained },
              { key: 'att', label: ui.chartExpected, reference: true },
            ]}
            rows={BF_ORDER.map((d) => ({ label: BIGFIVE_DIMS[d].label, values: { ott: bfOrg[d], att: bfOrgAtteso[d] } }))}
          />
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{ui.softWorstSkillsTitle}</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {worst.map((s) => (
            <StatTile key={s.id} label={s.name} value={s.ottenuto} benchmark={s.atteso} />
          ))}
        </div>
      </Card>
    </>
  )
}

function SoftAreaView({ onOpenDrawer }: { onOpenDrawer: (id: string) => void }) {
  const { state, lang, ui } = useAssessment()
  const areas = [...new Set(state.employees.map((e) => e.area))]
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {areas.map((area) => {
        const emps = state.employees.filter((e) => e.area === area)
        const ott = round1(avg(emps.map((e) => computeSoftSummary(e, lang).overallOttenuto)))
        return (
          <Card key={area}>
            <CardHeader>
              <CardTitle>
                {area} <span className="text-app-small font-normal text-muted-foreground">{ui.softAreaEmpCount(emps.length)}</span>
              </CardTitle>
              <Badge className="ml-auto" tone={ott >= 7 ? 'success' : ott >= 5 ? 'warning' : 'destructive'} dot>
                {fmt1(ott)}
              </Badge>
            </CardHeader>
            {emps.map((e) => {
              const s = computeSoftSummary(e, lang).overallOttenuto
              return (
                <PersonRow key={e.id} first={e.nome} last={e.cognome} meta={e.ruolo} onClick={() => onOpenDrawer(e.id)} trailing={<Badge tone={s >= 7 ? 'success' : s >= 5 ? 'warning' : 'destructive'} dot>{fmt1(s)}</Badge>} />
              )
            })}
          </Card>
        )
      })}
    </div>
  )
}

function SoftAlfaView({ onOpenDrawer }: { onOpenDrawer: (id: string) => void }) {
  const { state, lang, ui } = useAssessment()
  const list = [...state.employees].sort((a, b) => a.cognome.localeCompare(b.cognome))
  return (
    <Card padding="none">
      <Table frame>
          <TableHeader>
            <TableRow>
              <TableHead>{ui.softColLastName}</TableHead>
              <TableHead>{ui.softColFirstName}</TableHead>
              <TableHead>{ui.colArea}</TableHead>
              <TableHead>{ui.colRole}</TableHead>
              <TableHead>{ui.colObtained}</TableHead>
              <TableHead>{ui.colExpected}</TableHead>
              <TableHead>{ui.colGap}</TableHead>
              <TableHead>{ui.softColDispatchDate}</TableHead>
              <TableHead>{ui.softColAwaitingTest} / {ui.softColTestDone}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((e) => {
              const s = computeSoftSummary(e, lang)
              const gi = gapInterpretation(s.gapOverall, lang)
              // "Test effettuato" = a soft evaluation was recorded at/after the
              // last dispatch; otherwise, if a link was ever sent, the test is
              // still pending. No dispatch at all shows neither status badge.
              const testDone = !!e.surveySentAt && e.softHistory.some((h) => new Date(h.date).getTime() >= new Date(e.surveySentAt!).getTime())
              return (
                <TableRow key={e.id} onClick={() => onOpenDrawer(e.id)}>
                  <TableCell>
                    <b>{e.cognome}</b>
                  </TableCell>
                  <TableCell>{e.nome}</TableCell>
                  <TableCell>{e.area}</TableCell>
                  <TableCell>{e.ruolo}</TableCell>
                  <TableCell>{fmt1(s.overallOttenuto)}</TableCell>
                  <TableCell>{fmt1(s.overallAtteso)}</TableCell>
                  <TableCell>
                    <Badge tone={chipTone(gi.tag)}>{fmt1(s.gapOverall)}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{e.surveySentAt ? new Date(e.surveySentAt).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US') : '—'}</TableCell>
                  <TableCell>
                    {!e.surveySentAt ? (
                      <Badge dot>
                        {ui.softStatusNotSent}
                      </Badge>
                    ) : testDone ? (
                      <Badge tone="success" dot>
                        {ui.softColTestDone}
                      </Badge>
                    ) : (
                      <Badge tone="warning" dot>
                        {ui.softColAwaitingTest}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
    </Card>
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
      <EmptyState title={ui.noEmployeesTitle} description={ui.noEmployeesDesc} />
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
      <Field label={ui.softSelectEmployee} className="max-w-90">
        <SelectField value={emp.id} onValueChange={(v) => onSelectEmp(v)}>
          {state.employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.cognome} {e.nome} — {e.ruolo}
            </option>
          ))}
        </SelectField>
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 mb-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{ui.softBigFiveProfile}</CardTitle>
          </CardHeader>
          {/* R4 — profilo Big Five della persona contro il profilo atteso del ruolo. */}
          <ProfileRadar
            title={ui.softBigFiveProfile}
            axes={BF_ORDER.map((d) => ({ key: d, label: BIGFIVE_DIMS[d].label }))}
            series={[
              { label: ui.chartExpected, values: bfAtteso, reference: true },
              { label: `${emp.nome} ${emp.cognome}`, values: bf },
            ]}
          />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{ui.softSummaryTitle}</CardTitle>
          </CardHeader>
          <StatCard surface="none" size="lg" value={fmt1(ss.overallOttenuto)} note={ui.softOverallScoreLabel(fmt1(ss.overallAtteso))} />
          <Separator className="my-4" />
          {/* R3 — i cinque cluster soft della persona contro l'atteso del ruolo. */}
          <ProfileRadar
            title={ui.softSummaryTitle}
            size="sm"
            axes={ss.perCluster.map((c) => ({ key: c.cluster, label: c.cluster }))}
            series={[
              { label: ui.chartExpected, values: Object.fromEntries(ss.perCluster.map((c) => [c.cluster, c.atteso])), reference: true },
              { label: `${emp.nome} ${emp.cognome}`, values: Object.fromEntries(ss.perCluster.map((c) => [c.cluster, c.ottenuto])) },
            ]}
          />
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{ui.softAllSkillsDetail}</CardTitle>
        </CardHeader>
        {SOFT_CLUSTERS.map((c) => (
          <section className="mb-4" key={c}>
            <CardLabel className="mb-2 border-b border-border pb-2">{c}</CardLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {ss.perSkill
                .filter((s) => s.cluster === c)
                .map((s) => (
                  <StatTile key={s.id} label={s.name} value={s.ottenuto} benchmark={s.atteso} />
                ))}
            </div>
          </section>
        ))}
      </Card>
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
      <ToggleGroup type="single" value={sort} onValueChange={(v) => v && onSort(v as typeof sort)} className="mb-4">
        <ToggleGroupItem value="score">{ui.softSortByScore}</ToggleGroupItem>
        <ToggleGroupItem value="gap">{ui.softSortByGap}</ToggleGroupItem>
      </ToggleGroup>
      <Card padding="none">
        <Table frame>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{ui.colEmployee}</TableHead>
                <TableHead>{ui.colArea}</TableHead>
                <TableHead>{ui.colRole}</TableHead>
                <TableHead>{ui.colScore}</TableHead>
                <TableHead>{ui.colGapVsExpected}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r, i) => (
                <TableRow key={r.e.id} onClick={() => onOpenDrawer(r.e.id)}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Initials first={r.e.nome} last={r.e.cognome} />
                      <b>
                        {r.e.nome} {r.e.cognome}
                      </b>
                    </div>
                  </TableCell>
                  <TableCell>{r.e.area}</TableCell>
                  <TableCell>{r.e.ruolo}</TableCell>
                  <TableCell>
                    <Badge tone={r.s >= 7 ? 'success' : r.s >= 5 ? 'warning' : 'destructive'} dot>
                      {fmt1(r.s)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge tone={chipTone(gapInterpretation(r.gap, lang).tag)}>
                      {r.gap > 0 ? '+' : ''}
                      {fmt1(r.gap)}
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
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{ui.softSelectUpTo5}</CardTitle>
        </CardHeader>
        <div className="flex gap-2 flex-wrap">
          <SelectField
            size="sm"
            value=""
            onValueChange={(v) => {
              if (v) add(v)
            }}
          >
            <option value="">{ui.softAddToComparison}</option>
            {state.employees
              .filter((e) => !match.includes(e.id))
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.cognome} {e.nome}
                </option>
              ))}
          </SelectField>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {emps.map((e) => (
            <Badge key={e.id} onRemove={() => remove(e.id)} removeLabel={ui.matchRemove(`${e.nome} ${e.cognome}`)}>
              {e.nome} {e.cognome}
            </Badge>
          ))}
        </div>
      </Card>
      {emps.length ? (
        <Card padding="none" className="match-col">
          <Table frame>
              <TableHeader>
                <TableRow>
                  <TableHead>{ui.colCompetency}</TableHead>
                  {emps.map((e) => (
                    <TableHead key={e.id}>
                      {e.nome} {e.cognome[0]}.
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted font-medium">
                  <TableCell>
                    <b>{ui.colOverallScore}</b>
                  </TableCell>
                  {overallVals.map((v, i) => (
                    <MatchCell key={i} value={v} match={overallCls[i]} strong />
                  ))}
                </TableRow>
                {SOFT_CLUSTERS.map((c) => (
                  <SoftMatchClusterRows key={c} cluster={c} skills={SOFT_SKILLS.filter((s) => s.cluster === c)} emps={emps} />
                ))}
              </TableBody>
            </Table>
          <MatchLegend />
        </Card>
      ) : (
        <EmptyState title={ui.softNoEmpSelectedTitle} description={ui.softNoEmpSelectedDesc} />
      )}
    </>
  )
}

function SoftMatchClusterRows({ cluster, skills, emps }: { cluster: string; skills: { id: string; name: string }[]; emps: { id: string; soft: Record<string, { ottenuto: number }> }[] }) {
  return (
    <>
      <TableRow>
        <TableCell colSpan={emps.length + 1} className="label-mono bg-muted text-muted-foreground">
          {cluster}
        </TableCell>
      </TableRow>
      {skills.map((s) => {
        const vals = emps.map((e) => (e.soft[s.id] || { ottenuto: 0 }).ottenuto)
        const cls = matchCellClasses(vals)
        return (
          <TableRow key={s.id}>
            <TableCell>{s.name}</TableCell>
            {vals.map((v, i) => (
              <MatchCell key={i} value={v} match={cls[i]} />
            ))}
          </TableRow>
        )
      })}
    </>
  )
}
