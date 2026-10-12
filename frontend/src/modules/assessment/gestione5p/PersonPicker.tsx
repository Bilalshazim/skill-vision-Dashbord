import { useState } from 'react'

import { ModalDialog } from '@/components/patterns/ModalDialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { SourceKey } from '@/modules/assessment/gestione5p/model'
import { SRC } from '@/modules/assessment/gestione5p/model'

export type PickItem = { v: string; info?: string; right?: string; dis?: string; sug?: boolean; cur?: boolean; rank?: number }

// La scelta di una persona dall'elenco nominativi: ricerca, in cima i
// suggeriti (con il loro criterio), accanto a ogni nome la copertura o il
// carico; le scelte non valide restano visibili con il motivo, non si
// selezionano. Tastiera: frecce per scorrere, Invio per scegliere, Esc chiude.
export function PersonPicker({
  role,
  title,
  sub,
  sugLabel = 'Suggeriti',
  initialQuery = '',
  items,
  onPick,
  onClose,
}: {
  role?: SourceKey
  title: string
  sub?: string
  sugLabel?: string
  initialQuery?: string
  items: PickItem[]
  onPick: (v: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState(initialQuery)
  const [act, setAct] = useState(-1)
  const raw = q.trim().toLowerCase()
  const f = items.filter((o) => !raw || `${o.v} ${o.info || ''}`.toLowerCase().includes(raw))
  const sug = f.filter((o) => o.sug && !o.dis).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0) || a.v.localeCompare(b.v))
  const oth = f.filter((o) => !(o.sug && !o.dis)).sort((a, b) => Number(!!a.dis) - Number(!!b.dis) || a.v.localeCompare(b.v))
  const enabled = [...sug, ...oth].filter((o) => !o.dis)

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!enabled.length) return
      setAct((i) => (e.key === 'ArrowDown' ? Math.min(i + 1, enabled.length - 1) : Math.max(i - 1, 0)))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const o = enabled[act >= 0 ? act : 0]
      if (o && (act >= 0 || raw)) onPick(o.v)
    }
  }
  const opt = (o: PickItem) => (
    <button
      key={o.v}
      type="button"
      role="option"
      aria-selected={!!o.cur}
      disabled={!!o.dis}
      onClick={() => onPick(o.v)}
      className={cn('grid w-full grid-cols-[1fr_auto] gap-x-3 rounded-sm px-3 py-2 text-left hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60', o.cur && 'border-l-2 border-l-foreground', enabled[act] === o && 'bg-accent')}
    >
      <b className="text-app-small font-semibold">{o.v}</b>
      <span className="row-span-2 self-center font-mono text-app-caption text-muted-foreground">{o.right}</span>
      <small className="text-app-caption text-muted-foreground">{[o.info, o.dis].filter(Boolean).join(' — ')}</small>
    </button>
  )
  return (
    <ModalDialog
      title={
        <span className="flex flex-col gap-2">
          {role ? <Badge tone="neutral" className="self-start">{SRC[role].lab}</Badge> : null}
          {title}
        </span>
      }
      sub={sub}
      onClose={onClose}
      footer={<span className="mr-auto text-app-caption text-muted-foreground">↑ ↓ per scorrere · Invio per scegliere · Esc per chiudere</span>}
    >
      <Input autoFocus aria-label="Cerca per nome o area" placeholder="Cerca per nome o area" value={q} onChange={(e) => { setQ(e.target.value); setAct(-1) }} onKeyDown={onKey} />
      <div role="listbox" className="mt-3 flex flex-col gap-1">
        {sug.length ? <div className="label-mono px-3 pt-2 pb-1 text-muted-foreground">{sugLabel}</div> : null}
        {sug.map(opt)}
        {oth.length ? <div className="label-mono px-3 pt-2 pb-1 text-muted-foreground">{sug.length ? 'Tutti gli altri' : 'Persone'}</div> : null}
        {oth.map(opt)}
        {!f.length ? <p className="p-2 text-app-small text-muted-foreground">Nessun nome trovato.</p> : null}
      </div>
    </ModalDialog>
  )
}
