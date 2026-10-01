import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode, useEffect, useId } from 'react'

import { SelectField } from '@/components/patterns/SelectField'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type ControlProps = { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean | 'true' | 'false' }

// Elementi a cui un'etichetta può puntare. Il primo di questi fra i figli è
// "il controllo" del campo; il resto (un datalist, un bottone accanto, una
// nota calcolata) resta com'è.
const LINKABLE = new Set<unknown>(['input', 'textarea', 'select', Input, Textarea, SelectField])

// Un campo di form: etichetta in stile label, il controllo, una nota
// facoltativa e il messaggio d'errore. Collega da sé id, aria-describedby e
// aria-invalid sul controllo, così la pagina passa solo i valori.
// La nota è testo di contorno (caption, 13); l'errore no: è l'informazione
// che serve per andare avanti, quindi small (14).
// Se fra i figli non c'è un controllo (un gruppo di opzioni, un campo
// composto) l'etichetta resta visibile ma non punta a un id.
export function Field({
  label,
  hint,
  error,
  required,
  id,
  className,
  children,
}: {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  id?: string
  className?: string
  children: ReactNode
}) {
  const autoId = useId()
  const items = Children.toArray(children)
  const controlIndex = items.findIndex((c) => isValidElement(c) && LINKABLE.has(c.type))
  const single = controlIndex >= 0 ? (items[controlIndex] as ReactElement<ControlProps>) : null
  // Solo in sviluppo: un'etichetta che non punta a niente non si vede a
  // occhio, ma lo screen reader la perde. Il messaggio dice quale campo.
  const labelText = typeof label === 'string' ? label : '(non testuale)'
  const unlinked = !single
  useEffect(() => {
    if (import.meta.env.DEV && unlinked) {
      console.warn(`[Field] Nessun controllo da collegare all'etichetta "${labelText}": resta visibile ma senza for/id. Se il figlio è un controllo della libreria, aggiungilo a LINKABLE.`)
    }
  }, [unlinked, labelText])
  const controlId = id ?? single?.props.id ?? autoId
  const hintId = hint ? `${controlId}-hint` : undefined
  const errorId = error ? `${controlId}-error` : undefined
  const describedBy = [single?.props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined

  const control = single
    ? items.map((c, i) =>
        i === controlIndex
          ? cloneElement(single, {
              id: controlId,
              'aria-describedby': describedBy,
              'aria-invalid': error ? true : single.props['aria-invalid'],
            })
          : c,
      )
    : children

  return (
    <div data-slot="field" className={cn('flex min-w-0 flex-col gap-2', className)}>
      <Label htmlFor={single ? controlId : undefined}>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {control}
      {hint && (
        <p id={hintId} className="text-app-caption text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-app-small text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
