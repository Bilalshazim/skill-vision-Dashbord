import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { Note } from '@/components/patterns/Note'
import { chipTone, levelTone } from '@/modules/assessment/lib/chip-tone'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Initials } from '@/components/ui/avatar'
import { StatCard } from '@/components/patterns/StatCard'
import { Separator } from '@/components/ui/separator'
import { MatchLegend } from '@/modules/assessment/components/MatchLegend'
import { MatchCell } from '@/modules/assessment/components/MatchCell'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConfirm } from '@/hooks/use-confirm'
import { SelectField } from '@/components/patterns/SelectField'
import { Field } from '@/components/patterns/Field'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { EvaluationManagerModal } from '@/modules/assessment/components/EvaluationManagerModal'
import { ProfileRadar } from '@/components/patterns/ProfileRadar'
import { HardEvalModal } from '@/modules/assessment/components/HardEvalModal'
import { Icon } from '@/modules/assessment/components/Icon'
import { StatTile } from '@/modules/assessment/components/StatTile'
import { useAssessment, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import { computeHardSummary, gapInterpretation, matchCellClasses } from '@/modules/assessment/lib/calculations'
import { avg, fmt1, getApex5dDimensions, levelFor, round1 } from '@/modules/assessment/lib/legacy-utils'

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
  const [confirm, confirmDialog] = useConfirm()
  // Lets Home's "Confronta Aree" (see AssessmentHomePage.tsx's Il Valore
  // card) deep-link straight into the Area tab instead of always landing
  // on defaultView — read once on mount, same as defaultView itself.
  const [searchParams] = useSearchParams()
  const initialView = (searchParams.get('view') as HardView | null) || defaultView
  const [view, setView] = useState<HardView>(initialView)
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
  async function removeEvaluator(i: number) {
    const name = state.evaluators[i]
    if (!(await confirm({ title: ui.confirmRemoveEvaluator(name), confirmLabel: ui.removeEvaluator, cancelLabel: ui.confirmCancel, destructive: true }))) return
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
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{ui.evaluatorsTitle}</CardTitle>
        </CardHeader>
        <Note className="mb-3">
          {ui.evaluatorsHint}
        </Note>
        <div className={cn('flex flex-wrap gap-2', canEdit && 'mb-3')}>
          {state.evaluators.length ? (
            state.evaluators.map((name, i) => (
              <Badge key={name + i} onRemove={canEdit ? () => removeEvaluator(i) : undefined} removeLabel={`${ui.removeEvaluator}: ${name}`}>
                {name}
              </Badge>
            ))
          ) : (
            <Note>{ui.noEvaluators}</Note>
          )}
        </div>
        {canEdit && (
          <div className="flex gap-2 items-end flex-wrap">
            <Field label={ui.newEvaluatorName} className="min-w-52 flex-1 mb-0!">
              <Input type="text" placeholder={ui.evaluatorNameExamplePh} value={newEvaluatorName} onChange={(e) => setNewEvaluatorName(e.target.value)} />
            </Field>
            <Button variant="default" size="sm" onClick={addEvaluator}>
              <Icon name="plus" />
              {ui.addEvaluator}
            </Button>
          </div>
        )}
      </Card>

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
        <b>APEX 5D™ Protocol</b> — SKILL-VISION S.r.l. · {ui.hardProtocolNote}
      </Note>

      {view === 'individuale' && <HardIndividualeView selectedEmp={selectedEmp} onSelectEmp={setSelectedEmp} />}
      {view === 'area' && <HardAreaView />}
      {view === 'ranking' && <HardRankingView sort={rankSort} onSort={setRankSort} onOpenDrawer={setDrawerId} />}
      {view === 'match' && <HardMatchView match={match} onChangeMatch={setMatch} />}

      {showEvalModal && <HardEvalModal onClose={() => setShowEvalModal(false)} />}
      {showManagerModal && <EvaluationManagerModal onClose={() => setShowManagerModal(false)} />}
      {drawerId && <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} />}
      {confirmDialog}
    </div>
  )
}

