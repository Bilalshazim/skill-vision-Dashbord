import { useMemo } from 'react'

import { DEFAULT_ROLE } from '@/modules/recruiting/lib/constants'
import { ensurePipeline, pipelineStage, plDateFmt } from '@/modules/recruiting/lib/pipeline'
import { pendingCandidates, ranking } from '@/modules/recruiting/lib/scoring'
import { readCandidates, readCvMatchingState } from '@/modules/recruiting/lib/storage'
import type { Company, JobOpening } from '@/modules/recruiting/lib/types'

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
}

// Faithful port of renderHomeDashboard() (modules/recruiting.html
// lines ~2538-2642) — same data sources, same computations, same bucket
// thresholds, same "top 5 upcoming, incomplete only" slice. Only the output
// shape changed (structured data instead of innerHTML strings) and the
// color values became semantic tokens (see storage.ts / scoring.ts for the
// read-only data boundary).
export function useRecruitingHomeData(): RecruitingHomeData {
  return useMemo(() => {
    const candidates = readCandidates()
    const state = readCvMatchingState()

    const openings: { company: Company; opening: JobOpening }[] = []
    for (const co of state.companies || []) {
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

    const rk = ranking(candidates)

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

    const funnel: FunnelStage[] = [
      { key: 'candidature', label: 'Candidature', count: candidates.length },
      { key: 'screening', label: 'Screening', count: openings.reduce((sum, { opening }) => sum + ensurePipeline(opening).prescreened.length, 0) },
      { key: 'test', label: 'Test Tecnico', count: openings.reduce((sum, { opening }) => sum + ensurePipeline(opening).testResults.length, 0) },
      { key: 'colloqui', label: 'Colloqui', count: openings.reduce((sum, { opening }) => sum + ensurePipeline(opening).interviews.length, 0) },
      { key: 'assunti', label: 'Assunti', count: openings.filter(({ opening }) => ensurePipeline(opening).winner).length, note: 'Posizioni con un vincitore selezionato — non un conteggio storico delle assunzioni' },
    ]

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
    }
  }, [])
}
