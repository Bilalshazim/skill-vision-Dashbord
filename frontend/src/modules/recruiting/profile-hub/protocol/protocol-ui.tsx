import { useId, type ReactNode } from 'react'

import { SelectField } from '@/components/patterns/SelectField'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

// I pezzi dei tre documenti dell'Area Valutatore (Verbale di colloquio,
// Scheda di valutazione, Report finale), disegnati sui modelli del cliente
// (Foglio 8): sezioni numerate con filetto, bande di parte, tabelle di
// domande con punteggio. Campi e griglie vengono dai pattern della libreria
// (Field, FieldGrid); qui stanno solo le forme proprie dei documenti.

const SCORES = ['1', '2', '3', '4', '5']

// Una sezione numerata: titolo, nota breve a fianco e un filetto sotto.
export function DocSection({ n, title, hint, children }: { n?: number; title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-baseline gap-x-2 border-b border-border pb-2">
        <h3 className="text-app-section text-foreground">
          {n != null && <span className="mr-2 font-mono text-muted-foreground tabular-nums">{n}</span>}
          {title}
        </h3>
        {hint && <p className="text-app-caption text-muted-foreground">{hint}</p>}
      </header>
      {children}
    </section>
  )
}

// La banda che apre una parte del documento (Parte A, B, C).
export function DocPart({ part, title }: { part: string; title: string }) {
  return (
    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 rounded-md border border-border bg-muted px-4 py-3">
      <span className="label-mono text-foreground">{part}</span>
      <span className="text-app-body font-semibold text-foreground">{title}</span>
    </div>
  )
}

// Scelta singola fra poche voci (modalità, fase, fit…). Un clic sulla voce
// già scelta la toglie. La voce scelta ha il bordo pieno e il peso 600, non
// solo un fondo diverso.
export function ChoiceGroup({
  label,
  hideLabel,
  value,
  onChange,
  options,
  className,
}: {
  label: string
  hideLabel?: boolean
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  className?: string
}) {
  const id = useId()
  const group = (
    <ToggleGroup type="single" aria-label={hideLabel ? label : undefined} aria-labelledby={hideLabel ? undefined : id} value={value} onValueChange={onChange} className={hideLabel ? className : undefined}>
      {options.map((o) => (
        <ToggleGroupItem key={o} value={o} className="border border-transparent data-[state=on]:border-foreground data-[state=on]:font-semibold data-[state=on]:text-foreground">
          {o}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
  if (hideLabel) return group
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <Label id={id}>{label}</Label>
      {group}
    </div>
  )
}

// Punteggio 1–5 in una tendina stretta, con il "/ 5" del modello accanto.
export function ScoreSelect({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <SelectField value={value} onValueChange={onChange} size="sm" className="w-16" aria-label={label}>
        <option value="">—</option>
        {SCORES.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </SelectField>
      <span className="font-mono text-app-caption text-muted-foreground">/ 5</span>
    </div>
  )
}

// Punteggio 1–5 come cinque voci in fila (le aree di riepilogo).
export function ScoreChoice({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return <ChoiceGroup hideLabel label={label} value={value} onChange={onChange} options={SCORES} />
}

const ROW_GRID = 'md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_6rem]'

// Tabella di domande: domanda con la traccia "Ascoltare", risposta e punteggio.
export function QuestionTable({ columns, children }: { columns: [string, string, string]; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <div className={cn('hidden gap-3 border-b border-border bg-muted px-3 py-2 md:grid', ROW_GRID)}>
        {columns.map((c) => (
          <span key={c} className="label-mono text-muted-foreground">
            {c}
          </span>
        ))}
      </div>
      <div className="flex flex-col divide-y divide-border">{children}</div>
    </div>
  )
}

export function QuestionRow({
  title,
  prompt,
  hint,
  note,
  onNote,
  score,
  onScore,
  noteLabel,
}: {
  title?: ReactNode
  prompt: ReactNode
  hint?: string
  note: string
  onNote: (value: string) => void
  score: string
  onScore: (value: string) => void
  noteLabel: string
}) {
  return (
    <div className={cn('grid gap-3 px-3 py-3', ROW_GRID)}>
      <div className="flex min-w-0 flex-col gap-1">
        {title && <span className="label-mono text-foreground">{title}</span>}
        {prompt}
        {hint && <p className="text-app-caption text-muted-foreground">{hint}</p>}
      </div>
      <Textarea size="sm" className="min-h-16" aria-label={noteLabel} value={note} onChange={(e) => onNote(e.target.value)} />
      <ScoreSelect value={score} onChange={onScore} label={`Punteggio: ${noteLabel}`} />
    </div>
  )
}

export function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-app-small text-foreground">
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(c === true)} />
      {children}
    </label>
  )
}

// Il riquadro con le voci di una raccomandazione o di un esito: una sola
// scelta, con la casella (come nel modello).
export function CheckBox({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2 rounded-sm border border-border bg-muted p-3">{children}</div>
}

export function ModalEyebrow({ children }: { children: ReactNode }) {
  return <div className="label-mono text-muted-foreground">{children}</div>
}
