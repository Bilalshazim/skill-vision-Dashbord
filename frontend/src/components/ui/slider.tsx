import { Slider as SliderPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/lib/utils'

// Cursore. Tratto pieno in `primary`, dove lo mette shadcn: il tema decide
// com'è il lime, la primitiva lo applica da sola (CLAUDE.md §1). Il bordo del
// pallino in chiaro è accent-600: accent-400 sul fondo pagina chiaro non si
// distingue (DECISIONI, "Pallino dello Slider"); in scuro resta `primary`. Il valore va sempre scritto accanto: su fondo chiaro il
// lime sul binario ha poco contrasto e non deve portare l'informazione da
// solo. Tastiera: frecce, Pagina su/giù, Inizio/Fine (Radix).
function Slider({ className, defaultValue, value, min = 0, max = 100, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const thumbs = React.useMemo(() => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min]), [value, defaultValue, min])
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn('relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50', className)}
      {...props}
    >
      <SliderPrimitive.Track data-slot="slider-track" className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {thumbs.map((_, i) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={i}
          className="block size-4 shrink-0 rounded-full border-2 border-accent-600 dark:border-primary bg-background transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
