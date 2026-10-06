import { MessageCircle } from 'lucide-react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { type ReactNode, useState } from 'react'

import { cn } from '@/lib/utils'

// La nuvoletta che spiega: un'icona a fumetto che, al clic, apre accanto a sé
// un breve testo. Serve dove una voce ha bisogno di una spiegazione che non
// deve occupare spazio (guida al punteggio, definizione di una domanda).
// `label` è il nome accessibile del pulsante. Il testo si apre nel contenitore
// `data-portal-scope` più vicino, come i Dialog, così resta nelle variabili
// del modulo; si chiude con Esc o con un clic fuori.
export function InfoBubble({ label, title, children, tone = 'default' }: { label: string; title?: string; children: ReactNode; tone?: 'default' | 'primary' }) {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        ref={(el) => setContainer((el?.closest('[data-portal-scope]') as HTMLElement | null) ?? null)}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex size-8 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=open]:bg-accent data-[state=open]:text-foreground',
          tone === 'primary' && 'border-primary text-foreground',
        )}
      >
        <MessageCircle className="size-4" aria-hidden="true" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Content
          side="top"
          align="center"
          sideOffset={8}
          collisionPadding={16}
          className="z-(--z-popover) w-80 max-w-[calc(100vw-2rem)] rounded-md border-2 border-border-strong bg-popover p-4 text-app-small text-popover-foreground outline-none"
        >
          {title ? <p className="label-mono mb-2 text-muted-foreground">{title}</p> : null}
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
