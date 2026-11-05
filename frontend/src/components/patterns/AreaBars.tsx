import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// Un riquadro per area nel confronto fino a cinque persone (tavola «Confronto fino a
// 5»): una barra per persona, nel suo colore, dalla più alta, con le iniziali e il
// valore scritti. Clic su un nome altrove: `focus` attenua le altre. Al passaggio del
// mouse la barra dice persona, area e valore.
export function AreaBars({
  title,
  rows,
  format,
  tip,
  focus,
  className,
}: {
  title: string
  rows: { id: string; label: string; name: string; value: number; color: string }[]
  format: (n: number) => string
  tip: (name: string, area: string, value: string) => string
  focus?: string | null
  className?: string
}) {
  return (
    <Card data-slot="area-bars" className={cn('gap-2', className)}>
      <p className="label-mono text-muted-foreground">{title}</p>
      <ul className="flex flex-col gap-2">
        {[...rows]
          .sort((a, b) => b.value - a.value)
          .map((r) => (
            <li key={r.id} className={cn('grid grid-cols-6 items-center gap-2 transition-opacity', focus && focus !== r.id && 'opacity-40')}>
              <span className="label-mono text-muted-foreground">{r.label}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="col-span-4 h-4 rounded-xs bg-muted">
                    <span className="block h-full rounded-xs" style={{ width: `${(r.value / 10) * 100}%`, background: r.color }} />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{tip(r.name, title, format(r.value))}</TooltipContent>
              </Tooltip>
              <span className="text-right text-app-small tabular-nums text-foreground">{format(r.value)}</span>
            </li>
          ))}
      </ul>
    </Card>
  )
}
