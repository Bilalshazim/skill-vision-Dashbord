import type { ResultsEuro } from '@/components/patterns/ResultsPage'
import { roiEuro, type RoiResult } from '@/modules/assessment/lib/use-roi'
import type { getUI } from '@/modules/assessment/lib/legacy-utils'

type Res = ReturnType<typeof getUI>['res']
const pct = (n: number) => `${n.toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`

const DATA_LINK = '/assessment/company'

// Le cifre delle quattro pagine dei risultati: una leva del motore per pagina
// (DECISIONI, "Quale cifra del motore su quale pagina"). L'importo da leggere come
// obiettivo è quello di Dove intervenire; gli altri tre sono ordini di grandezza,
// e "gli importi non si sommano". Ogni cifra dice come è calcolata, con i suoi
// numeri. Senza bilancio o con dati bloccanti: il segnaposto, con il motivo.
export function roiFigure(res: Res, roi: RoiResult, page: 'valore' | 'perdite' | 'potenziale' | 'dove'): ResultsEuro {
  const annual = roi.months !== 12 ? res.roiAnnualized(roi.months) : null
  if (roi.status !== 'ready' || !roi.scenarios || !roi.input) {
    return { value: null, pending: roi.status === 'blocked' ? res.roiBlocked : res.roiMissing, note: roi.problems[0] ?? res.roiMissingNote, link: { label: res.roiGoData, to: DATA_LINK } }
  }
  const s = roi.input
  const { prud, base, espa } = roi.scenarios
  const footer = [res.roiNoSum, annual].filter(Boolean).join(' ')
  const dataRows = [
    { label: res.roiRowHcva, value: roiEuro(base.HCVA) },
    { label: res.roiRowGap, value: `${res.indexPct(s.gap)} (${res.roiRowGapNote(res.indexPct(s.comp), res.indexPct(s.comp + s.gap))})` },
    { label: res.roiRowEvaluated, value: `${s.nVal} / ${s.N}` },
  ]
  if (page === 'valore') {
    return {
      value: roiEuro(base.gapVal),
      tags: [res.roiTagPotential, res.roiTagEstimate],
      note: res.roiValoreNote,
      footer,
      how: { title: res.roiHowTitle, intro: res.roiHowValore, rows: [...dataRows, { label: res.roiRowResult, value: roiEuro(base.gapVal) }] },
    }
  }
  if (page === 'perdite') {
    return {
      value: roiEuro(base.pool),
      tags: [res.roiTagPotential, res.roiTagEstimate],
      note: res.perditeEuro,
      footer,
      how: {
        title: res.roiHowTitle,
        intro: res.roiHowPerdite,
        rows: [
          { label: res.roiRowDivario, value: roiEuro(base.gapVal) },
          { label: res.roiRowTurnover(pct(s.turn)), value: roiEuro(base.turnVal) },
          { label: res.roiRowAssenze(pct(s.ass)), value: roiEuro(base.assVal) },
          { label: res.roiRowResult, value: roiEuro(base.pool) },
        ],
      },
    }
  }
  if (page === 'potenziale') {
    return {
      value: roiEuro(base.l1),
      tags: [res.roiTagEstimate],
      note: res.potenzialeEuro,
      footer,
      how: { title: res.roiHowTitle, intro: res.roiHowPotenziale, rows: [{ label: res.roiRowDivario, value: roiEuro(base.gapVal) }, { label: res.roiRowEffect, value: `${pct(s.el)} × ${pct(s.r1)}` }, { label: res.roiRowResult, value: roiEuro(base.l1) }] },
    }
  }
  return {
    value: roiEuro(base.benefit),
    tags: [res.roiTagBase, res.roiTagEstimate],
    note: res.doveEuro,
    detail: res.roiVerifiable(roiEuro(base.costBen)),
    scenarios: [
      { label: res.roiScenPrud, value: roiEuro(prud.benefit) },
      { label: res.roiScenBase, value: roiEuro(base.benefit) },
      { label: res.roiScenEspa, value: roiEuro(espa.benefit) },
    ],
    footer,
    how: {
      title: res.roiHowTitle,
      intro: res.roiHowDove,
      rows: [
        { label: res.roiRowL1, value: roiEuro(base.l1) },
        { label: res.roiRowL2, value: roiEuro(base.l2) },
        { label: res.roiRowL3, value: roiEuro(base.l3) },
        { label: res.roiRowResult, value: roiEuro(base.benefit) },
      ],
    },
  }
}
