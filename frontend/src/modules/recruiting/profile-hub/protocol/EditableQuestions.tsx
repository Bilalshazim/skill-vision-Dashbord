import { Plus, Trash2 } from 'lucide-react'

import { SelectField } from '@/components/patterns/SelectField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableCell, TableRow } from '@/components/ui/table'
import type { IvExtraQuestion } from '@/modules/recruiting/lib/interview-protocol-types'

const SCORE_1_5 = ['1', '2', '3', '4', '5']

// Il testo di una domanda fissa, riscrivibile: vuoto o uguale all'originale
// torna alla domanda di partenza.
export function QuestionLabelInput({ original, labels, onChange }: { original: string; labels?: Record<string, string>; onChange: (next: Record<string, string>) => void }) {
  return (
    <Input
      type="text"
      size="sm"
      aria-label={`Testo della domanda: ${original}`}
      value={labels?.[original] ?? original}
      onChange={(e) => {
        const next = { ...(labels || {}) }
        if (e.target.value === original) delete next[original]
        else next[original] = e.target.value
        onChange(next)
      }}
    />
  )
}

// Le domande aggiunte da chi conduce il colloquio, come righe della tabella
// (stesse colonne della scheda: `extraCells` riempie quelle fra testo e
// punteggio, `trailingCell` quelle dopo la nota).
export function ExtraQuestionRows({ rows, onChange, columns }: { rows: IvExtraQuestion[] | undefined; onChange: (next: IvExtraQuestion[]) => void; columns: 'notes' | 'eval' }) {
  const list = rows || []
  const patch = (id: string, p: Partial<IvExtraQuestion>) => onChange(list.map((r) => (r.id === id ? { ...r, ...p } : r)))
  return (
    <>
      {list.map((r) => (
        <TableRow key={r.id}>
          <TableCell>
            <Input type="text" size="sm" aria-label="Testo della nuova domanda" placeholder="Scrivi la domanda" value={r.label} onChange={(e) => patch(r.id, { label: e.target.value })} />
          </TableCell>
          {columns === 'eval' ? <TableCell className="text-app-caption text-muted-foreground">Extra</TableCell> : null}
          <TableCell>
            <SelectField value={r.score} onValueChange={(v) => patch(r.id, { score: v })} size="sm">
              <option value="">—</option>
              {SCORE_1_5.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </SelectField>
          </TableCell>
          {columns === 'eval' ? <TableCell /> : null}
          <TableCell>
            <div className="flex items-center gap-2">
              <Input type="text" size="sm" aria-label="Note" value={r.note} onChange={(e) => patch(r.id, { note: e.target.value })} />
              <Button type="button" variant="ghost" size="icon" aria-label="Rimuovi la domanda" onClick={() => onChange(list.filter((x) => x.id !== r.id))}>
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

export function AddQuestionButton({ rows, onChange }: { rows: IvExtraQuestion[] | undefined; onChange: (next: IvExtraQuestion[]) => void }) {
  return (
    <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => onChange([...(rows || []), { id: `q${Date.now()}`, label: '', score: '', note: '' }])}>
      <Plus aria-hidden="true" />
      Aggiungi una domanda
    </Button>
  )
}
