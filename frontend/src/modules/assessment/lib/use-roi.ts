import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

import { assessmentApi, type RoiData } from '@/lib/api/assessment'
import { annualize, blockingProblems } from '@/lib/roi/checks'
import { model, type RoiModel, type RoiState } from '@/lib/roi/model'
import { SCEN, scenOverrides } from '@/lib/roi/scenarios'
import { isOnDemoCompany } from '@/lib/demo-mode'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { activeEmployees, evaluatedEmployees, homeStats, roleCoveragePct } from '@/modules/assessment/lib/calculations'
import { demoRoiData } from '@/modules/assessment/lib/demo-roi'
import { orgValue } from '@/modules/assessment/lib/role-index'

// Le società demo per cui il bilancio dimostrativo è già stato chiesto in questa sessione:
// il hook è usato da più componenti nella stessa pagina, il caricamento parte una volta.
const demoStatementRequested = new Set<string>()

// Dalla dashboard al motore ROI (CLAUDE.md, Fase 6, "Euro dal motore ROI"). Dati
// di bilancio e voci a mano dal server, salvati in Dati aziendali; organico e
// persone valutate da Anagrafica e valutazioni. Dai risultati vanno solo tre dati,
// esatti: valore %, gap medio %, copertura ruoli %. Le ipotesi non scelte sono i
// valori predefiniti del motore: base HCVA, convenzione gestionale, costo di
// sostituzione 50%, assenze aggredibili 60%, leva 4 spenta.

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
  const { state, lang, company, canEdit, ui } = useAssessment()
  const queryClient = useQueryClient()
  const companyId = company?.id ?? null
  const key = ['assessment', 'roi', companyId]
  const q = useQuery({ queryKey: key, enabled: !!companyId, queryFn: () => assessmentApi.getRoi(companyId!) })

  const stats = useMemo(() => homeStats(state, lang), [state, lang])
  const coverage = useMemo(() => roleCoveragePct(state, lang), [state, lang])
  const value = useMemo(() => orgValue(state, lang), [state, lang])
  const evaluated = useMemo(() => evaluatedEmployees(state).length, [state])
  const employees = useMemo(() => activeEmployees(state).length, [state])

  const result = useMemo<RoiResult>(() => {
    const atteso = q.data?.atteso ?? stats.benchmark
    if (!q.data) return { status: 'loading', problems: [], months: 12, atteso, input: null, scenarios: null }
    const d = q.data.data
    const months = d.months ?? 12
    if (!d.statement || !Object.keys(d.statement).length || !evaluated || !value) return { status: 'missing', problems: [], months, atteso, input: null, scenarios: null }
    const f = annualize(d.statement, months)
    // Il motore vuole un divario positivo e valore + divario entro 100: un'eccedenza
    // sul ruolo non è un divario e non deve fermare il calcolo. `comp` serve solo a
    // quel controllo; gli euro dipendono da `gap`.
    const gap = Math.max(0, -value.gapMedio)
    const input: RoiState = {
      ...ENGINE_DEFAULTS,
      N: employees,
      nVal: evaluated,
      inv: d.inv ?? 0,
      invAz: d.invAz ?? 0,
      comp: Math.min(value.valore, 100 - gap),
      gap,
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
  }, [q.data, stats.benchmark, value, coverage, evaluated, employees])

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

  // Gli euro nella demo (correzioni del 2026-11-09): sulla società demo, se il bilancio
  // non c'è, si carica quello dimostrativo, come gli altri dati demo. Solo chi può
  // modificare; le società vere restano «In attesa dei dati di bilancio».
  const statementMissing = !!q.data && !Object.keys(q.data.data?.statement ?? {}).length
  useEffect(() => {
    if (!statementMissing || !companyId || !canEdit || !isOnDemoCompany() || demoStatementRequested.has(companyId)) return
    demoStatementRequested.add(companyId)
    save.mutate(demoRoiData(ui.res.roiDemoFile))
  }, [statementMissing, companyId, canEdit, save, ui])

  return { ...result, data: q.data?.data ?? null, isError: q.isError, save, canEdit }
}
