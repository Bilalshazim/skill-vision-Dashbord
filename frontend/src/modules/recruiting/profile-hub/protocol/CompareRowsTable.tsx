import { X } from 'lucide-react'

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import type { IvCompareRow } from '@/modules/recruiting/lib/interview-protocol-types'
import { dashedBtnClass } from '@/modules/recruiting/profile-hub/protocol/protocol-styles'

// Ported from ivEvalRenderCompareRows()/ivReportRenderCompareRows() (modules/
// recruiting.html ~4626-4636, ~4716-4726) — shared by both Scheda
// Valutazione Candidato and Resoconto finale di valutazione. `code` is a manually
// typed free-text string (e.g. "CAND-014") — confirmed (Phase 19, and
// again per this phase's explicit Step 8) NOT a reference to any real
// CANDIDATES/Pipeline record. Never turn this into a candidate selector.
//
// `scoreKind` preserves a real difference between the two legacy tables:
// ivEval's compare score input is `type="number" min=0 max=5 step=0.1`;
// ivReport's is a plain `type="text"` (it holds a "punteggio/giudizio",
// not always a number) — not unified here.
export function CompareRowsTable({
  scoreLabel,
  scoreKind,
  rows,
  onChange,
}: {
  scoreLabel: string
  scoreKind: 'number' | 'text'
  rows: IvCompareRow[]
  onChange: (rows: IvCompareRow[]) => void
}) {
  function updateRow(idx: number, patch: Partial<IvCompareRow>) {
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }
  function addRow() {
    onChange([...rows, { rank: '', code: '', score: '', note: '' }])
  }
  function removeRow(idx: number) {
    onChange(rows.filter((_, i) => i !== idx))
  }

  return (
    <div className="flex flex-col gap-2">
      <Table frame size="sm" minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Candidato</TableHead>
              <TableHead>{scoreLabel}</TableHead>
              <TableHead>Note</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nessun candidato in confronto
                </TableCell>
              </TableRow>
            )}
            {rows.map((row, idx) => (
              // eslint-disable-next-line react/no-array-index-key -- rows have no stable id in legacy either (plain array, spliced by index)
              <TableRow key={idx}>
                <TableCell>
                  <Input type="text" value={row.rank} placeholder={String(idx + 1)} onChange={(e) => updateRow(idx, { rank: e.target.value })} size="sm" className="w-14" />
                </TableCell>
                <TableCell>
                  <Input type="text" value={row.code} placeholder="Es. CAND-014" onChange={(e) => updateRow(idx, { code: e.target.value })} size="sm" />
                </TableCell>
                <TableCell>
                  {scoreKind === 'number' ? (
                    <Input type="number" min={0} max={5} step={0.1} value={row.score} onChange={(e) => updateRow(idx, { score: e.target.value })} size="sm" className="w-20" />
                  ) : (
                    <Input type="text" value={row.score} onChange={(e) => updateRow(idx, { score: e.target.value })} size="sm" />
                  )}
                </TableCell>
                <TableCell>
                  <Input type="text" value={row.note} onChange={(e) => updateRow(idx, { note: e.target.value })} size="sm" />
                </TableCell>
                <TableCell>
                  <button type="button" onClick={() => removeRow(idx)} aria-label="Rimuovi dal confronto" className="text-destructive hover:text-destructive/80">
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      <button type="button" onClick={addRow} className={dashedBtnClass}>
        + Aggiungi candidato al confronto
      </button>
    </div>
  )
}
