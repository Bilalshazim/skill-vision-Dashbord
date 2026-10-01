import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

// Una nota di contorno sotto o accanto a un contenuto: corpo small, testo
// secondario; il grassetto dentro (`<b>`) torna al colore del testo, peso
// 500. `size="caption"` per le note più piccole (legende, fonti).
// `className` solo per il posizionamento (margini). `as="div"` quando il
// contenuto ha blocchi (testo HTML dai dizionari con elenchi).
export function Note({ size = 'small', as: Tag = 'p', className, ...props }: ComponentProps<'p'> & { size?: 'small' | 'caption'; as?: 'p' | 'div' }) {
  return <Tag data-slot="note" className={cn('text-muted-foreground [&_b]:font-medium [&_b]:text-foreground', size === 'small' ? 'text-app-small' : 'text-app-caption', className)} {...props} />
}
