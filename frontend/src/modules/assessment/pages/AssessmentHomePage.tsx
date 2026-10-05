import { AlertTriangle, ArrowRight, Award, ArrowUpRight, Briefcase, GraduationCap, ListChecks, MapPin, Sparkles, TrendingDown, TrendingUp, UserX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CoinsLossIcon, GearAlertIcon, LightbulbGemIcon } from '@/components/patterns/CardIcons'
import { CategoryBars } from '@/components/patterns/CategoryBars'
import { ChartCard } from '@/components/patterns/ChartCard'
import { DistributionBar } from '@/components/patterns/DistributionBar'
import type { DistributionTone } from '@/components/patterns/DistributionBar'
import { PageHeader } from '@/components/patterns/PageHeader'
import { SkillVisionCard } from '@/components/patterns/SkillVisionCard'
import { StatCard } from '@/components/patterns/StatCard'
import type { StatTone } from '@/components/patterns/StatCard'
import { CrossModuleBanner } from '@/components/patterns/CrossModuleBanner'
import { usePersistedFlag } from '@/hooks/use-persisted-flag'
import { DecisionRow } from '@/modules/assessment/components/DecisionRow'
import type { DecisionTone } from '@/modules/assessment/components/DecisionRow'
import { lastSixMonthLabels } from '@/modules/assessment/lib/months'
import { TrendChart } from '@/components/patterns/TrendChart'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { ModeSwitch } from '@/modules/assessment/components/ModeSwitch'
import { ValoreCard } from '@/modules/assessment/components/ValoreCard'
import { ValueMap, type MapPerson } from '@/modules/assessment/components/ValueMap'
import { homeCardLayout } from '@/lib/home-card-layout'
import { useAssessment, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import {
  bothActive,
  computeAvgMetric,
  computeHardSummary,
  computeSoftSummary,
  homeStats,
  orgCriticalAreas,
  orgCriticalRoles,
  primaryScore,
  quadDefs,
  roleCoveragePct,
  tierFor,
  worstCompetenza,
} from '@/modules/assessment/lib/calculations'
import { fmt1, fmt1csv, fmt1it, round1 } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentLang } from '@/modules/assessment/lib/legacy-utils'
import type { getUI } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentState } from '@/modules/assessment/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/patterns/EmptyState'

// Migrated from renderHome() (js/assessment.js ~4464-4726) — same 4 KPI
// quadrants (Q1 status / Q2 problem areas / Q3 talent classification / Q4
// priority actions), same module A/B merge-diagram toggle, same bottom KPI
// row + Module A totalizer. Collapse/expand accordion state is real React
// state now instead of the DOM class toggle toggleHomeCard() used.
// La finestra a fondo pagina "una sola lettura" è parcheggiata (Foglio 3).
const SHOW_CROSS_MODULE_BANNER = false

