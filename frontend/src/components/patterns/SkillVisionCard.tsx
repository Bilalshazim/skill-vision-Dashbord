import type { IconComponent } from '@/components/patterns/CompositeIcon'
import { type CSSProperties, type ReactNode, useEffect, useId, useRef } from 'react'

import { FolderCard, type FolderTint, folderTintStyle } from '@/components/patterns/FolderCard'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

// Card della Home con la scelta "oggi" / "Skill Vision" del concept. La card
// porta solo testo; ogni numero sta nel pannello che "Skill Vision" apre
// accanto, e allora il blocco prende tutta la riga della griglia.
// Aperto/chiuso lo decide chi la usa (di solito ricordato nel browser).
// `style`: solo il posto nella griglia (order, grid-column), deciso dalla pagina.
// La card e il suo pannello partono sempre dalla stessa altezza (richiesta del
// cliente, 2026-10-13): la card non è più `sticky`, che con la pagina
// scorsa la spostava in basso rispetto al pannello; aprendo, se il blocco
// comincia sopra la parte visibile, la pagina scorre fino al suo inizio.
// `tint`: il colore della card (FolderCard), ripetuto sul riquadro del
// pannello, così si vede quale pannello appartiene a quale card.
export function SkillVisionCard({
  icon,
  iconSide,
  title,
  subtitle,
  lines = [],
  headline,
  description,
  actions,
  panel,
  open,
  onOpenChange,
  labels = { today: 'oggi', skillVision: 'Skill Vision' },
  tint,
  style,
  panelPlacement = 'inline',
}: {
  icon: IconComponent
  iconSide?: 'start' | 'end'
  title: ReactNode
  subtitle?: ReactNode
  lines?: readonly string[]
  /** La domanda in evidenza sotto il sottotitolo (Foglio 3 di Assessment). */
  headline?: ReactNode
  /** Due righe di spiegazione, piccole, sotto la domanda. */
  description?: ReactNode
  actions?: ReactNode
  panel: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  labels?: { today: string; skillVision: string }
  tint?: FolderTint
  style?: CSSProperties
  /** `below`: la card resta nella sua cella e il pannello lo mostra la
   *  pagina, sotto la riga (Profilo della ricerca di Recruiting). */
  panelPlacement?: 'inline' | 'below'
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
      <FolderCard
        icon={icon}
        iconSide={iconSide}
        tint={tint}
        title={title}
        kicker={subtitle}
        className="flex-1"
        aside={
          <ToggleGroup
            type="single"
            value={open ? 'skillvision' : 'oggi'}
            onValueChange={(v) => onOpenChange(v === 'skillvision')}
            aria-label={typeof title === 'string' ? title : undefined}
          >
            <ToggleGroupItem value="oggi">{labels.today}</ToggleGroupItem>
            <ToggleGroupItem value="skillvision" aria-controls={inline && open ? panelId : undefined}>
              {labels.skillVision}
            </ToggleGroupItem>
          </ToggleGroup>
        }
      >
        {headline ? <p className="mt-4 text-app-body font-semibold text-card-foreground">{headline}</p> : null}
        {description ? <p className={headline ? 'mt-2 text-app-caption text-muted-foreground' : 'mt-4 text-app-caption text-muted-foreground'}>{description}</p> : null}
        {lines.length ? (
          <div className="mt-4 flex flex-col gap-1 text-app-body font-medium text-card-foreground">
            {lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        ) : null}
        {actions ? <div className="mt-auto flex flex-wrap justify-center gap-2 pt-6">{actions}</div> : null}
      </FolderCard>

      {inline && open ? (
        <div id={panelId} className={cn('flex min-w-0 flex-col gap-3', tint && 'rounded-lg border-2 border-primary p-4')} style={folderTintStyle(tint)}>
          {panel}
        </div>
      ) : null}
    </div>
  )
}
