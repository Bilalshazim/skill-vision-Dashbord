import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { IvCompareRow } from '@/modules/recruiting/lib/interview-protocol-types'
import { dashedBtnClass } from '@/modules/recruiting/profile-hub/protocol/protocol-styles'

// Il confronto fra candidati della Scheda di valutazione e del Report finale
// (facoltativo: solo se più candidati concorrono per la stessa posizione).
// `code` è testo libero (per esempio "CAND-014"), non un riferimento a un
// record della pipeline: non diventa un selettore di candidati.
// `scoreKind` tiene una differenza vera: nella Scheda il punteggio è un numero
// 0–5, nel Report un testo ("punteggio/giudizio").
export function CompareRowsTable({
  scoreLabel,
  noteLabel,
  note2Label,
  scoreKind,
  rows,
  onChange,
}: {
  scoreLabel: string
  noteLabel: string
  note2Label: string
  scoreKind: 'number' | 'text'
  rows: IvCompareRow[]
  onChange: (rows: IvCompareRow[]) => void
}) {
  function updateRow(idx: number, patch: Partial<IvCompareRow>) {
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  return (
    <div className="flex flex-col gap-2">
      <Table frame size="sm" minWidth="lg">
        <TableHeader>
          <TableRow>
            <TableHead>Pos.</TableHead>
            <TableHead>Candidato</TableHead>
            <TableHead>{scoreLabel}</TableHead>
            <TableHead>{noteLabel}</TableHead>
            <TableHead>{note2Label}</TableHead>
            <TableHead>
              <span className="sr-only">Azioni</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Nessun candidato in confronto. Aggiungine uno con il pulsante qui sotto.
              </TableCell>
            </TableRow>
          )}
          {rows.map((row, idx) => (
            // eslint-disable-next-line react/no-array-index-key -- le righe non hanno un id: sono un elenco che si taglia per posizione
            <TableRow key={idx}>
              <TableCell>
                <Input type="text" size="sm" aria-label={`Posizione, riga ${idx + 1}`} value={row.rank} placeholder={String(idx + 1)} onChange={(e) => updateRow(idx, { rank: e.target.value })} className="w-14" />
              </TableCell>
              <TableCell>
                <Input type="text" size="sm" aria-label={`Candidato, riga ${idx + 1}`} value={row.code} placeholder="Es. CAND-014" onChange={(e) => updateRow(idx, { code: e.target.value })} />
              </TableCell>
              <TableCell>
                {scoreKind === 'number' ? (
                  <Input type="number" size="sm" min={0} max={5} step={0.1} aria-label={`${scoreLabel}, riga ${idx + 1}`} value={row.score} onChange={(e) => updateRow(idx, { score: e.target.value })} className="w-20" />
                ) : (
                  <Input type="text" size="sm" aria-label={`${scoreLabel}, riga ${idx + 1}`} value={row.score} onChange={(e) => updateRow(idx, { score: e.target.value })} />
                )}
              </TableCell>
              <TableCell>
                <Input type="text" size="sm" aria-label={`${noteLabel}, riga ${idx + 1}`} value={row.note} onChange={(e) => updateRow(idx, { note: e.target.value })} />
              </TableCell>
              <TableCell>
                <Input type="text" size="sm" aria-label={`${note2Label}, riga ${idx + 1}`} value={row.note2 ?? ''} onChange={(e) => updateRow(idx, { note2: e.target.value })} />
              </TableCell>
              <TableCell>
                <Button type="button" variant="ghost" size="icon" aria-label={`Rimuovi la riga ${idx + 1} dal confronto`} onClick={() => onChange(rows.filter((_, i) => i !== idx))}>
                  <X aria-hidden="true" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <button type="button" onClick={() => onChange([...rows, { rank: '', code: '', score: '', note: '', note2: '' }])} className={dashedBtnClass}>
        + Aggiungi candidato al confronto
      </button>
    </div>
  )
}
