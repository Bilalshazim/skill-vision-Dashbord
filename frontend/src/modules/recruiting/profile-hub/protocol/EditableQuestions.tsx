import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { IvExtraQuestion } from '@/modules/recruiting/lib/interview-protocol-types'
import { QuestionRow } from '@/modules/recruiting/profile-hub/protocol/protocol-ui'

// Il testo di una domanda fissa, riscrivibile: vuoto o uguale al testo di
// partenza (`display`, di solito la chiave stessa) torna alla domanda originale.
export function QuestionLabelInput({
  original,
  display,
  labels,
  onChange,
}: {
  original: string
  display?: string
  labels?: Record<string, string>
  onChange: (next: Record<string, string>) => void
}) {
  const start = display ?? original
  return (
    <Textarea
      variant="inline"
      size="sm"
      rows={1}
      className="text-foreground"
      aria-label={`Testo della domanda: ${start}`}
      value={labels?.[original] ?? start}
      onChange={(e) => {
        const next = { ...(labels || {}) }
        if (e.target.value === start || e.target.value === '') delete next[original]
        else next[original] = e.target.value
        onChange(next)
      }}
    />
  )
}

export function newQuestion(): IvExtraQuestion {
  return { id: `q${Date.now()}`, label: '', score: '', note: '' }
}

// Le domande personalizzate del Verbale (Parte B): il testo lo scrive chi
// conduce il colloquio, con la sintesi della risposta e il punteggio.
export function CustomQuestionRows({ rows, onChange }: { rows: IvExtraQuestion[]; onChange: (next: IvExtraQuestion[]) => void }) {
  const patch = (id: string, p: Partial<IvExtraQuestion>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...p } : r)))
  return (
    <>
      {rows.map((r, i) => (
        <QuestionRow
          key={r.id}
          prompt={
            <div className="flex items-center gap-2">
              <span className="font-mono text-app-caption text-muted-foreground tabular-nums">{i + 1}.</span>
              <Input type="text" size="sm" aria-label={`Testo della domanda personalizzata ${i + 1}`} placeholder="Scrivi la domanda" value={r.label} onChange={(e) => patch(r.id, { label: e.target.value })} />
              <Button type="button" variant="ghost" size="icon" aria-label={`Rimuovi la domanda ${i + 1}`} onClick={() => onChange(rows.filter((x) => x.id !== r.id))}>
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          }
          note={r.note}
          onNote={(note) => patch(r.id, { note })}
          score={r.score}
          onScore={(score) => patch(r.id, { score })}
          noteLabel={`Sintesi della risposta ${i + 1}`}
        />
      ))}
    </>
  )
}

export function AddQuestionButton({ rows, onChange, label = 'Aggiungi una domanda' }: { rows: IvExtraQuestion[] | undefined; onChange: (next: IvExtraQuestion[]) => void; label?: string }) {
  return (
    <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => onChange([...(rows || []), newQuestion()])}>
      <Plus aria-hidden="true" />
      {label}
    </Button>
  )
}

