import type { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { type CSSProperties, type ReactNode, useEffect, useId, useRef } from 'react'

import { FolderCard } from '@/components/patterns/FolderCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Una card con un dettaglio che si apre. La card porta il testo; il dettaglio
// compare accanto (`inline`, il blocco prende tutta la riga della griglia) o
// lo mostra la pagina sotto la riga (`below`). Aperto/chiuso lo decide chi
// la usa. Il controllo è un bottone che dice cosa fa ("Mostra il dettaglio"),
// con `aria-expanded`: il vecchio selettore "oggi / Skill Vision" non si
// capiva e nascondeva i dati (CLAUDE.md, Fase 6, 2026-10-23). Il nome resta
// per non toccare chi la usa. `style`: solo il posto nella griglia.
export function SkillVisionCard({
  icon,
  title,
  subtitle,
  lines = [],
  headline,
  description,
  actions,
  panel,
  open,
  onOpenChange,
  labels = { open: 'Mostra il dettaglio', close: 'Nascondi il dettaglio' },
  style,
  panelPlacement = 'inline',
  size,
}: {
  icon?: LucideIcon
  title: ReactNode
  subtitle?: ReactNode
  lines?: readonly string[]
  /** La domanda in evidenza sotto il sottotitolo. */
  headline?: ReactNode
  /** Una o due righe di spiegazione, sotto la domanda. */
  description?: ReactNode
  actions?: ReactNode
  panel: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  labels?: { open: string; close: string }
  style?: CSSProperties
  /** `below`: la card resta nella sua cella e il pannello lo mostra la
   *  pagina, sotto la riga (Profilo della ricerca di Recruiting). */
  panelPlacement?: 'inline' | 'below'
  size?: 'default' | 'tall'
}) {
  const inline = panelPlacement === 'inline'
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(open)
  useEffect(() => {
    const opened = open && !wasOpen.current
    wasOpen.current = open
    if (!opened) return
    const id = requestAnimationFrame(() => {
      const el = rootRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top
      if (top < 96) window.scrollBy({ top: top - 96, behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(id)
  }, [open])
  return (
    <div
      ref={rootRef}
      data-slot="skill-vision-card"
      data-state={open ? 'open' : 'closed'}
      style={style}
      className={cn('flex min-w-0 flex-col', inline && open && 'col-span-full grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]')}
    >
      <FolderCard icon={icon} size={size} title={title} kicker={subtitle} className="flex-1">
        {headline ? <p className="mt-2 text-app-body font-semibold text-card-foreground">{headline}</p> : null}
        {description ? <p className="text-app-small text-muted-foreground">{description}</p> : null}
        {lines.length ? (
          <div className="mt-2 flex flex-col gap-1 text-app-body text-card-foreground">
            {lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <Button
            type="button"
            size="sm"
            variant={open ? 'default' : 'outline'}
            aria-expanded={open}
            aria-controls={inline && open ? panelId : undefined}
            onClick={() => onOpenChange(!open)}
          >
            {open ? labels.close : labels.open}
            <ChevronDown className={cn('transition-transform', open && 'rotate-180')} aria-hidden="true" />
          </Button>
          {actions}
        </div>
      </FolderCard>

      {inline && open ? (
        <div id={panelId} className="flex min-w-0 flex-col gap-3">
          {panel}
        </div>
      ) : null}
    </div>
  )
}
