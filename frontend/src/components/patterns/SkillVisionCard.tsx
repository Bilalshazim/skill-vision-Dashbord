import type { IconComponent } from '@/components/patterns/CompositeIcon'
import { type CSSProperties, type ReactNode, useId } from 'react'

import { FolderCard } from '@/components/patterns/FolderCard'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

// Card della Home con la scelta "oggi" / "Skill Vision" del concept. La card
// porta solo testo; ogni numero sta nel pannello che "Skill Vision" apre
// accanto, e allora il blocco prende tutta la riga della griglia.
// Aperto/chiuso lo decide chi la usa (di solito ricordato nel browser).
// `style`: solo il posto nella griglia (order, grid-column), deciso dalla pagina.
export function SkillVisionCard({
  icon,
  iconSide,
  title,
  subtitle,
  lines = [],
  actions,
  panel,
  open,
  onOpenChange,
  labels = { today: 'oggi', skillVision: 'Skill Vision' },
  style,
}: {
  icon: IconComponent
  iconSide?: 'start' | 'end'
  title: ReactNode
  subtitle?: ReactNode
  lines?: readonly string[]
  actions?: ReactNode
  panel: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  labels?: { today: string; skillVision: string }
  style?: CSSProperties
}) {
  const panelId = useId()
  return (
    <div
      data-slot="skill-vision-card"
      data-state={open ? 'open' : 'closed'}
      style={style}
      className={cn('flex min-w-0 flex-col', open && 'col-span-full grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]')}
    >
      <FolderCard
        icon={icon}
        iconSide={iconSide}
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
            <ToggleGroupItem value="skillvision" aria-controls={open ? panelId : undefined}>
              {labels.skillVision}
            </ToggleGroupItem>
          </ToggleGroup>
        }
      >
        {lines.length ? (
          <div className="mt-4 flex flex-col gap-1 text-app-body font-medium text-card-foreground">
            {lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        ) : null}
        {actions ? <div className="mt-auto flex flex-wrap justify-center gap-2 pt-6">{actions}</div> : null}
      </FolderCard>

      {open ? (
        <div id={panelId} className="flex min-w-0 flex-col gap-3">
          {panel}
        </div>
      ) : null}
    </div>
  )
}
