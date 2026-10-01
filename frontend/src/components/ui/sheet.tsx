import { Dialog as SheetPrimitive } from 'radix-ui'
import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

import { DirtyCloseControls } from '@/components/ui/dirty-close'
import { useDirtyClose } from '@/hooks/use-dirty-close'
import { cn } from '@/lib/utils'

// Pannello laterale (shadcn Sheet). Livello flottante come il Dialog: scrim
// neutral-950 al 60%, bordo marcato sul lato che entra, nessuna ombra,
// livello --z-drawer. Esc, clic sullo sfondo e ✕ chiudono; con `dirty` le
// tre vie chiedono prima conferma, come nel Dialog. Taglie: `sm` 288px (la
// navigazione su mobile), `md` fino a 576px (un dettaglio, come la scheda
// del dipendente). `container`: dove montare il portale.

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

const sheetVariants = cva(
  'fixed z-(--z-drawer) flex flex-col bg-popover text-popover-foreground outline-none transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:duration-300',
  {
    variants: {
      side: {
        left: 'inset-y-0 left-0 h-full border-r border-border-strong data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        right: 'inset-y-0 right-0 h-full border-l border-border-strong data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
      },
      size: {
        sm: 'w-72',
        md: 'w-[calc(100%-2rem)] sm:max-w-xl',
      },
    },
    defaultVariants: { side: 'left', size: 'sm' },
  },
)

function SheetContent({
  className,
  children,
  side = 'left',
  size,
  dirty = false,
  closeLabel = 'Chiudi',
  onEscapeKeyDown,
  onInteractOutside,
  container,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants> & { dirty?: boolean; closeLabel?: string; container?: HTMLElement | null }) {
  const { confirming, setConfirming, contentProps } = useDirtyClose({ dirty, onEscapeKeyDown, onInteractOutside })
  return (
    <SheetPrimitive.Portal container={container ?? undefined}>
      <SheetPrimitive.Overlay
        data-slot="sheet-overlay"
        className="fixed inset-0 z-(--z-drawer) bg-neutral-950/60 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
      />
      <SheetPrimitive.Content data-slot="sheet-content" className={cn(sheetVariants({ side, size }), className)} {...contentProps} {...props}>
        {children}
        <DirtyCloseControls dirty={dirty} confirming={confirming} setConfirming={setConfirming} closeLabel={closeLabel} />
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

// Testata ferma: titolo, descrizione, eventuale avatar a sinistra.
function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sheet-header" className={cn('flex shrink-0 items-center gap-3 border-b border-border py-4 pr-12 pl-6', className)} {...props} />
}

// Il corpo scorre, testata e piede restano fermi.
function SheetBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sheet-body" className={cn('min-h-0 flex-1 overflow-y-auto p-6', className)} {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sheet-footer" className={cn('flex shrink-0 flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end', className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn('text-app-subtitle text-foreground', className)} {...props} />
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description data-slot="sheet-description" className={cn('text-app-small text-muted-foreground', className)} {...props} />
}

export { Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription }
