import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

type Tone = 'info' | 'success' | 'warning' | 'destructive'

const ICON = { info: Info, success: CircleCheck, warning: TriangleAlert, destructive: CircleAlert } as const

// Un avviso con l'icona del suo tono: la parola e l'icona portano il
// significato, il colore accompagna. `layout="box"` è il riquadro (errori di
// pagina, backend non raggiungibile); `layout="text"` è la riga sotto
// un'azione o un campo, senza fondo.
export function InlineAlert({
  tone = 'destructive',
  layout = 'box',
  title,
  className,
  children,
}: {
  tone?: Tone
  layout?: 'box' | 'text'
  title?: ReactNode
  className?: string
  children: ReactNode
}) {
  const Icon = ICON[tone]
  if (layout === 'text') {
    const color = { info: 'text-muted-foreground', success: 'text-success', warning: 'text-warning', destructive: 'text-destructive' }[tone]
    return (
      <p role={tone === 'destructive' || tone === 'warning' ? 'alert' : 'status'} className={cn('flex items-start gap-2 text-app-small', color, className)}>
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{children}</span>
      </p>
    )
  }
  return (
    <Alert tone={tone} className={className}>
      <Icon aria-hidden="true" />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
