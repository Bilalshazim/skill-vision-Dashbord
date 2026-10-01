import type { ReactNode } from 'react'

// Piccoli pezzi dei 3 moduli del Protocollo di Intervista. Campi e griglie
// sono passati ai pattern della libreria (components/patterns/Field,
// FieldGrid); qui restano il separatore di sezione e il sovratitolo, in stile
// label, e la riga con casella (va a Checkbox nel blocco 3).

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="label-mono mt-3 border-t border-border pt-3 text-muted-foreground">{children}</div>
}

export function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-app-small text-foreground">
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(c === true)} />
      {children}
    </label>
  )
}

export function ModalEyebrow({ children }: { children: ReactNode }) {
  return <div className="label-mono text-muted-foreground">{children}</div>
}import { Checkbox } from '@/components/ui/checkbox'

