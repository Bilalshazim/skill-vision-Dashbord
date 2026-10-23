import { useMemo } from 'react'

import { DEFAULT_ROLE } from '@/modules/recruiting/lib/constants'
import { ensurePipeline, getActiveOpening, pipelineStage, plDateFmt } from '@/modules/recruiting/lib/pipeline'
import { countStages, positionCandidateIds, positionStages, STAGES, type StageCounts, sumStages } from '@/modules/recruiting/lib/position-funnel'
import { type AhiResult, pendingCandidates, ranking } from '@/modules/recruiting/lib/scoring'
import { readCandidates, readCvMatchingState } from '@/modules/recruiting/lib/storage'
import type { Candidate, Company, JobOpening } from '@/modules/recruiting/lib/types'

export type KpiDatum = { key: string; value: number; label: string }

export type QualityBucket = {
  label: string
  count: number
  /** Same severity meaning as legacy's var(--green)/var(--amber)/var(--red)
   *  per bucket — mapped to our semantic tokens, not the categorical chart
   *  palette (see RecruitingHome.tsx for why). */
  tone: 'success' | 'warning' | 'destructive'
}

export type OpeningRow = {
  key: string
  companyId: string
  openingId: string
  companyName: string
  openingTitle: string
  stageLabel: string
  stagePct: number
  won: boolean
}

export type UpcomingRow = {
  id: string
  date: string
  name: string
  meta: string
}

export type FunnelStage = { key: string; label: string; count: number; note?: string }

export type RecruitingHomeData = {
  kpis: KpiDatum[]
  roleLabel: string
  rankedCount: number
  buckets: QualityBucket[]
  openings: OpeningRow[]
  upcoming: UpcomingRow[]
  completed: UpcomingRow[]
  /** Not-completed interviews scheduled within the next 7 days, and how
   *  many distinct companies they span — feeds the cross-module banner's
   *  "Colloqui questa settimana" stat (see CrossModuleBanner.tsx). */
  interviewsThisWeek: { count: number; companies: number }
  /** "Imbuto di Selezione" (Phase 5) — real counts summed across every
   *  open position's own pipeline (prescreened/testResults/interviews),
   *  plus the full candidate pool for the first stage. "Assunti" has no
   *  real tracked hire-count anywhere in this app (Pipeline only ever
   *  stores a single `winner` slot per opening, overwritten, no history)
   *  — counting openings with a winner set is the best honest proxy, not
   *  a precise hire count, hence the `note`.
   */
  funnel: FunnelStage[]
  /** I candidati in classifica di ogni fascia (stesso ordine di `buckets`), già per AHI decrescente. */
  bucketCandidates: { c: Candidate; r: AhiResult }[][]
  /** Le fasi della selezione per ogni posizione aperta della società attiva (Imbuto, "Tutte le posizioni aperte"). */
  positions: { companyId: string; openingId: string; title: string; counts: StageCounts }[]
  /** L'imbuto di tutte le posizioni aperte della società, per fase. */
  funnelCounts: StageCounts
  /** Panoramica (CLAUDE.md, Fase 6): i numeri di "Stato attuale" e "Da fare adesso". */
  overview: {
    /** Candidati con il CV e senza test: quelli di "Da invitare al test". */
    toInvite: number
    companyName: string
    /** La data più recente nei dati della selezione (preselezioni, risultati, decisioni). */
    lastUpdate: Date | null
    openings: number
    /** Candidati preselezionati nelle posizioni aperte (una persona conta una volta). */
    inSelection: number
    suitable: number
    interviewsScheduled: number
    toEvaluate: number
    linksToSend: number
    testsToRead: number
    openingsWithoutCandidates: number
  }
}

