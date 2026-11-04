import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import { assessmentApi, type RoiData } from '@/lib/api/assessment'
import { annualize, blockingProblems } from '@/lib/roi/checks'
import { model, type RoiModel, type RoiState } from '@/lib/roi/model'
import { SCEN, scenOverrides } from '@/lib/roi/scenarios'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { activeEmployees, evaluatedEmployees, homeStats, roleCoveragePct } from '@/modules/assessment/lib/calculations'

// Dalla dashboard al motore ROI (CLAUDE.md, Fase 6, "Euro dal motore ROI"). Dati
// di bilancio e voci a mano dal server, salvati in Dati aziendali; organico e
// persone valutate da Anagrafica e valutazioni; competenze, divario e copertura
// dai risultati. Le ipotesi non scelte sono i valori predefiniti del motore: base
// HCVA, convenzione gestionale, costo di sostituzione 50%, assenze aggredibili
// 60%, leva 4 spenta. La scala del motore è 0–100, quella della dashboard 1–10.

const ENGINE_DEFAULTS = { conv: 'gest', base: 'hcva', cs: 50, qa: 60, l4on: 0, posVac: 0, posPrev: 0, gg: 45 } as const

export const roiEuro = (n: number) => `€ ${Math.round(n).toLocaleString('it-IT')}`

export type RoiResult = {
  status: 'loading' | 'missing' | 'blocked' | 'ready'
  problems: string[]
  months: number
  atteso: number
  input: RoiState | null
  scenarios: Record<(typeof SCEN)[number]['id'], RoiModel> | null
}

export function useRoi() {
  const { state, lang, company, canEdit } = useAssessment()
  const queryClient = useQueryClient()
  const companyId = company?.id ?? null
  const key = ['assessment', 'roi', companyId]
  const q = useQuery({ queryKey: key, enabled: !!companyId, queryFn: () => assessmentApi.getRoi(companyId!) })

  const stats = useMemo(() => homeStats(state, lang), [state, lang])
  const coverage = useMemo(() => roleCoveragePct(state, lang), [state, lang])
  const evaluated = useMemo(() => evaluatedEmployees(state).length, [state])
  const employees = useMemo(() => activeEmployees(state).length, [state])

  const result = useMemo<RoiResult>(() => {
    const atteso = q.data?.atteso ?? stats.benchmark
    if (!q.data) return { status: 'loading', problems: [], months: 12, atteso, input: null, scenarios: null }
    const d = q.data.data
    const months = d.months ?? 12
    if (!d.statement || !Object.keys(d.statement).length || !evaluated) return { status: 'missing', problems: [], months, atteso, input: null, scenarios: null }
    const f = annualize(d.statement, months)
    const input: RoiState = {
      ...ENGINE_DEFAULTS,
      N: employees,
      nVal: evaluated,
      inv: d.inv ?? 0,
      invAz: d.invAz ?? 0,
      comp: stats.orgAvg * 10,
      gap: Math.max(0, atteso - stats.orgAvg) * 10,
      cov: coverage,
      turn: d.turn ?? 0,
      ass: d.ass ?? 0,
      ric: f.ric ?? 0,
      vdp: f.vdp ?? 0,
      costiProd: f.costiProd ?? 0,
      cp: f.cp ?? 0,
      sal: f.sal ?? 0,
      amm: f.amm ?? 0,
      acc: f.acc ?? 0,
      ebit: f.ebit ?? 0,
      ebitda: f.ebitda ?? 0,
      un: f.un ?? 0,
      ante: f.ante ?? 0,
      imposte: f.imposte ?? 0,
      el: 50,
      r1: 70,
      r2: 20,
      r3: 15,
      r4: 20,
    }
    const run = (id: (typeof SCEN)[number]['id']) => model(input, scenOverrides(SCEN.find((x) => x.id === id)!))
    const base = run('base')
    const problems = blockingProblems(input, base)
    if (problems.length) return { status: 'blocked', problems, months, atteso, input, scenarios: null }
    return { status: 'ready', problems: [], months, atteso, input, scenarios: { prud: run('prud'), base, espa: run('espa') } }
  }, [q.data, stats.orgAvg, stats.benchmark, coverage, evaluated, employees])

  // L'atteso si fissa dopo la prima misurazione, una volta sola: chi salva i dati
  // con persone già valutate lo fissa. Da lì non cambia; lo garantisce il server.
  const save = useMutation({
    mutationFn: async (data: RoiData) => {
      await assessmentApi.putRoi(companyId!, data)
      if (q.data?.atteso == null && evaluated) {
        await assessmentApi.lockAtteso(companyId!, stats.benchmark, `Benchmark ${stats.benchmark} fissato dopo la prima misurazione, ${evaluated} persone valutate`)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  return { ...result, data: q.data?.data ?? null, isError: q.isError, save, canEdit }
}
