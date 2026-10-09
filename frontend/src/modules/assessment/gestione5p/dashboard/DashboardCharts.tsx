import { CategoryBars } from '@/components/patterns/CategoryBars'
import { Note } from '@/components/patterns/Note'
import { ProfileRadar } from '@/components/patterns/ProfileRadar'
import { Card } from '@/components/ui/card'
import { PS, type Dash5pPayload } from '@/modules/assessment/gestione5p/model'

// Il profilo per le cinque P: barre raggruppate (voto e valore atteso
// affiancati) e radar, nella stessa card. Due serie: voto in `chart-mono`,
// valore atteso come riferimento in `chart-compare` (lib/chart-colors.ts).
// Il valore atteso si disegna solo se c'è per tutte e cinque le P: una barra a
// zero sarebbe un dato falso. La tabella sotto ogni grafico dà i valori.
export function DashboardCharts({ payload }: { payload: Dash5pPayload }) {
  const cats = payload.categories
  const withTarget = cats.every((c) => c.target != null)
  const rows = cats.map((c) => ({ label: `${c.code} · ${c.name}`, values: { actual: c.actual, target: c.target } }))
  const series = [{ key: 'actual', label: 'Voto' }, ...(withTarget ? [{ key: 'target', label: 'Valore atteso', reference: true }] : [])]
  const axes = PS.map((P) => ({ key: P.k, label: `${P.k} · ${P.n}`, short: P.n }))
  const toValues = (pick: (c: (typeof cats)[number]) => number | null) => Object.fromEntries(cats.map((c) => [c.code, pick(c) ?? 0]))
  const radar = [{ label: 'Voto', values: toValues((c) => c.actual) }, ...(withTarget ? [{ label: 'Valore atteso', values: toValues((c) => c.target), reference: true }] : [])]
  const int = (n: number) => String(Math.round(n))

  return (
    <Card padding="lg" className="gap-6">
      <div>
        <h3 className="text-app-section text-foreground">Profilo 5P</h3>
        <Note className="mt-1">
          Voto: media di Dirigente e Peer, scala 0–100. {withTarget ? 'Il valore atteso è quello del reparto o, dove manca, quello di base.' : 'Il valore atteso non è definito per tutte le P: non si disegna.'}
        </Note>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CategoryBars title={`Voto per P di ${payload.person.name}`} rows={rows} series={series} valueMax={100} orientation="horizontal" height="lg" format={int} />
        <ProfileRadar title={`Profilo 5P di ${payload.person.name}`} axes={axes} series={radar} max={100} format={int} />
      </div>
    </Card>
  )
}
