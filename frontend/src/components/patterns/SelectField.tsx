import { Children, Fragment, isValidElement, type ReactNode } from 'react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type OptionProps = { value?: string | number; disabled?: boolean; children?: ReactNode }
type Option = { value: string; label: ReactNode; disabled?: boolean }

// La Select di Radix non accetta un'opzione con valore "": qui "" viaggia
// come un valore sentinella e torna "" a chi ascolta. Così un'opzione
// "— Nessuno —" resta selezionabile e il valore salvato non cambia.
const EMPTY = '__vuoto__'
const toItem = (v: string) => (v === '' ? EMPTY : v)
const fromItem = (v: string) => (v === EMPTY ? '' : v)

function collectOptions(children: ReactNode, out: Option[] = []): Option[] {
  Children.forEach(children, (child) => {
    if (!isValidElement<OptionProps & { children?: ReactNode }>(child)) return
    if (child.type === 'option') {
      const { value, disabled, children: label } = child.props
      const v = value ?? (typeof label === 'string' ? label : '')
      out.push({ value: String(v), label, disabled })
    } else if (child.type === Fragment) {
      collectOptions(child.props.children, out)
    }
  })
  return out
}

// Tendina a scelta singola per i moduli. Accetta come figli le stesse
// <option> di una <select> nativa (anche generate con map), così una
// select si converte senza riscriverne il contenuto. `onValueChange`
// riceve la stringa, come prima `e.target.value`.
export function SelectField({
  value,
  onValueChange,
  placeholder,
  size,
  disabled,
  name,
  id,
  className,
  children,
  ...aria
}: {
  value: string | number | null | undefined
  onValueChange: (value: string) => void
  placeholder?: ReactNode
  size?: 'default' | 'sm'
  disabled?: boolean
  name?: string
  id?: string
  className?: string
  children: ReactNode
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean | 'true' | 'false'
}) {
  const options = collectOptions(children)
  // Un valore che nessuna opzione ha (per esempio "" senza un'opzione vuota)
  // lascia vedere il segnaposto: la select nativa mostrava la prima opzione
  // come se fosse scelta, qui si vede che non lo è.
  const current = value == null ? undefined : toItem(String(value))
  const known = current !== undefined && options.some((o) => toItem(o.value) === current)
  return (
    <Select value={known ? current : ''} onValueChange={(v) => onValueChange(fromItem(v))} disabled={disabled} name={name}>
      <SelectTrigger id={id} size={size} className={className} {...aria}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={toItem(o.value)} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
