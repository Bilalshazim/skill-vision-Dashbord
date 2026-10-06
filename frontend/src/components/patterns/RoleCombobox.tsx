import { ChevronDown, PencilLine } from 'lucide-react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type RoleGroup = { label: string; roles: string[] }

const norm = (s: string) => s.toLowerCase().trim()

// Il selettore di posizione/mansione: un campo in cui si scrive e un elenco
// completo, diviso per gruppo (profili preconfigurati, poi le aree
// aziendali). Scrivendo l'elenco si restringe a ciò che contiene il testo
// (nel nome della posizione o dell'area); il testo scritto vale anche da solo
// come posizione personalizzata ("Usa «…»"). Nessun limite di righe: l'elenco
// scorre. `value` è sempre il testo del campo; `onValueChange` si chiama a ogni
// battuta e a ogni scelta, così il chiamante non distingue fra le due.
export function RoleCombobox({
  value,
  onValueChange,
  groups,
  placeholder = 'Scrivi o scegli una posizione',
  customLabel = 'Usa la posizione scritta',
  emptyLabel = 'Nessuna posizione trovata',
  'aria-label': ariaLabel,
  id,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  groups: RoleGroup[]
  placeholder?: string
  customLabel?: string
  emptyLabel?: string
  'aria-label'?: string
  id?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  // null: l'elenco è intero (appena aperto); una stringa: si sta filtrando.
  const [filter, setFilter] = useState<string | null>(null)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  const q = filter == null ? '' : norm(filter)
  const visible = groups
    .map((g) => ({ label: g.label, roles: g.roles.filter((r) => !q || norm(r).includes(q) || norm(g.label).includes(q)) }))
    .filter((g) => g.roles.length > 0)
  const typed = value.trim()
  const exact = groups.some((g) => g.roles.some((r) => norm(r) === norm(typed)))

  function close() {
    setOpen(false)
    setFilter(null)
  }
  function pick(role: string) {
    onValueChange(role)
    close()
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <PopoverPrimitive.Anchor asChild>
        <div className={cn('relative', className)} ref={(el) => setContainer((el?.closest('[data-portal-scope]') as HTMLElement | null) ?? null)}>
          <Input
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-label={ariaLabel}
            autoComplete="off"
            placeholder={placeholder}
            value={value}
            className="pr-9"
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onChange={(e) => {
              onValueChange(e.target.value)
              setFilter(e.target.value)
              setOpen(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                close()
              } else if (e.key === 'Escape' && open) {
                e.stopPropagation()
                close()
              }
            }}
          />
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        </div>
      </PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          collisionPadding={16}
          onInteractOutside={(e) => {
            // Un clic sul campo stesso non chiude l'elenco.
            if ((e.target as HTMLElement).closest('[role=combobox]')) e.preventDefault()
          }}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="z-(--z-popover) max-h-80 w-(--radix-popover-trigger-width) min-w-64 overflow-y-auto rounded-md border-2 border-border-strong bg-popover p-1 text-popover-foreground outline-none"
        >
          {typed && !exact ? (
            <button type="button" onClick={() => pick(typed)} className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-app-small font-medium text-foreground hover:bg-accent">
              <PencilLine className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate">
                {customLabel}: «{typed}»
              </span>
            </button>
          ) : null}
          {visible.length === 0 ? <p className="px-3 py-2 text-app-small text-muted-foreground">{emptyLabel}</p> : null}
          {visible.map((g) => (
            <div key={g.label} role="group" aria-label={g.label}>
              <div className="label-mono sticky top-0 bg-popover px-3 py-2 text-muted-foreground">{g.label}</div>
              {g.roles.map((r) => (
                <button
                  key={`${g.label}-${r}`}
                  type="button"
                  onClick={() => pick(r)}
                  aria-current={norm(r) === norm(typed) ? 'true' : undefined}
                  className={cn('flex w-full items-center rounded-sm px-3 py-1.5 text-left text-app-small hover:bg-accent', norm(r) === norm(typed) ? 'font-semibold text-foreground' : 'text-foreground')}
                >
                  {r}
                </button>
              ))}
            </div>
          ))}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
