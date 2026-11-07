import { ArrowRight, Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { ActionList, type ActionItem } from '@/components/patterns/ActionList'
import { BandCard } from '@/components/patterns/BandCard'
import { CategoryBars } from '@/components/patterns/CategoryBars'
import { ChartCard } from '@/components/patterns/ChartCard'
import { CompletionRing } from '@/components/patterns/CompletionRing'
import { DistributionBar } from '@/components/patterns/DistributionBar'
import { InfoTip } from '@/components/patterns/InfoTip'
import { CascadePlaceholder } from '@/components/patterns/CascadePlaceholder'
import { SummaryCard } from '@/components/patterns/SummaryCard'
import { Badge } from '@/components/ui/badge'
import { isDemoMode } from '@/lib/demo-mode'
import { PageHeader } from '@/components/patterns/PageHeader'
import { ScoreGauge } from '@/components/patterns/ScoreGauge'
import { StaggerList } from '@/components/patterns/StaggerList'
import { StatCard } from '@/components/patterns/StatCard'
import { TrendChart } from '@/components/patterns/TrendChart'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CSV_TYPE, downloadText } from '@/lib/download'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { allEvaluators, evStatus, norm } from '@/modules/assessment/gestione5p/model'
import { use5pState } from '@/modules/assessment/gestione5p/use5pState'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import {
  bothActive,
  computeAvgMetric,
  evaluatedEmployees,
  homeStats,
  lastDataUpdate,
  orgCriticalAreas,
  orgCriticalRoles,
  orgTrend,
  primaryScore,
  roleCoveragePct,
  tierFor,
  worstCompetenza,
} from '@/modules/assessment/lib/calculations'
import { fmt1csv, fmt1it, round1 } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentLang, getUI } from '@/modules/assessment/lib/legacy-utils'
import { TIER_BAND_TONE, TIER_DIST_TONE, TIER_ORDER, tierDescription, tierLabels } from '@/modules/assessment/lib/tier-display'
import type { AssessmentState } from '@/modules/assessment/lib/types'
import { assessmentResults } from '@/modules/assessment/lib/results'
import { roiEuro, useRoi } from '@/modules/assessment/lib/use-roi'

type UI = ReturnType<typeof getUI>

const signed = (n: number) => `${n > 0 ? '+' : ''}${fmt1it(n)}`

