import { Building2 } from 'lucide-react'

import { SelectField } from '@/components/patterns/SelectField'

export type OrgCompany = { id: string; name: string }

// Gruppo → società, in testa alla barra laterale (CLAUDE.md cap. 7, "Azienda
// attiva"). Il guscio è costruito per la struttura di gruppo anche quando la
// società è una sola: con un gruppo si vede il suo nome sopra; con più
// società si sceglie quella attiva; con una sola, il suo nome e basta.
// Non va a prendere dati: riceve l'elenco e restituisce la scelta.
export function CompanySwitcher({
  group,
  companies,
  activeId,
  onChange,
}: {
  group?: { name: string } | null
  companies: OrgCompany[]
  activeId?: string
  onChange?: (id: string) => void
}) {
  const active = companies.find((c) => c.id === activeId) ?? companies[0]
  return (
    <div data-slot="company-switcher" className="flex min-w-0 flex-col gap-1 px-1">
      <div className="label-mono flex items-center gap-2 text-muted-foreground">
        <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
        {group ? group.name : 'Società'}
      </div>
      {companies.length > 1 && onChange ? (
        <SelectField size="sm" className="w-full" value={active?.id ?? ''} onValueChange={onChange} aria-label="Società attiva">
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
      ) : (
        <p className="truncate px-2 text-app-small font-medium text-sidebar-foreground">{active?.name || '—'}</p>
      )}
    </div>
  )
}
