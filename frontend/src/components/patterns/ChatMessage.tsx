import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// Un messaggio di una conversazione (Assistenza IA, Ask di Recruiting): chi
// scrive a destra su `secondary`, l'assistente a sinistra sulla card con il
// bordo. Niente lime: la conversazione non è un'azione. Testo small, a capo
// rispettati; i paragrafi e gli elenchi dentro hanno spazi propri.
export function ChatMessage({ from, children }: { from: 'user' | 'assistant'; children: ReactNode }) {
  return (
    <div
      data-slot="chat-message"
      data-from={from}
      className={cn(
        'max-w-[82%] rounded-md px-4 py-3 text-app-small whitespace-pre-wrap [&_li]:mb-1 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:ml-4 [&_ul]:list-disc [&_ul:last-child]:mb-0',
        from === 'user' ? 'self-end rounded-br-xs bg-secondary text-secondary-foreground' : 'self-start rounded-bl-xs border border-border bg-card text-card-foreground',
      )}
    >
      {children}
    </div>
  )
}