// La Panoramica di Assessment (CLAUDE.md, Fase 6, deciso il 2026-10-23):
// sostituisce la Home a folder card. Tutto visibile all'apertura, testo a
// sinistra, superfici neutre, ogni numero una volta con un'unità sola (il
// punteggio su 10, i conteggi in persone, le quote in percentuale). Dall'alto:
// intestazione (titolo e riga dal layout, scelta CT / CP / Completo nelle
// azioni), Stato attuale (quattro card, ognuna col suo piccolo grafico),
// Da fare adesso, Fasce (le cinque, con chi c'è dentro), Andamento (dallo
// storico vero delle valutazioni), Dove guardare. "In programma" non c'è:
// Assessment non ha date future (Piani di sviluppo non ha scadenze), e un
// calendario non si inventa. Solo dati che l'applicazione ha già.
//
// Due viste in un selettore in alto (CLAUDE.md, Fase 6, 2026-10-29):
// «Sintesi», per la direzione — valore a rischio e cascata (segnaposto in
// euro finché non c'è la formula), Da fare adesso (solo compiti), le quattro
// domande con il loro dato, le persone fascia per fascia, dove si perde valore
// (aree contro l'atteso tratteggiato), cosa fare in ordine di impatto (gli
// interventi, con le loro note modificabili) — e «Dettaglio», la Panoramica
// operativa, dove "Da fare adesso" non ripete gli interventi.
export default function AssessmentPanoramicaPage() {
  const { state, setState, lang, ui, canEdit, company } = useAssessment()
  const { state: s5 } = use5pState()
  const navigate = useNavigate()
  const [drawerId, setDrawerId] = useState<string | null>(null)

  const hs = homeStats(state, lang)
  const total = state.employees.length
  const both = bothActive(state)
  const f = { A: state.settings.modulo === 'A' || state.settings.modulo === 'AB', B: state.settings.modulo === 'B' || state.settings.modulo === 'AB' }
  const labels = tierLabels(ui)

  const res = ui.res
  // Gli euro dal motore ROI, quando il bilancio c'è (non blocca la pagina: finché non
  // risponde resta il segnaposto). Dove il motore non ha l'importo, resta il segnaposto.
  const roi = useRoi()
  const base = roi.status === 'ready' ? roi.scenarios?.base : undefined
  // La vista sta nell'indirizzo (?vista=dettaglio), non nel browser.
  const [params, setParams] = useSearchParams()
  const vista: 'sintesi' | 'dettaglio' = params.get('vista') === 'dettaglio' ? 'dettaglio' : 'sintesi'
  function setVista(next: string) {
    const q = new URLSearchParams(params)
    if (next === 'dettaglio') q.set('vista', 'dettaglio')
    else q.delete('vista')
    setParams(q, { replace: true })
  }
  const updated = lastDataUpdate(state)
  const updatedLabel = updated ? updated.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : null
  // L'intestazione è della pagina (`panoramica` non ha titolo in
  // PAGE_META_TEXT): nella Sintesi è il titolo della tavola, sulla scala del
  // sito; nel Dettaglio "Panoramica". Sovratitolo con società e data dei dati,
  // a destra la scelta della vista e la scelta CT / CP / Completo.
  const header = (
    <PageHeader
      level={vista === 'sintesi' ? 'presentation' : 'page'}
      className="mb-0"
      eyebrow={res.panoEyebrow(company?.name ?? '', updatedLabel)}
      title={vista === 'sintesi' ? res.sintesiTitle : res.panoTitle}
      actions={
        <>
          <ToggleGroup type="single" value={vista} onValueChange={(v) => v && setVista(v)} aria-label={res.viewLabel}>
            <ToggleGroupItem value="sintesi">{res.viewSintesi}</ToggleGroupItem>
            <ToggleGroupItem value="dettaglio">{res.viewDettaglio}</ToggleGroupItem>
          </ToggleGroup>
          <AssessmentModeSwitch />
        </>
      }
    />
  )

  // Stato attuale
  const evaluated = evaluatedEmployees(state).length
  const evaluatedPct = total ? Math.round((evaluated / total) * 100) : 0
  const roleCovPct = roleCoveragePct(state, lang)
  const gap = round1(hs.orgAvg - hs.benchmark)
  const critical = hs.tiers.critica.length
  const criticalPct = total ? Math.round((critical / total) * 100) : 0

  // L'andamento, dallo storico delle valutazioni (calculations.ts, orgTrend):
  // una linea per area attiva nella scelta CT / CP, il benchmark tratteggiato.
  const trend = useMemo(() => orgTrend(state), [state])
  const trendSeries = [
    ...(f.A ? [{ key: 'soft', label: ui.moduleASoft, kind: 'area' as const }] : []),
    ...(f.B ? [{ key: 'hard', label: ui.moduleBHard, kind: 'area' as const }] : []),
    { key: 'bench', label: `${ui.homeOrgTrendModeBenchmark} ${fmt1it(hs.benchmark)}`, reference: true },
  ]
  // Solo i mesi con un valore per ogni linea attiva: un buco disegnato a zero
  // sarebbe un dato falso.
  const trendPoints = trend.filter((t) => (!f.A || t.soft != null) && (!f.B || t.hard != null))
  const sparkPoints = trendPoints
    .map((t) => ({ date: t.date, v: avgOf([f.A ? t.soft : null, f.B ? t.hard : null]) }))
    .filter((t): t is { date: Date; v: number } => t.v != null)
  const lastTwo = trendPoints.slice(-2).map((t) => avgOf([f.A ? t.soft : null, f.B ? t.hard : null]))
  const trendDelta = lastTwo.length === 2 && lastTwo[0] != null && lastTwo[1] != null ? round1(lastTwo[1] - lastTwo[0]) : null

  // Da fare adesso, dalla più urgente. Le schede 5P: un valutatore senza
  // risposte e non ancora segnato come inviato ha la scheda da inviare; uno
  // segnato come inviato ma con risposte mancanti ha valutazioni da
  // raccogliere (gli stessi stati di "Invio schede"). Più le valutazioni
  // esterne in attesa.
  const evaluators = allEvaluators(s5)
  const toSend = evaluators.filter((e) => !s5.sent[norm(e.name)] && evStatus(s5, e.name).rec === 0).length
  const toCollect =
    evaluators.filter((e) => {
      const st = evStatus(s5, e.name)
      return !!s5.sent[norm(e.name)] && st.rec < st.exp
    }).length + state.evalAssignments.filter((a) => a.status === 'pending').length
  const worstSkill = worstCompetenza(state, lang, f)
  const note = (key: string, fallback: string): ActionItem['note'] => ({
    value: state.settings.actionNotes?.[key] ?? fallback,
    onChange: (v) => canEdit && setState((prev) => ({ ...prev, settings: { ...prev.settings, actionNotes: { ...prev.settings.actionNotes, [key]: v } } })),
    readOnly: !canEdit,
  })
  const people = ui.homeQ4PeopleUnit
  const todo: ActionItem[] = [
    { key: 'critical', label: ui.panoTodoCritical, description: ui.panoTodoCriticalDesc, count: critical, unit: people, to: '/assessment/valore?fascia=critica', linkLabel: ui.panoOpen },
    { key: 'feedback', label: ui.panoTodoFeedback, description: ui.panoTodoFeedbackDesc, count: hs.feedbackDue, unit: people, to: '/assessment/feedback', linkLabel: ui.panoOpen },
    { key: 'collect', label: ui.panoTodoCollect, description: ui.panoTodoCollectDesc, count: toCollect, unit: ui.panoEvaluatorsUnit, to: '/assessment/gestione-valutazioni', linkLabel: ui.panoOpen },
    { key: 'send', label: ui.panoTodoSend, description: ui.panoTodoSendDesc, count: toSend, unit: ui.panoEvaluatorsUnit, to: '/assessment/gestione-valutazioni', linkLabel: ui.panoOpen },
  ]
  // Le azioni di sviluppo per tipo, con la loro nota modificabile (salvata
  // nelle impostazioni del modulo, come nella vecchia Home). Non stanno in "Da
  // fare adesso" (sono interventi, non compiti: CLAUDE.md, Fase 6) ma in "Cosa
  // fare, in ordine di impatto" della Sintesi, dalla più ampia.
  const interventions: ActionItem[] = [
    { key: 'reorg', label: ui.azioniReorgShort, note: note('reorg', ui.azioniReorgDesc), count: hs.tiers.critica.length, unit: people, to: '/assessment/feedback', linkLabel: ui.panoOpen },
    { key: 'training', label: ui.azioniTraining, note: note('training', ui.azioniTrainingDesc(worstSkill ? worstSkill.name : ui.worstSkillFallback)), count: hs.tiers.sviluppo.length, unit: people, to: '/assessment/feedback', linkLabel: ui.panoOpen },
    { key: 'coaching', label: ui.azioniCoaching, note: note('coaching', ui.azioniCoachingDesc), count: hs.tiers.valorizzare.length, unit: people, to: '/assessment/feedback', linkLabel: ui.panoOpen },
    { key: 'talent', label: ui.azioniTalentShort, note: note('talent', ui.azioniTalentDesc), count: hs.tiers.top.length, unit: people, to: '/assessment/feedback', linkLabel: ui.panoOpen },
  ]
  interventions.sort((a, b) => b.count - a.count)

  // Le quattro domande, ognuna con il suo dato (le stesse quote delle pagine dei risultati).
  const rd = useMemo(() => assessmentResults(state, lang), [state, lang])
  // Dove si perde valore: tutte le aree, dalla più bassa, contro l'atteso tratteggiato.
  const lossRows = orgCriticalAreas(state, lang, 50).map((a) => ({ label: a.area, values: { avg: a.avg, atteso: hs.benchmark } }))
  const worstLoss = lossRows[0] && lossRows[0].values.avg < hs.benchmark ? lossRows[0].label : undefined

  // Le persone per fascia, dalla più alta in punteggio (per le prime tre).
  const ranked = useMemo(
    () =>
      state.employees
        .map((e) => ({ e, score: primaryScore(e, state, lang) }))
        .map((r) => ({ ...r, tier: tierFor(r.score, lang).key }))
        .sort((a, b) => b.score - a.score),
    [state, lang],
  )

  const bands = (sintesi: boolean) =>
    TIER_ORDER.map((k) => (
      <BandCard
        key={k}
        label={labels[k]}
        tone={TIER_BAND_TONE[k]}
        description={tierDescription(k, ui, lang)}
        count={hs.tiers[k].length}
        total={total}
        unit={{ one: ui.bandPersonOne, many: people }}
        people={ranked.filter((r) => r.tier === k).map((r) => ({ id: r.e.id, name: `${r.e.nome} ${r.e.cognome}`, meta: r.e.ruolo || r.e.mansione, score: `${fmt1it(r.score)} /10`, onClick: () => setDrawerId(r.e.id) }))}
        onSeeAll={() => navigate(`/assessment/valore?fascia=${k}`)}
        seeAllLabel={ui.bandSeeAll}
        emptyText={ui.bandEmpty}
        showPeople={!(sintesi && k === 'adeguata')}
        bare={sintesi}
      />
    ))

  // Dove guardare: aree e mansioni sotto il benchmark, dalla più lontana.
  const gapRows = (list: { label: string; avg: number }[]) =>
    list
      .map((r) => ({ label: r.label, gap: round1(hs.benchmark - r.avg) }))
      .filter((r) => r.gap > 0.05)
      .sort((a, b) => b.gap - a.gap)
  const gapAreas = gapRows(orgCriticalAreas(state, lang, 6).map((a) => ({ label: a.area, avg: a.avg })))
  const gapRoles = gapRows(orgCriticalRoles(state, lang, 6).map((r) => ({ label: r.ruolo, avg: r.avg })))
  const competenze = both ? (computeAvgMetric(state, lang, 'soft') <= computeAvgMetric(state, lang, 'hard') ? 'soft-overview' : 'hard-overview') : f.A ? 'soft-overview' : 'hard-overview'

  const dettaglio = (
    <>
      <section>
        <PageHeader title={ui.panoStatusTitle} />
        {/* Quattro card in riga, ognuna col suo grafico piccolo. Il numero si
            scrive una volta: nel punteggio lo porta il Gauge al centro, nelle
            altre la card (gli anelli non hanno numero al centro). */}
        <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {evaluated ? (
            <StatCard label={ui.panoScore} note={[ui.panoScoreGap(signed(gap)), trendDelta != null ? ui.panoTrendDelta(signed(trendDelta)) : null].filter(Boolean).join(' · ')}>
              <ScoreGauge size="sm" value={hs.orgAvg} label={ui.panoGaugeBench(fmt1it(hs.benchmark))} />
              {/* La sparkline dell'andamento, sotto il Gauge (CLAUDE.md, Fase 6). */}
              {sparkPoints.length >= 2 ? (
                <TrendChart
                  title={ui.panoTrendTitle}
                  variant="spark"
                  scale={{ left: [0, 10] }}
                  format={fmt1it}
                  series={[{ key: 'v', label: ui.panoScore, kind: 'area' }]}
                  points={sparkPoints.map((p) => ({ date: p.date, label: monthLabel(p.date), values: { v: p.v } }))}
                />
              ) : null}
            </StatCard>
          ) : (
            <StatCard label={ui.panoScore} valueKind="text" value={ui.panoScorePending} note={ui.panoScorePendingNote} />
          )}
          <StatCard label={ui.panoCoverage} value={roleCovPct} unit="%" note={ui.panoCoverageNote}>
            <CompletionRing value={roleCovPct} label={ui.panoCoverage} className="mx-0" />
          </StatCard>
          <StatCard label={ui.panoEvaluated} value={evaluated} unit={people} note={ui.panoEvaluatedNote(total)}>
            <CompletionRing value={evaluatedPct} label={ui.panoEvaluated} className="mx-0" />
          </StatCard>
          <StatCard label={ui.panoCritical} value={critical} unit={people} tone={critical ? 'destructive' : 'neutral'} note={ui.panoCriticalNote(labels.critica, criticalPct)}>
            <CompletionRing tone="destructive" value={criticalPct} label={ui.panoCritical} className="mx-0" />
          </StatCard>
        </StaggerList>
      </section>

      <section>
        <PageHeader
          title={ui.panoTodoTitle}
          description={ui.panoTodoSub}
          actions={
            <Button type="button" variant="ghost" size="sm" onClick={() => exportActionPlan(state, lang, ui)}>
              <Download aria-hidden="true" />
              {ui.panoExportPlan}
            </Button>
          }
        />
        <ActionList items={todo} empty={{ title: ui.panoTodoEmpty, description: ui.panoTodoEmptySub }} />
      </section>

      {/* Le cinque fasce, una classificazione sola: ognuna dice chi c'è dentro
          (CLAUDE.md, Fase 5) — soglia, persone e quota, le prime tre per
          punteggio (il clic apre la scheda), "Vedi tutte" → Valori Complessivi
          filtrato sulla fascia. Sopra, la distribuzione. */}
      <section>
        <PageHeader title={ui.panoBandsTitle} description={ui.panoDistSub(total)} actions={<SeeMore to="/assessment/valore">{ui.panoDistLink}</SeeMore>} />
        {total ? (
          <div className="flex flex-col gap-4">
            <Card>
              <DistributionBar
                segments={TIER_ORDER.map((k) => ({
                  key: k,
                  label: labels[k],
                  pct: (hs.tiers[k].length / total) * 100,
                  tone: TIER_DIST_TONE[k],
                  display: `${hs.tiers[k].length} · ${Math.round((hs.tiers[k].length / total) * 100)}%`,
                }))}
              />
            </Card>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{bands(false)}</div>
          </div>
        ) : (
          <Card>
            <p className="text-app-small text-muted-foreground">{ui.panoEmptySub}</p>
          </Card>
        )}
      </section>

      {/* L'andamento a tutta riga: linee pulite, senza riempimento né sfumature. */}
      <section>
        <PageHeader title={ui.panoTrendTitle} description={ui.panoTrendSub} actions={<SeeMore to="/assessment/valore">{ui.panoDistLink}</SeeMore>} />
        <ChartCard
          title={ui.panoTrendTitle}
          description={trendPoints.length >= 2 ? `${monthLabel(trendPoints[0].date)} — ${monthLabel(trendPoints[trendPoints.length - 1].date)}` : undefined}
          height="lg"
          empty={trendPoints.length >= 2 ? undefined : { title: ui.panoTrendEmpty, description: ui.panoTrendEmptySub }}
        >
          <TrendChart
            title={ui.panoTrendTitle}
            scale={{ left: [0, 10] }}
            height="lg"
            format={fmt1it}
            series={trendSeries}
            points={trendPoints.map((t) => ({ date: t.date, label: monthLabel(t.date), values: { soft: t.soft, hard: t.hard, bench: hs.benchmark } }))}
          />
        </ChartCard>
      </section>

      <section>
        <PageHeader
          title={ui.panoWhereTitle}
          description={ui.panoGapSub(fmt1it(hs.benchmark))}
          actions={
            <Button type="button" variant="ghost" size="sm" onClick={() => exportValoreReport(state, lang, ui)}>
              <Download aria-hidden="true" />
              {ui.panoExportReport}
            </Button>
          }
        />
        <StaggerList className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[
            { title: ui.panoGapAreasTitle, rows: gapAreas },
            { title: ui.panoGapRolesTitle, rows: gapRoles },
          ].map((c) => (
            <ChartCard
              key={c.title}
              title={c.title}
              height="md"
              empty={!total ? { title: ui.panoEmptyTitle, description: ui.panoEmptySub } : c.rows.length ? undefined : { title: ui.panoGapNone }}
              footer={<SeeMore to={`/assessment/${competenze}`}>{ui.panoGapLink}</SeeMore>}
            >
              <CategoryBars
                title={c.title}
                orientation="horizontal"
                valueMax={Math.max(2, Math.ceil(Math.max(...c.rows.map((r) => r.gap), 0)))}
                format={fmt1it}
                height="sm"
                className="h-full"
                series={[{ key: 'gap', label: ui.f3GapSeries }]}
                rows={c.rows.map((r) => ({ label: r.label, values: { gap: r.gap } }))}
              />
            </ChartCard>
          ))}
        </StaggerList>
      </section>

    </>
  )

  // La Sintesi, sulla tavola «Panoramica · Sintesi»: valore a rischio e
  // cascata (segnaposto finché non c'è la formula), le quattro domande con il
  // loro dato, Da fare adesso, dove si perde valore accanto a cosa fare in
  // ordine di impatto, le persone fascia per fascia in una card sola.
  const activeActions = interventions.filter((i) => i.count > 0)
  const peopleInActions = activeActions.reduce((n, i) => n + i.count, 0)
  const win = (slug: string) => res.windows.find((w: { slug: string }) => w.slug === slug) as { slug: string; number: string; title: string; q: string }
  const summaryLink = (slug: string) => ({ label: (res.sumLinks as Record<string, string>)[slug], to: `/assessment/${slug}` })

  const sintesi = (
    <>
      <Card padding="lg" className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-3">
          <p className="label-mono text-muted-foreground">{res.riskTitle}</p>
          <span className="text-site-h2 text-foreground md:text-site-h1">{base ? roiEuro(base.pool) : '€ [—]'}</span>
          <Badge>{base ? res.roiTagEstimate : roi.status === 'blocked' ? res.roiBlocked : res.riskPending}</Badge>
          <p className="flex max-w-prose items-start gap-1 text-app-body text-muted-foreground">
            <span>{base ? res.riskReady : res.riskRange}</span>
            <InfoTip label={res.riskHow}>{res.riskHowText}</InfoTip>
          </p>
          <p className="text-app-subtitle font-semibold text-foreground">{res.riskActions(activeActions.length, base ? roiEuro(base.benefit) : null)}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/assessment/feedback">{res.openPlan}</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/assessment/ai">{res.askAssistant}</Link>
            </Button>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <p className="label-mono text-muted-foreground">{res.cascadeTitle}</p>
          <CascadePlaceholder steps={res.cascadeSteps(activeActions.map((a) => a.label))} note={base ? res.cascadeReady : res.cascadeEmpty} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          number={win('il-valore').number}
          title={win('il-valore').title}
          question={win('il-valore').q}
          value={evaluated ? fmt1it(hs.orgAvg) : undefined}
          unit={evaluated ? '/10' : undefined}
          note={evaluated ? res.sumScoreNote(fmt1it(hs.benchmark), trendDelta != null ? ui.panoTrendDelta(signed(trendDelta)) : null) : res.sumScorePending}
          link={summaryLink('il-valore')}
        >
          {sparkPoints.length >= 2 ? (
            <TrendChart
              title={ui.panoTrendTitle}
              variant="compact"
              scale={{ left: [0, 10] }}
              format={fmt1it}
              markLast="v"
              series={[
                { key: 'v', label: ui.panoScore, kind: 'area' },
                { key: 'b', label: res.lossRef(fmt1it(hs.benchmark)), reference: true },
              ]}
              points={sparkPoints.map((pt) => ({ date: pt.date, label: monthLabel(pt.date), values: { v: pt.v, b: hs.benchmark } }))}
            />
          ) : null}
        </SummaryCard>
        <SummaryCard
          number={win('perdite-invisibili').number}
          title={win('perdite-invisibili').title}
          question={win('perdite-invisibili').q}
          value={rd.total ? rd.below : undefined}
          unit={rd.total ? res.sumBelow(rd.below, rd.total) : undefined}
          note={rd.total ? undefined : res.noTestsTitle}
          link={summaryLink('perdite-invisibili')}
        >
          <ul className="flex flex-col gap-1 text-app-small">
            {(res.sumLossItems as string[]).map((item, i) => {
              // Competenze mancanti, turnover, assenze dal motore; le inefficienze non le ha.
              const amount = base ? [base.gapVal, base.turnVal, base.assVal][i] : undefined
              return (
                <li key={item} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{item}</span>
                  <span className="font-mono text-foreground">{amount != null ? roiEuro(amount) : '€ [—]'}</span>
                </li>
              )
            })}
          </ul>
          {base ? null : <p className="text-app-caption text-muted-foreground">{res.sumLossNote}</p>}
        </SummaryCard>
        <SummaryCard
          number={win('potenziale').number}
          title={win('potenziale').title}
          question={win('potenziale').q}
          value={rd.total ? rd.above : undefined}
          unit={rd.total ? res.sumAbove(rd.above, rd.total) : undefined}
          note={rd.total ? undefined : res.noTestsTitle}
          link={summaryLink('potenziale')}
        >
          {rd.total ? (
            <DistributionBar
              segments={TIER_ORDER.map((k) => ({
                key: k,
                label: labels[k],
                pct: (rd.byTier[k].length / rd.total) * 100,
                tone: TIER_DIST_TONE[k],
                display: String(rd.byTier[k].length),
              }))}
            />
          ) : null}
        </SummaryCard>
        <SummaryCard
          number={win('dove-intervenire').number}
          title={win('dove-intervenire').title}
          question={win('dove-intervenire').q}
          value={res.sumActions(activeActions.length, peopleInActions)}
          note={res.sumActionsNote(base ? roiEuro(base.benefit) : null)}
          link={summaryLink('dove-intervenire')}
        />
      </div>

      <section>
        <PageHeader title={ui.panoTodoTitle} description={ui.panoTodoSub} actions={<SeeMore to="/assessment/feedback">{res.seeAll}</SeeMore>} />
        <ActionList items={todo} empty={{ title: ui.panoTodoEmpty, description: ui.panoTodoEmptySub }} />
      </section>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <section>
          <PageHeader title={res.lossTitle} description={res.lossSub(fmt1it(hs.benchmark))} actions={<SeeMore to={`/assessment/${competenze}`}>{ui.panoGapLink}</SeeMore>} />
          <ChartCard
            title={res.lossTitle}
            height="auto"
            empty={lossRows.length ? undefined : { title: res.lossNone }}
            footer={
              <p className="flex justify-between gap-2 text-app-small">
                <span className="font-semibold text-foreground">{res.lossTotal}</span>
                <span className="font-mono text-foreground">{base ? roiEuro(base.pool) : '€ [—]'}</span>
              </p>
            }
          >
            <CategoryBars
              title={res.lossTitle}
              orientation="horizontal"
              compact
              valueMax={10}
              format={fmt1it}
              series={[
                { key: 'avg', label: res.lossSeries },
                { key: 'atteso', label: res.lossRef(fmt1it(hs.benchmark)), reference: true },
              ]}
              rows={lossRows}
              highlight={worstLoss}
            />
          </ChartCard>
        </section>
        <section>
          <PageHeader title={res.impactTitle} description={base ? res.impactSubReady : res.impactSub} />
          <ActionList
            ranked
            items={interventions.map((i) => ({ ...i, value: '€ [—]' }))}
            empty={{ title: ui.panoTodoEmpty, description: ui.panoTodoEmptySub }}
            footer={
              <>
                <p className="flex justify-between gap-2 text-app-small">
                  <span className="font-semibold text-foreground">{res.impactTotal}</span>
                  <span className="font-mono text-foreground">{base ? roiEuro(base.benefit) : '€ [—]'}</span>
                </p>
                <Button asChild>
                  <Link to="/assessment/feedback">{res.openPlan}</Link>
                </Button>
              </>
            }
          />
        </section>
      </div>

      <section>
        <PageHeader title={res.peopleTitle} description={ui.panoDistSub(total)} actions={<SeeMore to="/assessment/valore">{ui.panoDistLink}</SeeMore>} />
        <Card padding="lg">
          {total ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-5">{bands(true)}</div>
          ) : (
            <p className="text-app-small text-muted-foreground">{ui.panoEmptySub}</p>
          )}
        </Card>
      </section>

      <footer className="flex flex-wrap justify-between gap-3 border-t border-border pt-4 text-app-caption text-muted-foreground">
        <span>{isDemoMode() ? `Dati dimostrativi · ${company?.name ?? '—'} · ${res.peopleCount(total)}` : res.peopleCount(total)}</span>
        {base ? null : <span>{res.euroFooter}</span>}
      </footer>
    </>
  )

  return (
    <div className="flex flex-col gap-8">
      {header}
      {vista === 'sintesi' ? sintesi : dettaglio}
      {drawerId && <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} />}
    </div>
  )
}

