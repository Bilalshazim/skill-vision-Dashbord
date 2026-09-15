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

export type RecruitingHomeData = {
  kpis: KpiDatum[]
  roleLabel: string
  rankedCount: number
  buckets: QualityBucket[]
  openings: OpeningRow[]
  upcoming: UpcomingRow[]
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

    return {
      kpis,
      roleLabel: DEFAULT_ROLE,
      rankedCount: rk.length,
      buckets,
      openings: openingRows,
      upcoming: upcomingRows,
    }
  }, [])
}
