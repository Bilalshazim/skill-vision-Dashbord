import { fmtDec } from '@/lib/format'
import { IV_SOFT_SKILLS, IVN_SOFT_SKILLS } from '@/modules/recruiting/lib/interview-protocol'

const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})
const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const num = (v: unknown) => {
  const n = parseFloat(text(v))
  return Number.isNaN(n) ? null : n
}

export type CompareColumn = { id: string; label: string; scores: Record<string, unknown> | undefined }
type Row = { key: string; label: string; values: (number | null)[]; max: number; kind: 'score' | 'text'; texts?: string[] }
type Section = { title: string; rows: Row[] }

const ESITO: [string, string][] = [
  ['esitoProcedi', 'Procedere'],
  ['esitoStandby', 'Stand-by'],
  ['esitoAlternativo', 'Ruolo alternativo'],
  ['esitoNonIdoneo', 'Non idoneo'],
]
const RECO: [string, string][] = [
  ['reco_procedi', 'Procedere'],
  ['reco_riserva', 'Lista di riserva'],
  ['reco_confronta', 'Confrontare'],
  ['reco_no', 'Non idoneo'],
]

// Righe di punteggio in comune fra più valutatori: le domande fisse (con il
// testo che ciascuno ha scritto, se l'ha riscritto), le aree tecniche (per
// testo, perché ognuno le ha chieste a modo suo) e le domande aggiunte.
function buildSection(title: string, cols: CompareColumn[], form: 'verbale' | 'valutazione'): Section {
  const fixed = form === 'verbale' ? [...IVN_SOFT_SKILLS] : [...IV_SOFT_SKILLS]
  const recs = cols.map((c) => asRecord(asRecord(c.scores)[form]))
  const rows: Row[] = []
  const tecKeys = new Map<string, string>()
  recs.forEach((r) => Object.values(asRecord(r.tecnica)).forEach((t) => {
    const l = text(asRecord(t).area) || text(asRecord(t).label)
    if (l) tecKeys.set(l.toLowerCase(), l)
  }))
  tecKeys.forEach((label, k) =>
    rows.push({ key: `tec-${k}`, label: `Competenza tecnica — ${label}`, max: 5, kind: 'score', values: recs.map((r) => {
      const hit = Object.values(asRecord(r.tecnica)).find((t) => (text(asRecord(t).area) || text(asRecord(t).label)).toLowerCase() === k)
      return hit ? num(asRecord(hit).score) : null
    }) }),
  )
  fixed.forEach((name) =>
    rows.push({ key: `soft-${name}`, label: name, max: 5, kind: 'score', values: recs.map((r) => num(asRecord(asRecord(r.soft)[name]).score)) }),
  )
  const extras = new Map<string, string>()
  recs.forEach((r) => (Array.isArray(r.extraQuestions) ? r.extraQuestions : []).forEach((q) => {
    const l = text(asRecord(q).label)
    if (l) extras.set(l.toLowerCase(), l)
  }))
  extras.forEach((label, k) =>
    rows.push({ key: `extra-${k}`, label: `${label} (domanda aggiunta)`, max: 5, kind: 'score', values: recs.map((r) => {
      const hit = (Array.isArray(r.extraQuestions) ? r.extraQuestions : []).find((q) => text(asRecord(q).label).toLowerCase() === k)
      return hit ? num(asRecord(hit).score) : null
    }) }),
  )
  if (form === 'verbale') {
    rows.push({ key: 'tot', label: 'Punteggio complessivo', max: 5, kind: 'score', values: recs.map((r) => num(r.punteggioComplessivo)) })
    rows.push({ key: 'esito', label: 'Esito del colloquio', max: 0, kind: 'text', values: [], texts: recs.map((r) => ESITO.filter(([k]) => r[k] === true).map(([, l]) => l).join(', ') || '—') })
  } else {
    rows.push({ key: 'fin', label: 'Punteggio finale', max: 5, kind: 'score', values: recs.map((r) => num(r.finalScore)) })
    rows.push({ key: 'reco', label: 'Raccomandazione', max: 0, kind: 'text', values: [], texts: recs.map((r) => RECO.filter(([k]) => r[k] === true).map(([, l]) => l).join(', ') || '—') })
  }
  return { title, rows: rows.filter((r) => r.kind === 'text' || r.values.some((v) => v != null)) }
}

// Il confronto fra valutatori (Foglio 7): una colonna per valutatore, una riga
// per criterio, e lo scarto fra il voto più alto e il più basso. Uno scarto di
// 2 punti o più è segnato con la parola "Divergenza", non solo col colore.
export function EvaluationCompare({ columns }: { columns: CompareColumn[] }) {
  const sections = [buildSection('Intervista strutturata — verbale di colloquio', columns, 'verbale'), buildSection('Valutazione candidato', columns, 'valutazione')]
  return (
    <div className="flex flex-col gap-6">
      {sections.map((s) => (
        <section key={s.title} className="flex flex-col gap-2">
          <h4 className="text-app-small font-semibold text-foreground">{s.title}</h4>
          <div className="overflow-x-auto rounded-sm border border-border">
            <table className="w-full min-w-xl border-collapse text-app-caption">
              <thead>
                <tr className="label-mono border-b border-border bg-muted text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Criterio</th>
                  {columns.map((c) => (
                    <th key={c.id} className="px-3 py-2 text-center font-medium">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center font-medium">Scarto</th>
                </tr>
              </thead>
              <tbody>
                {s.rows.map((r) => {
                  const nums = r.values.filter((v): v is number => v != null)
                  const spread = nums.length > 1 ? Math.max(...nums) - Math.min(...nums) : null
                  return (
                    <tr key={r.key} className="border-b border-border align-top last:border-b-0">
                      <th scope="row" className="px-3 py-1.5 text-left font-normal text-foreground">
                        {r.label}
                      </th>
                      {columns.map((c, i) => (
                        <td key={c.id} className="px-3 py-1.5 text-center font-mono tabular-nums text-foreground">
                          {r.kind === 'text' ? <span className="font-sans">{r.texts?.[i]}</span> : r.values[i] != null ? `${fmtDec(r.values[i] as number, r.key === 'fin' ? 2 : 0)}/${r.max}` : '—'}
                        </td>
                      ))}
                      <td className="px-3 py-1.5 text-center font-mono tabular-nums">
                        {r.kind === 'text' || spread == null ? '' : spread >= 2 ? <span className="font-sans font-semibold text-warning">Divergenza · {fmtDec(spread, r.key === 'fin' ? 2 : 0)}</span> : fmtDec(spread, r.key === 'fin' ? 2 : 0)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}