export default function AssessmentHomePage() {
  const { state, setState, lang, ui, canEdit } = useAssessment()
  const navigate = useNavigate()

  const hs = homeStats(state, lang)
  const f = { A: state.settings.modulo === 'A' || state.settings.modulo === 'AB', B: state.settings.modulo === 'B' || state.settings.modulo === 'AB' }
  const totalEmp = state.employees.length
  const both = bothActive(state)

  // The Modulo A/B/Completo toggle lives in the topbar, matching the
  // concept's single header row. "Sistema Attivo" is gone: it did not
  // reflect any real state (CLAUDE.md, capitolo 7).
  // setModuleExclusive is a hoisted function declaration (defined further
  // down), so it's safely callable here despite the textual order.
  useTopbarActions(<ModeSwitch value={both ? 'AB' : f.A ? 'A' : 'B'} onChange={setModuleExclusive} ui={ui} />, [ui, both, f.A, f.B])

  // Phase 3: no real monthly history exists anywhere in demo-data.ts, so
  // this is the same "illustrative walk anchored to today's real number"
  // treatment as AssessmentCustomerCarePage.tsx's customerCareModel()
  // trend — the last point is always exactly the live hs.orgAvg, the 5
  // before it are a deterministic seeded walk backward from it.
  const orgTrendSeries = buildOrgTrendSeries(hs.orgAvg)
  const trendMonths = lastSixMonthLabels()
  const [trendMode, setTrendMode] = useState<'media' | 'benchmark'>('media')
  const trendLast = orgTrendSeries[orgTrendSeries.length - 1]
  const trendPrev = orgTrendSeries[orgTrendSeries.length - 2] ?? trendLast
  const trendDeltaVsPrev = round1(trendLast - trendPrev)
  const trendDeltaVsBenchmark = round1(trendLast - hs.benchmark)
  const trendDelta = trendMode === 'benchmark' ? trendDeltaVsBenchmark : trendDeltaVsPrev
  const trendDeltaBase = trendMode === 'benchmark' ? hs.benchmark : trendPrev
  const trendDeltaPct = trendDeltaBase ? round1((trendDelta / trendDeltaBase) * 100) : 0
  const trendDirection = Math.abs(trendDelta) < 0.05 ? 'flat' : trendDelta > 0 ? 'up' : 'down'

  const overallPct = Math.round((hs.orgAvg / 10) * 100)
  const roleCovPct = roleCoveragePct(state, lang)
  const avgGap = round1(hs.orgAvg - hs.benchmark)
  const avgGapPct = hs.benchmark ? round1(((hs.orgAvg - hs.benchmark) / hs.benchmark) * 100) : 0
  // Share of the workforce in the "Da Valorizzare" tier — used by the
  // cross-module banner's "Da Valorizzare" stat.
  const gPct = totalEmp ? Math.round((hs.valueCount / totalEmp) * 100) : 0
  // Il Valore breakdown — same exhaustive tier union homeStats() documents:
  // Ottimale = top + valorizzare, Moderato = adeguata, Critico = the rest
  // (sviluppo + critica), so the three always sum to 100.
  const ottimalePct = gPct
  const moderatoPct = totalEmp ? Math.round((hs.nellaNormaCount / totalEmp) * 100) : 0
  const valoreBreakdown = { ottimale: ottimalePct, moderato: moderatoPct, critico: totalEmp ? 100 - ottimalePct - moderatoPct : 0 }

  const worstArea = orgCriticalAreas(state, lang, 1)[0]
  const worstRole = orgCriticalRoles(state, lang, 1)[0]
  // Cross-module banner stat: a real count of roles below benchmark, not
  // just the top-1 "worst role" above — orgCriticalRoles(n) always returns
  // its top n regardless of severity, so getting every role and filtering
  // by the same benchmark used everywhere else on this page is what makes
  // this an honest "at risk" count instead of a fixed top-3.
  const rolesAtRiskCount = orgCriticalRoles(state, lang, Number.MAX_SAFE_INTEGER).filter((r) => r.avg < hs.benchmark).length
  const pendingEvalsCount = state.evalAssignments.filter((a) => a.status === 'pending').length
  const worstSkill = worstCompetenza(state, lang, f)
  // Bug fix: this used to always land on 'valore' ("Valori Complessivi")
  // when both modules were active — a different screen entirely (overall
  // individual value, not an organizational problem breakdown), so "Vedi
  // Analisi Dettagliata" never actually showed the detailed analysis of
  // the critical area this card itself just computed. Now routes to
  // whichever domain's results page (soft/hard) is the more critical one —
  // the lower of the two average metrics — or the single active module's
  // results page when only one is active.
  const softAvgForDetail = computeAvgMetric(state, lang, 'soft')
  const hardAvgForDetail = computeAvgMetric(state, lang, 'hard')
  const detailPage = both ? (softAvgForDetail <= hardAvgForDetail ? 'soft-risultati' : 'hard-risultati') : f.A ? 'soft-risultati' : 'hard-risultati'

  const tiers = hs.tiers
  const azioni = [
    { key: 'training', label: ui.azioniTraining, desc: ui.azioniTrainingDesc(worstSkill ? worstSkill.name : ui.worstSkillFallback), count: tiers.sviluppo.length, variant: 'warning', Icon: GraduationCap },
    { key: 'coaching', label: ui.azioniCoaching, desc: ui.azioniCoachingDesc, count: tiers.valorizzare.length, variant: 'success', Icon: TrendingUp },
    { key: 'reorg', label: ui.azioniReorgShort, desc: ui.azioniReorgDesc, count: tiers.critica.length, variant: 'danger', Icon: AlertTriangle },
    { key: 'talent', label: ui.azioniTalentShort, desc: ui.azioniTalentDesc, count: tiers.top.length, variant: 'accent', Icon: Award },
  ] as const

  function setModuleExclusive(mode: 'A' | 'B' | 'AB') {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, modulo: mode } }))
  }

  function saveActionNote(key: string, value: string) {
    if (!canEdit) return
    setState((prev) => ({ ...prev, settings: { ...prev.settings, actionNotes: { ...prev.settings.actionNotes, [key]: value } } }))
  }

  // Phase 4: Le Decisioni tab filter. "Completate" has no real source —
  // no action/note carries a completion flag anywhere in AssessmentState —
  // so it ships as an honest empty state rather than a fabricated count.
  const [decisioniTab, setDecisioniTab] = useState<'tutte' | 'urgenti' | 'completate'>('tutte')

  // Skill Vision open state per card (remembered per browser) and the grid
  // placement that follows from it — see homeCardLayout().
  const [openValore, setOpenValore] = usePersistedFlag('sv-assessment-home-valore-view', 'skillvision', 'oggi')
  const [openCapitale, setOpenCapitale] = usePersistedFlag('sv-assessment-home-capitale-view', 'skillvision', 'oggi')
  const [openPerdite, setOpenPerdite] = usePersistedFlag('sv-assessment-home-perdite-view', 'skillvision', 'oggi')
  const [openDecisioni, setOpenDecisioni] = usePersistedFlag('sv-assessment-home-decisioni-view', 'skillvision', 'oggi')
  const cardLayout = homeCardLayout(
    [
      ['valore', 'capitale'],
      ['perdite', 'decisioni'],
    ] as const,
    { valore: openValore, capitale: openCapitale, perdite: openPerdite, decisioni: openDecisioni },
  )

  const skillVisionLabels = { today: ui.homeTodayLabel, skillVision: ui.homeSkillVisionLabel }

  // La mappa dei valori: ogni dipendente con i due punteggi e la sua fascia.
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const mapPeople = useMemo<MapPerson[]>(
    () =>
      state.employees.map((e) => {
        const combined = primaryScore(e, state, lang)
        return { id: e.id, first: e.nome, last: e.cognome, role: e.ruolo, soft: computeSoftSummary(e, lang).overallOttenuto, hard: computeHardSummary(e, lang).apexScore, combined, tier: tierFor(combined, lang).key }
      }),
    [state, lang],
  )
  // Le etichette delle fasce sono quelle della finestra ("Da Potenziare", ...).
  const mapGroups = useMemo(() => quadDefs(ui).map((q) => ({ key: q.key, label: q.label, color: TIER_COLORS[q.key] })), [ui])

  // Dove il valore si ferma: quanto la media di aree e mansioni resta sotto il
  // benchmark (solo quelle sotto, dalla più lontana).
  const gapRows = (list: { label: string; avg: number }[]) =>
    list
      .map((r) => ({ label: r.label, gap: round1(hs.benchmark - r.avg) }))
      .filter((r) => r.gap > 0.05)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 6)
  const gapAreas = gapRows(orgCriticalAreas(state, lang, 6).map((a) => ({ label: a.area, avg: a.avg })))
  const gapRoles = gapRows(orgCriticalRoles(state, lang, 6).map((r) => ({ label: r.ruolo, avg: r.avg })))

  return (
    <div>
      <PageHeader title={ui.homeStatusTitle} description={ui.homeStatusSub} />

      <div className="mb-6 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        {/* Foglio 3 (Roberto Feliciani): le quattro card mostrano solo titolo,
            sottotitolo, domanda e spiegazione. I pulsanti di approfondimento
            non stanno più sulla card ma nel pannello che si apre con "Skill
            Vision", dove compaiono i primi dati. */}
        <ValoreCard
          ui={ui}
          overallPct={overallPct}
          roleCovPct={roleCovPct}
          benchmark={hs.benchmark}
          avgGap={avgGap}
          avgGapPct={avgGapPct}
          breakdown={valoreBreakdown}
          open={openValore}
          onOpenChange={setOpenValore}
          style={cardLayout.valore}
          panelActions={
            <>
              <Button type="button" size="sm" onClick={() => navigate(`/assessment/${detailPage}`)}>
                {ui.homeQ1ViewDetails}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/assessment/${detailPage === 'soft-risultati' ? 'soft' : 'hard'}?view=area`)}>
                {ui.homeQ1CompareAreas}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exportValoreReport(state, lang, ui)}>
                {ui.homeQ1ExportReport}
              </Button>
            </>
          }
        />

        {/* Finestra 2 — La mappa dei valori: i tre riquadri per fascia, la
            distribuzione e, soprattutto, la mappa di ogni dipendente
            (competenze trasversali × professionali) con le zone da
            interrogare con il mouse. "Vedi analisi" sta qui, non sulla card. */}
        <SkillVisionCard
          iconSide="end"
          icon={LightbulbGemIcon}
          title={ui.homeQ3Title}
          subtitle={ui.homeQ3Kicker}
          headline={ui.homeQ3Headline}
          description={ui.homeQ3Description}
          labels={skillVisionLabels}
          open={openCapitale}
          onOpenChange={setOpenCapitale}
          style={cardLayout.capitale}
          panel={
            <div className="flex flex-col gap-3">
              {both ? (
                <ValueMap
                  ui={ui}
                  people={mapPeople}
                  groups={mapGroups}
                  onPersonClick={setDrawerId}
                />
              ) : (
                <div className="flex flex-col items-start gap-3 rounded-md border-2 border-primary bg-card p-4 shadow-[0_8px_16px_0_var(--border-strong)]">
                  <p className="text-app-small text-muted-foreground">{ui.f3MapNeedBoth}</p>
                  <Button type="button" size="sm" onClick={() => setModuleExclusive('AB')}>
                    {ui.f3MapShowBoth}
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {quadDefs(ui)
                  .filter((q) => q.key === 'valorizzare' || q.key === 'top' || q.key === 'critica')
                  .map((q) => {
                    const count = tiers[q.key].length
                    const pct = totalEmp ? Math.round((count / totalEmp) * 100) : 0
                    return <StatCard key={q.key} elevated tone={TIER_TILE[q.key].tone} icon={TIER_TILE[q.key].Icon} label={q.label} value={count} note={`${pct}%`} progress={pct} />
                  })}
              </div>
              <div className="rounded-md border-2 border-primary bg-card p-4 shadow-[0_8px_16px_0_var(--border-strong)]">
                <DistributionBar
                  label={ui.homeQ3DistributionLabel}
                  segments={[...quadDefs(ui)].sort((x, y) => TIER_ORDER.indexOf(x.key) - TIER_ORDER.indexOf(y.key)).map((q) => ({
                    key: q.key,
                    label: q.label,
                    pct: totalEmp ? (tiers[q.key].length / totalEmp) * 100 : 0,
                    tone: TIER_DIST[q.key],
                  }))}
                />
              </div>
              <div className="flex justify-center">
                <Button type="button" variant="outline" size="sm" onClick={() => navigate('/assessment/valore')}>
                  {ui.homeQ3ViewAnalysis} <ArrowUpRight />
                </Button>
              </div>
            </div>
          }
        />

        {/* Finestra 3 — Le perdite invisibili: dove il valore si ferma, con le
            aree e le mansioni più sotto il benchmark in grafico, l'andamento
            e "Vedi analisi dettagliata" nel pannello. */}
        <SkillVisionCard
          iconSide="end"
          icon={CoinsLossIcon}
          title={ui.homeQ2Title}
          subtitle={ui.homeQ2Kicker}
          headline={ui.homeQ2Headline}
          description={ui.homeQ2Description}
          labels={skillVisionLabels}
          open={openPerdite}
          onOpenChange={setOpenPerdite}
          style={cardLayout.perdite}
          panel={
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard
                  elevated
                  tone="destructive"
                  icon={MapPin}
                  valueKind="text"
                  label={ui.homeQ2MostCriticalArea}
                  value={worstArea ? worstArea.area : '—'}
                  note={worstArea ? ui.homeQ2Gap(fmt1it(round1(worstArea.avg - hs.benchmark))) : undefined}
                />
                <StatCard
                  elevated
                  icon={Briefcase}
                  valueKind="text"
                  label={ui.homeQ2RoleAtRisk}
                  value={worstRole ? worstRole.ruolo : '—'}
                  note={worstRole ? ui.homeQ2Gap(fmt1it(round1(worstRole.avg - hs.benchmark))) : undefined}
                />
                <StatCard
                  elevated
                  tone="warning"
                  icon={TrendingDown}
                  valueKind="text"
                  label={ui.homeQ2WeakestCompetency}
                  value={worstSkill ? worstSkill.name : '—'}
                  note={worstSkill ? ui.homeQ2Gap(fmt1it(worstSkill.gap)) : undefined}
                />
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { title: ui.f3GapAreasTitle, rows: gapAreas },
                  { title: ui.f3GapRolesTitle, rows: gapRoles },
                ].map((c) => (
                  <ChartCard key={c.title} elevated title={c.title} description={ui.f3GapSub} height="md" empty={c.rows.length ? undefined : { title: ui.f3GapNone }}>
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
              </div>
              <ChartCard
                elevated
                title={ui.homeOrgTrendTitle}
                description={`${trendMonths[0]} — ${trendMonths[trendMonths.length - 1]}`}
                actions={
                  <ToggleGroup type="single" value={trendMode} onValueChange={(v) => v && setTrendMode(v as typeof trendMode)} aria-label={ui.homeOrgTrendTitle}>
                    <ToggleGroupItem value="media">{ui.homeOrgTrendModeAvg}</ToggleGroupItem>
                    <ToggleGroupItem value="benchmark">{ui.homeOrgTrendModeBenchmark}</ToggleGroupItem>
                  </ToggleGroup>
                }
                headline={
                  <>
                    <span className="text-metric-lg tabular-nums">{fmt1it(trendLast)}/10</span>
                    <TrendDelta direction={trendDirection}>
                      {trendDelta > 0 ? '+' : ''}
                      {fmt1it(trendDelta)} · {trendDeltaPct > 0 ? '+' : ''}
                      {fmt1it(trendDeltaPct)}%
                    </TrendDelta>
                  </>
                }
              >
                {/* G11 (DECISIONI): area su chart-mono, benchmark tratteggiato. */}
                <TrendChart
                  title={ui.homeOrgTrendTitle}
                  scale={{ left: [0, 10] }}
                  series={[
                    { key: 'v', label: ui.homeOrgTrendModeAvg, kind: 'area' },
                    { key: 'b', label: `${ui.homeOrgTrendModeBenchmark} ${fmt1it(hs.benchmark)}`, reference: true },
                  ]}
                  points={trendMonths.map((m, i) => ({ date: new Date(new Date().getFullYear(), new Date().getMonth() - (trendMonths.length - 1 - i), 1), label: m, values: { v: orgTrendSeries[i], b: hs.benchmark } }))}
                />
              </ChartCard>
              <div className="flex justify-center">
                <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/assessment/${detailPage}`)}>
                  {ui.homeQ2ViewDetail}
                </Button>
              </div>
            </div>
          }
        />

        {/* Finestra 4 — Dove intervenire: il pannello resta com'è; "Vedi tutte
            le azioni" passa dalla card al pannello. */}
        <SkillVisionCard
          iconSide="end"
          icon={GearAlertIcon}
          title={ui.homeQ4Title}
          subtitle={ui.homeQ4Kicker}
          headline={ui.homeQ4Headline}
          description={ui.homeQ4Description}
          labels={skillVisionLabels}
          open={openDecisioni}
          onOpenChange={setOpenDecisioni}
          style={cardLayout.decisioni}
          panel={
            <div className="flex flex-col gap-3 rounded-md border-2 border-primary bg-card p-4 shadow-[0_8px_16px_0_var(--border-strong)]">
              <ToggleGroup type="single" value={decisioniTab} onValueChange={(v) => v && setDecisioniTab(v as typeof decisioniTab)} aria-label={ui.homeQ4Title}>
                <ToggleGroupItem value="tutte">{ui.homeQ4TabAll}</ToggleGroupItem>
                <ToggleGroupItem value="urgenti">{ui.homeQ4TabUrgent}</ToggleGroupItem>
                <ToggleGroupItem value="completate">{ui.homeQ4TabCompleted}</ToggleGroupItem>
              </ToggleGroup>
              {decisioniTab === 'completate' ? (
                <EmptyState size="sm" icon={ListChecks} description={ui.homeQ4NoCompleted} />
              ) : (
                <div className="flex flex-col gap-2">
                  {(decisioniTab === 'urgenti' ? azioni.filter((a) => a.variant === 'danger') : azioni).map((a) => (
                    <DecisionRow
                      key={a.key}
                      icon={a.Icon}
                      tone={ACTION_TONE[a.variant]}
                      label={a.label}
                      note={state.settings.actionNotes?.[a.key] ?? a.desc}
                      onNoteChange={(v) => saveActionNote(a.key, v)}
                      readOnly={!canEdit}
                      count={a.count}
                      unit={ui.homeQ4PeopleUnit}
                    />
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => navigate('/assessment/feedback')}>
                  {ui.homeQ4ViewAll} <ArrowUpRight />
                </Button>
                <Button type="button" variant="link" size="sm" onClick={() => exportActionPlan(state, lang, ui)}>
                  {ui.homeQ4Export}
                </Button>
              </div>
            </div>
          }
        />
      </div>

      {/* Foglio 3: la finestra "Una sola lettura, mai due sistemi diversi" è
          tolta dalla dashboard ma non buttata: resta qui, spenta, per
          riprenderla quando si deciderà dove metterla. */}
      {SHOW_CROSS_MODULE_BANNER && (
        <CrossModuleBanner
        heading={ui.crossBannerHeading}
        body={ui.crossBannerBody}
        ctaLabel={ui.crossBannerCtaToRecruiting}
        ctaTo="/recruiting"
        secondaryLabel={ui.crossBannerReport}
        onSecondary={() => exportActionPlan(state, lang, ui)}
        stats={[
          { label: ui.crossBannerCriticalArea, value: worstArea ? worstArea.area : '—', sub: worstArea ? ui.crossBannerCriticalAreaSub(fmt1(round1(worstArea.avg - hs.benchmark))) : undefined },
          { label: ui.crossBannerToValorize, value: hs.valueCount, sub: ui.crossBannerToValorizeSub(gPct) },
          { label: ui.crossBannerRolesAtRisk, value: rolesAtRiskCount, sub: ui.crossBannerRolesAtRiskSub(roleCovPct) },
          { label: ui.crossBannerEvalsInProgress, value: pendingEvalsCount, sub: ui.crossBannerEvalsInProgressSub },
        ]}
      />
      )}
      {drawerId && <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} />}
    </div>
  )
}

// Lo scarto dell'andamento: freccia e segno dicono la direzione, il colore
// la accompagna (in su è un miglioramento, in giù un peggioramento).
function TrendDelta({ direction, children }: { direction: 'up' | 'down' | 'flat'; children: React.ReactNode }) {
  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : ArrowRight
  return (
    <Badge tone={direction === 'up' ? 'success' : direction === 'down' ? 'destructive' : 'neutral'}>
      <Icon aria-hidden="true" />
      {children}
    </Badge>
  )
}

// Tono e icona dei tre riquadri del Capitale Umano, tono di ogni fascia
// nella distribuzione e di ogni azione in Le Decisioni. La fascia più alta
// (Alto Valore / Top Talent) non è uno stato: neutro pieno, contro il neutro
// tenue di Nella Norma (CLAUDE.md cap. 7); Alto Potenziale success; il resto
// segue la gravità. La parola della fascia sta
// sempre accanto al colore.
const TIER_TILE: Record<'valorizzare' | 'top' | 'critica', { tone: StatTone; Icon: LucideIcon }> = {
  valorizzare: { tone: 'success', Icon: Sparkles },
  top: { tone: 'strong', Icon: Award },
  critica: { tone: 'destructive', Icon: UserX },
}
// Distribuzione per fascia: dalla più alta alla più bassa (CLAUDE.md).
const TIER_ORDER = ['top', 'valorizzare', 'adeguata', 'sviluppo', 'critica'] as const
const TIER_DIST: Record<'top' | 'valorizzare' | 'adeguata' | 'sviluppo' | 'critica', DistributionTone> = {
  top: 'neutral',
  valorizzare: 'success',
  adeguata: 'muted',
  sviluppo: 'warning',
  critica: 'destructive',
}
// I colori dei punti della mappa, per fascia (stessi della pagina Valori
// Complessivi): la fascia più alta neutra piena, "adeguata" neutra tenue, le
// altre sui toni di stato; il nome della fascia sta in legenda.
const TIER_COLORS: Record<string, string> = {
  top: 'var(--foreground)',
  valorizzare: 'var(--success)',
  adeguata: 'var(--chart-compare)',
  sviluppo: 'var(--warning)',
  critica: 'var(--destructive)',
}
const ACTION_TONE: Record<'warning' | 'success' | 'danger' | 'accent', DecisionTone> = {
  warning: 'warning',
  success: 'success',
  danger: 'destructive',
  accent: 'neutral',
}

// Same seeded-PRNG shape as AssessmentCustomerCarePage.tsx's seedRandom()
// — deterministic per fixed seed so the trend doesn't reshuffle on every
// render/reload.
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

// Builds backward from the real live org average so the series always
// ends exactly on today's real number (see orgTrendSeries above) — the 5
// months before it are an illustrative bounded walk, not real history.
function buildOrgTrendSeries(orgAvg: number): number[] {
  const r = seedRandom(20260724)
  const series = [orgAvg]
  for (let i = 0; i < 5; i++) {
    const prev = series[0]
    const next = Math.max(0, Math.min(10, prev - (r() * 0.6 - 0.3)))
    series.unshift(Math.round(next * 10) / 10)
  }
  return series
}

// Ported from exportActionPlan() (js/assessment.js ~4409-4427) — a plain
// client-side CSV Blob download, no backend, same 4 rows/columns and same
// download filename (action_plan.csv).
function exportActionPlan(state: AssessmentState, lang: AssessmentLang, ui: ReturnType<typeof getUI>) {
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
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'action_plan.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// "Esporta Report" on the new always-expanded Il Valore card (Phase 2) —
// same plain CSV Blob pattern as exportActionPlan() above, one row per
// employee with their org-wide value score, feeding the same real numbers
// the card itself shows (overall %, benchmark, role coverage).
function exportValoreReport(state: AssessmentState, lang: AssessmentLang, ui: ReturnType<typeof getUI>) {
  const hs = homeStats(state, lang)
  const roleCovPct = roleCoveragePct(state, lang)
  const overallPct = Math.round((hs.orgAvg / 10) * 100)
  let csv = ui.exportValoreCsvHeader + '\n'
  csv += [overallPct + '%', fmt1it(hs.benchmark), roleCovPct + '%', state.employees.length].join(';') + '\n\n'
  csv += ui.exportValoreCsvEmployeeHeader + '\n'
  state.employees.forEach((e) => {
    csv += [e.cognome, e.nome, e.ruolo, e.area, fmt1csv(primaryScore(e, state, lang))].join(';') + '\n'
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'report_valore.csv'
  a.click()
  URL.revokeObjectURL(url)
}