// Faithful port of renderHomeDashboard() (modules/recruiting.html
// lines ~2538-2642) — same data sources, same computations, same bucket
// thresholds, same "top 5 upcoming, incomplete only" slice. Only the output
// shape changed (structured data instead of innerHTML strings) and the
// color values became semantic tokens (see storage.ts / scoring.ts for the
// read-only data boundary).
//
// Panoramica, Imbuto e Candidati per fascia guardano la società attiva e le
// sue posizioni aperte (CLAUDE.md, Fase 6): prima i conteggi sommavano tutte
// le società e l'archivio CV intero, mescolato alle posizioni. L'archivio
// resta in Risultati e Candidati per fascia, con «Archivio CV».
export function useRecruitingHomeData(): RecruitingHomeData {
  return useMemo(() => {
    const candidates = readCandidates()
    const state = readCvMatchingState()
    const activeCompany = getActiveOpening(state).company

    const openings: { company: Company; opening: JobOpening }[] = []
    for (const co of (state.companies || []).filter((c) => c.id === activeCompany?.id)) {
      for (const o of co.jobOpenings || []) {
        if (o.active === false) continue
        openings.push({ company: co, opening: o })
      }
    }

    const allInterviews: { companyName: string; openingTitle: string; name?: string; scheduledAt: string; completed: boolean }[] = []
    for (const { company, opening } of openings) {
      const p = ensurePipeline(opening)
      for (const iv of p.interviews || []) {
        allInterviews.push({ ...iv, companyName: company.name, openingTitle: opening.title })
      }
    }
    const upcoming = allInterviews
      .filter((iv) => !iv.completed)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 5)

    // I candidati delle posizioni aperte della società attiva.
    const ids = new Set(openings.flatMap(({ opening }) => [...positionCandidateIds(opening)]))
    const rk = ranking(candidates.filter((c) => ids.has(c.id)))
    const byId = new Map(candidates.map((c) => [c.id, c]))
    const positions = openings.map(({ company, opening }) => ({ companyId: company.id, openingId: opening.id, title: opening.title, counts: countStages(positionStages(opening, byId)) }))
    const total = sumStages(positions.map((p) => p.counts))

    const kpis: KpiDatum[] = [
      { key: 'candidates', value: candidates.length, label: 'Candidati in archivio' },
      { key: 'pending', value: pendingCandidates(candidates).length, label: 'In attesa di test' },
      { key: 'openings', value: openings.length, label: 'Posizioni aperte' },
      { key: 'interviews', value: allInterviews.length, label: 'Colloqui programmati' },
    ]

    const buckets: QualityBucket[] = [
      { label: 'Assumibile subito', tone: 'success', count: 0 },
      { label: 'Con piano di sviluppo', tone: 'warning', count: 0 },
      { label: 'Gap strutturali', tone: 'warning', count: 0 },
      { label: 'Sconsigliato', tone: 'destructive', count: 0 },
    ]
    for (const { r } of rk) {
      if (r.capped) {
        buckets[3].count++
        continue
      }
      if (r.v >= 85) buckets[0].count++
      else if (r.v >= 70) buckets[1].count++
      else if (r.v >= 60) buckets[2].count++
      else buckets[3].count++
    }

    const openingRows: OpeningRow[] = openings.map(({ company, opening }) => {
      const st = pipelineStage(opening)
      const won = !!(opening.pipeline && opening.pipeline.winner)
      return {
        key: `${company.id}:${opening.id}`,
        companyId: company.id,
        openingId: opening.id,
        companyName: company.name,
        openingTitle: opening.title,
        stageLabel: st.label,
        stagePct: st.pct,
        won,
      }
    })

    const upcomingRows: UpcomingRow[] = upcoming.map((iv, i) => ({
      id: `${i}-${iv.scheduledAt}`,
      date: plDateFmt(iv.scheduledAt),
      name: iv.name || '—',
      meta: `${iv.companyName} · ${iv.openingTitle}`,
    }))

    const completedRows: UpcomingRow[] = allInterviews
      .filter((iv) => iv.completed)
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
      .slice(0, 5)
      .map((iv, i) => ({
        id: `c${i}-${iv.scheduledAt}`,
        date: plDateFmt(iv.scheduledAt),
        name: iv.name || '—',
        meta: `${iv.companyName} · ${iv.openingTitle}`,
      }))

    // L'imbuto delle posizioni aperte della società, con le fasi del menu
    // (lib/position-funnel.ts).
    const funnel: FunnelStage[] = STAGES.map((s) => ({ key: s.key, label: s.label, count: total[s.key] }))

    const bucketCandidates: { c: Candidate; r: AhiResult }[][] = [[], [], [], []]
    for (const it of rk) {
      const i = it.r.capped ? 3 : it.r.v >= 85 ? 0 : it.r.v >= 70 ? 1 : it.r.v >= 60 ? 2 : 3
      bucketCandidates[i].push(it)
    }

    // Panoramica: link da inviare (in coda o pronto e non spedito), test
    // completati senza ancora un colloquio, posizioni senza preselezionati.
    const inSelection = new Set<string>()
    let linksToSend = 0
    let testsToRead = 0
    let openingsWithoutCandidates = 0
    const dates: string[] = []
    for (const { opening } of openings) {
      const p = ensurePipeline(opening)
      if (!p.prescreened.length) openingsWithoutCandidates++
      const interviewed = new Set(p.interviews.map((iv) => iv.candidateId).filter(Boolean))
      for (const ps of p.prescreened) {
        inSelection.add(ps.candidateId)
        if (ps.status === 'da_inviare' || ps.status === 'link_pronto') linksToSend++
        if ((ps.status === 'completato' || ps.status === 'ha_risposto') && !interviewed.has(ps.candidateId)) testsToRead++
        dates.push(ps.addedAt)
      }
      p.testResults.forEach((t) => dates.push(t.addedAt))
      if (p.winner) dates.push(p.winner.decidedAt)
    }
    const times = dates.map((d) => new Date(d).getTime()).filter((t) => Number.isFinite(t))

    const now = Date.now()
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const thisWeek = allInterviews.filter((iv) => {
      if (iv.completed) return false
      const t = new Date(iv.scheduledAt).getTime()
      return t >= now && t <= now + weekMs
    })
    const interviewsThisWeek = { count: thisWeek.length, companies: new Set(thisWeek.map((iv) => iv.companyName)).size }

    return {
      kpis,
      roleLabel: DEFAULT_ROLE,
      rankedCount: rk.length,
      buckets,
      openings: openingRows,
      upcoming: upcomingRows,
      completed: completedRows,
      interviewsThisWeek,
      funnel,
      bucketCandidates,
      positions,
      funnelCounts: total,
      overview: {
        toInvite: pendingCandidates(candidates).length,
        companyName: getActiveOpening(state).company?.name ?? '',
        lastUpdate: times.length ? new Date(Math.max(...times)) : null,
        openings: openings.length,
        inSelection: inSelection.size,
        suitable: buckets[0].count,
        interviewsScheduled: allInterviews.filter((iv) => !iv.completed).length,
        toEvaluate: buckets[1].count + buckets[2].count,
        linksToSend,
        testsToRead,
        openingsWithoutCandidates,
      },
    }
  }, [])
}