const avgOf = (vals: (number | null)[]): number | null => {
  const v = vals.filter((x): x is number => x != null)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}
const monthLabel = (d: Date) => d.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })

function SeeMore({ to, children }: { to: string; children: string }) {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link to={to}>
        {children}
        <ArrowRight />
      </Link>
    </Button>
  )
}

// Il piano d'azione in CSV (era "Esporta Piano d'Azione" della vecchia Home):
// stesse quattro righe, stesse colonne, stesso nome del file.
function exportActionPlan(state: AssessmentState, lang: AssessmentLang, ui: UI) {
  const hs = homeStats(state, lang)
  const f = { A: state.settings.modulo === 'A' || state.settings.modulo === 'AB', B: state.settings.modulo === 'B' || state.settings.modulo === 'AB' }
  const worstSkill = worstCompetenza(state, lang, f)
  const worstSkillLabel = worstSkill ? worstSkill.name : ui.worstSkillFallback
  const rows = [
    [ui.azioniTraining, ui.azioniTrainingDesc(worstSkillLabel), hs.tiers.sviluppo.length],
    [ui.azioniCoaching, ui.azioniCoachingDesc, hs.tiers.valorizzare.length],
    [ui.azioniReorgFull, ui.azioniReorgDesc, hs.tiers.critica.length],
    [ui.azioniTalentFull, ui.azioniTalentDesc, hs.tiers.top.length],
  ]
  let csv = ui.exportPlanCsvHeader + '\n'
  rows.forEach((r) => {
    csv += r.join(';') + '\n'
  })
  downloadText('action_plan.csv', csv, CSV_TYPE)
}

// Il report del valore in CSV (era "Esporta Report" della vecchia Home): stesse
// colonne e stesso nome del file. Il punteggio complessivo è su 10, come a
// schermo (prima era una percentuale, "60%").
function exportValoreReport(state: AssessmentState, lang: AssessmentLang, ui: UI) {
  const hs = homeStats(state, lang)
  const roleCovPct = roleCoveragePct(state, lang)
  let csv = ui.exportValoreCsvHeader + '\n'
  csv += [fmt1it(hs.orgAvg) + '/10', fmt1it(hs.benchmark), roleCovPct + '%', state.employees.length].join(';') + '\n\n'
  csv += ui.exportValoreCsvEmployeeHeader + '\n'
  state.employees.forEach((e) => {
    csv += [e.cognome, e.nome, e.ruolo, e.area, fmt1csv(primaryScore(e, state, lang))].join(';') + '\n'
  })
  downloadText('report_valore.csv', csv, CSV_TYPE)
}
