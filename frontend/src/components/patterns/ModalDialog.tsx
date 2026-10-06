import { type ReactNode, useCallback, useState } from 'react'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Dialog con titolo, sottotitolo, contenuto e piede: la forma del vecchio
// Modal di Assessment, con la stessa API (title, sub, wide, onClose, footer)
// più `dirty`, che fa chiedere conferma prima di chiudere con Esc, clic
// fuori o ✕. Si monta aperto: chi lo usa lo mostra o non lo mostra.
//
// Il portale si apre nel contenitore più vicino con `data-portal-scope`
// (il guscio di Assessment lo ha): così il contenuto resta dentro le
// variabili del modulo che l'ha aperto. Fuori da uno scope, va su <body>.
export function ModalDialog({
  title,
  sub,
  wide = false,
  size,
  onClose,
  footer,
  dirty = false,
  children,
}: {
  title: ReactNode
  sub?: ReactNode
  wide?: boolean
  /** Più largo di `wide`: per i moduli con molte colonne (es. la valutazione a 25 voci). */
  size?: 'xl'
  onClose: () => void
  footer?: ReactNode
  dirty?: boolean
  children: ReactNode
}) {
  // undefined finché l'ancora non è montata: il dialog si apre solo quando
  // si sa dove, così il contenuto non nasce su <body> per poi spostarsi.
  const [container, setContainer] = useState<HTMLElement | null | undefined>(undefined)
  const anchor = useCallback((el: HTMLSpanElement | null) => {
    setContainer((el?.closest('[data-portal-scope]') as HTMLElement | null) ?? null)
  }, [])

  return (
    <>
      <span ref={anchor} hidden />
      <Dialog open={container !== undefined} onOpenChange={(open) => !open && onClose()}>
        <DialogContent size={size ?? (wide ? 'lg' : 'default')} dirty={dirty} container={container ?? null} className="overflow-hidden">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {sub ? <DialogDescription>{sub}</DialogDescription> : null}
          </DialogHeader>
          {/* Testata e piede restano fermi, scorre solo il corpo. */}
          <div className="-mx-1 min-h-0 min-w-0 flex-1 overflow-y-auto px-1">{children}</div>
          {footer ? <DialogFooter>{footer}</DialogFooter> : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