function HardIndividualeView({ selectedEmp, onSelectEmp }: { selectedEmp: string | null; onSelectEmp: (id: string) => void }) {
  const { state, lang, ui } = useAssessment()
  const emp = state.employees.find((e) => e.id === selectedEmp) || state.employees[0]
  if (!emp) {
    return (
      <EmptyState title={ui.noEmployeesTitle} description={ui.noEmployeesDesc} />
    )
  }
  const hsm = computeHardSummary(emp, lang)
  const evalBy = emp.hardEvaluatedBy || { resp: '', peer: '', auto: '' }
  const evalByLine = [evalBy.resp ? `${ui.evalByManagerPrefix}: ${evalBy.resp}` : '', evalBy.peer ? `${ui.evalByPeerPrefix}: ${evalBy.peer}` : '', evalBy.auto ? `${ui.evalBySelfPrefix}: ${evalBy.auto}` : ''].filter(Boolean).join(' · ')

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
      {evalByLine && (
        <Note className="mb-3">
          <b>{ui.evaluatedByPrefix}:</b> {evalByLine}
        </Note>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 mb-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{ui.hardMultiSourceTitle}</CardTitle>
          </CardHeader>
          {/* R5 — APEX 5D per fonte: tre serie (chart-1…3 in ordine) e il
              benchmark 6,5 come contorno tratteggiato (DECISIONI). */}
          <ProfileRadar
            title={ui.hardMultiSourceTitle}
            axes={hsm.dims.map((d) => ({ key: d.code, label: `${d.code} · ${d.name}` }))}
            series={[
              { label: 'Benchmark', values: Object.fromEntries(hsm.dims.map((d) => [d.code, 6.5])), reference: true },
              { label: ui.hardColManager, values: Object.fromEntries(hsm.dims.map((d) => [d.code, d.perSource.resp])) },
              { label: ui.hardColPeer, values: Object.fromEntries(hsm.dims.map((d) => [d.code, d.perSource.peer])) },
              { label: ui.hardColSelf, values: Object.fromEntries(hsm.dims.map((d) => [d.code, d.perSource.auto])) },
            ]}
          />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{ui.hardApex5dProfile}</CardTitle>
          </CardHeader>
          <StatCard surface="none" size="lg" value={fmt1(hsm.apexScore)} note={ui.hardOverallApexLabel} />
          <Separator className="my-4" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {hsm.dims.map((d) => (
              <StatTile key={d.code} label={`${d.code} · ${d.name}`} value={d.mediaTotale} benchmark={6.5} />
            ))}
          </div>
        </Card>
      </div>
      <Card padding="none" className="mb-4">
        <Table frame>
            <TableHeader>
              <TableRow>
                <TableHead>{ui.hardColDimension}</TableHead>
                <TableHead>{ui.hardColManager}</TableHead>
                <TableHead>{ui.hardColPeer}</TableHead>
                <TableHead>{ui.hardColSelf}</TableHead>
                <TableHead>{ui.hardColOverallAvg}</TableHead>
                <TableHead>{ui.hardColLevel}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hsm.dims.map((d) => {
                const lvl = levelFor(d.mediaTotale, lang)
                return (
                  <TableRow key={d.code}>
                    <TableCell>
                      <b>{d.code}</b> · {d.name}
                    </TableCell>
                    <TableCell>{fmt1(d.perSource.resp)}</TableCell>
                    <TableCell>{fmt1(d.perSource.peer)}</TableCell>
                    <TableCell>{fmt1(d.perSource.auto)}</TableCell>
                    <TableCell>
                      <b>{fmt1(d.mediaTotale)}</b>
                    </TableCell>
                    <TableCell>
                      <Badge dot tone={levelTone(lvl.color)}>
                        {lvl.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              <TableRow className="bg-muted font-medium">
                <TableCell>
                  <b>{ui.hardApexScoreRow}</b>
                </TableCell>
                <TableCell colSpan={3} />
                <TableCell>
                  <b>{fmt1(hsm.apexScore)}</b>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
      </Card>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{ui.hardGapAnalysisTitle}</CardTitle>
        </CardHeader>
        <Table frame>
            <TableHeader>
              <TableRow>
                <TableHead>{ui.colDimension}</TableHead>
                <TableHead>{ui.hardColGapMgrSelf}</TableHead>
                <TableHead>{ui.hardColGapPeerSelf}</TableHead>
                <TableHead>{ui.hardColGapMgrPeer}</TableHead>
                <TableHead>{ui.hardColInterpretation}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hsm.dims.map((d) => {
                const gi = gapInterpretation(d.gapRespAuto, lang)
                return (
                  <TableRow key={d.code}>
                    <TableCell>
                      {d.code} · {d.name}
                    </TableCell>
                    <TableCell>{fmt1(d.gapRespAuto)}</TableCell>
                    <TableCell>{fmt1(d.gapPeerAuto)}</TableCell>
                    <TableCell>{fmt1(d.gapRespPeer)}</TableCell>
                    <TableCell>
                      <Badge tone={chipTone(gi.tag)}>{gi.label}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
      </Card>
    </>
  )
}

function HardAreaView() {
  const { state, lang, ui } = useAssessment()
  const APEX5D_DIMENSIONS = getApex5dDimensions(lang)
  const areas = [...new Set(state.employees.map((e) => e.area))]
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {areas.map((area) => {
        const emps = state.employees.filter((e) => e.area === area)
        const apex = round1(avg(emps.map((e) => computeHardSummary(e, lang).apexScore)))
        return (
          <Card key={area}>
            <CardHeader>
              <CardTitle>
                {area} <span className="text-app-small font-normal text-muted-foreground">{ui.softAreaEmpCount(emps.length)}</span>
              </CardTitle>
              <Badge className="ml-auto" tone={apex >= 7 ? 'success' : apex >= 5 ? 'warning' : 'destructive'} dot>
                {fmt1(apex)}
              </Badge>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {APEX5D_DIMENSIONS.map((dim) => {
                const v = round1(avg(emps.map((e) => computeHardSummary(e, lang).dims.find((d) => d.code === dim.code)!.mediaTotale)))
                return <StatTile key={dim.code} label={`${dim.code} · ${dim.name}`} value={v} benchmark={6.5} />
              })}
            </div>
          </Card>
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
                <TableHead>{ui.hardApexScoreCol}</TableHead>
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
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{ui.softSelectUpTo5}</CardTitle>
        </CardHeader>
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
        <div className="mt-3 flex flex-wrap gap-2">
          {emps.map((e) => (
            <Badge key={e.id} onRemove={() => remove(e.id)} removeLabel={ui.matchRemove(`${e.nome} ${e.cognome}`)}>
              {e.nome} {e.cognome}
            </Badge>
          ))}
        </div>
      </Card>
      {emps.length ? (
        <Card padding="none">
          <Table frame>
              <TableHeader>
                <TableRow>
                  <TableHead>{ui.colDimension}</TableHead>
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
                    <b>{ui.hardApexScoreCol}</b>
                  </TableCell>
                  {overallVals.map((v, i) => (
                    <MatchCell key={i} value={v} match={overallCls[i]} strong />
                  ))}
                </TableRow>
                {APEX5D_DIMENSIONS.map((dim) => {
                  const vals = emps.map((e) => computeHardSummary(e, lang).dims.find((d) => d.code === dim.code)!.mediaTotale)
                  const cls = matchCellClasses(vals)
                  return (
                    <TableRow key={dim.code}>
                      <TableCell>
                        {dim.code} · {dim.name}
                      </TableCell>
                      {vals.map((v, i) => (
                        <MatchCell key={i} value={v} match={cls[i]} />
                      ))}
                    </TableRow>
                  )
                })}
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
