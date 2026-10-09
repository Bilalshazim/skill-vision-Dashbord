import { DataTable, type DataTableColumn } from '@/components/patterns/DataTable'
import { Badge } from '@/components/ui/badge'
import { GAP_LABEL, GAP_TONE, PERCEPTION_LABEL, fmtScore, fmtSigned } from '@/modules/assessment/gestione5p/dashboard/gap-style'
import type { Dash5pPayload } from '@/modules/assessment/gestione5p/model'

type Row = Dash5pPayload['items'][number]

const num = (v: string) => <span className="tabular-nums">{v}</span>

// Le 25 voci: voto, autovalutazione e scarto, valore atteso e skill gap con la
// parola dello stato, numero di valutatori che hanno risposto.
export function DashboardItemsTable({ items }: { items: Dash5pPayload['items'] }) {
  const columns: DataTableColumn<Row>[] = [
    {
      key: 'voce',
      header: 'Voce',
      cell: (r) => (
        <span>
          <span className="font-mono text-muted-foreground">{r.code}</span> {r.name}
        </span>
      ),
    },
    { key: 'voto', header: 'Voto', align: 'end', cell: (r) => num(fmtScore(r.actual)) },
    { key: 'auto', header: 'Auto', align: 'end', cell: (r) => num(fmtScore(r.self)) },
    {
      key: 'diff',
      header: 'Diff.',
      align: 'end',
      cell: (r) => <span className="tabular-nums" title={r.perception ? PERCEPTION_LABEL[r.perception] : undefined}>{fmtSigned(r.selfDiff)}</span>,
    },
    { key: 'atteso', header: 'Atteso', align: 'end', cell: (r) => num(fmtScore(r.target)) },
    {
      key: 'gap',
      header: 'Skill gap',
      cell: (r) => (
        <span className="inline-flex items-center gap-2">
          <span className="min-w-8 text-right font-medium tabular-nums">{fmtSigned(r.gap)}</span>
          {r.gapState ? <Badge tone={GAP_TONE[r.gapState]}>{GAP_LABEL[r.gapState]}</Badge> : null}
        </span>
      ),
    },
    { key: 'n', header: 'Risposte', align: 'end', emphasis: 'muted', cell: (r) => num(String(r.responses)) },
  ]
  return <DataTable columns={columns} rows={items} getRowId={(r) => r.code} />
}
