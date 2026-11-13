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
  // Gli scenari prudenziale · base · espansivo della cifra della pagina (correzioni del
  // 2026-11-09, «L'impatto ha tre card»): l'importo grande resta lo scenario base.
  // Il valore (Roberto, 2026-11-16): produttività dal divario + turnover evitato + assenteismo
  // ridotto, le leve 1, 2 e 3 del motore. Non è un valore del motore a sé: la somma delle tre.
  const levers123 = (m: typeof base) => m.l1 + m.l2 + m.l3
  type Key = 'gapVal' | 'pool' | 'l1' | 'benefit' | 'valore'
  const pick = (m: typeof base, k: Key) => (k === 'valore' ? levers123(m) : m[k])
  // Se i tre scenari danno la stessa cifra (il divario non dipende dallo scenario), non si
  // mostrano: tre numeri uguali farebbero credere a una stima a forbice che non c'è.
  const scenarios = (k: Key) =>
    new Set([prud, base, espa].map((m) => Math.round(pick(m, k)))).size === 1
      ? undefined
      : [
          { label: res.roiScenPrud, value: roiEuro(pick(prud, k)) },
          { label: res.roiScenBase, value: roiEuro(pick(base, k)), main: true },
          { label: res.roiScenEspa, value: roiEuro(pick(espa, k)) },
        ]
  const dataRows = [
    { label: res.roiRowHcva, value: roiEuro(base.HCVA) },
    { label: res.roiRowGap, value: `${res.indexPct(s.gap)} (${res.roiRowGapNote(res.indexPct(s.comp), res.indexPct(s.comp + s.gap))})` },
    { label: res.roiRowEvaluated, value: `${s.nVal} / ${s.N}` },
  ]
  if (page === 'valore') {
    // Roberto, 2026-11-13: la leva «Produttività dal divario di competenza» (m.l1), non il lordo
    // del divario. Roberto, 2026-11-16: in più l'incidenza di % turnover e % assenteismo, le
    // leve «Turnover evitato» (m.l2) e «Assenteismo comprimibile» (m.l3) del motore, con le
    // percentuali di Dati aziendali. Senza le percentuali le due leve valgono zero.
    return {
      value: roiEuro(levers123(base)),
      tags: [res.roiTagEstimate],
      note: res.roiValoreNote,
      scenarios: scenarios('valore'),
      footer,
      how: {
        title: res.roiHowTitle,
        intro: res.roiHowValore,
        rows: [
          ...dataRows,
          { label: `${res.roiRowL1} (${pct(s.el)} × ${pct(s.r1)})`, value: roiEuro(base.l1) },
          { label: `${res.roiRowL2} (${pct(s.turn)})`, value: roiEuro(base.l2) },
          { label: `${res.roiRowL3} (${pct(s.ass)})`, value: roiEuro(base.l3) },
          { label: res.roiRowResult, value: roiEuro(levers123(base)) },
        ],
      },
    }
  }
  if (page === 'perdite') {
    // Roberto, 2026-11-16: solo l'impatto del divario di competenze (il 20%), senza turnover e
    // assenteismo, che stanno in Il valore. È il potenziale lordo del divario (m.gapVal).
    // Provvisorio: «vediamo poi cosa metterci».
    return {
      value: roiEuro(base.gapVal),
      tags: [res.roiTagPotential, res.roiTagEstimate],
      note: res.perditeEuro,
      scenarios: scenarios('gapVal'),
      footer,
      how: { title: res.roiHowTitle, intro: res.roiHowPerdite, rows: [...dataRows, { label: res.roiRowResult, value: roiEuro(base.gapVal) }] },
    }
  }
  if (page === 'potenziale') {
    return {
      value: roiEuro(base.l1),
      tags: [res.roiTagEstimate],
      note: res.potenzialeEuro,
      scenarios: scenarios('l1'),
      footer,
      how: { title: res.roiHowTitle, intro: res.roiHowPotenziale, rows: [{ label: res.roiRowDivario, value: roiEuro(base.gapVal) }, { label: res.roiRowEffect, value: `${pct(s.el)} × ${pct(s.r1)}` }, { label: res.roiRowResult, value: roiEuro(base.l1) }] },
    }
  }
  return {
    value: roiEuro(base.benefit),
    tags: [res.roiTagBase, res.roiTagEstimate],
    note: res.doveEuro,
    detail: res.roiVerifiable(roiEuro(base.costBen)),
    scenarios: scenarios('benefit'),
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
