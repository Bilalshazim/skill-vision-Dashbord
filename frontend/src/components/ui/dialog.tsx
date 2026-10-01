import { Dialog as DialogPrimitive } from 'radix-ui'
import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

import { DirtyCloseControls } from '@/components/ui/dirty-close'
import { useDirtyClose } from '@/hooks/use-dirty-close'
import { cn } from '@/lib/utils'

// Il dialog della libreria. Livello flottante: scrim neutral-950 al 60%,
// bordo marcato, nessuna ombra, livello --z-modal. Esc, clic sullo sfondo e
// ✕ chiudono. Con `dirty` (il contenuto è stato modificato) le tre vie
// chiedono prima conferma: la regola è qui, le pagine passano solo il
// booleano. "Annulla" e "Salva" nel piede restano azioni esplicite.
// `container`: dove montare il portale (di norma <body>). Serve a chi apre
// un dialog dentro uno scope con variabili proprie, come Assessment.

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

const contentVariants = cva(
  'fixed top-1/2 left-1/2 z-(--z-modal) flex max-h-[85vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-lg border border-border-strong bg-popover p-6 text-popover-foreground outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
  {
    variants: {
      size: {
        sm: 'max-w-md',
        default: 'max-w-lg',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl',
        full: 'max-w-7xl',
      },
    },
    defaultVariants: { size: 'default' },
  },
)

function DialogContent({
  className,
  children,
  size,
  dirty = false,
  dirtyTitle = 'Chiudere senza salvare?',
  dirtyDescription = 'Le modifiche fatte in questa finestra andranno perse.',
  onEscapeKeyDown,
  onInteractOutside,
  container,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof contentVariants> & { dirty?: boolean; dirtyTitle?: string; dirtyDescription?: string; container?: HTMLElement | null }) {
  const { confirming, setConfirming, contentProps } = useDirtyClose({ dirty, onEscapeKeyDown, onInteractOutside })

  return (
    <DialogPrimitive.Portal container={container ?? undefined}>
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        className="fixed inset-0 z-(--z-modal) bg-neutral-950/60 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
      />
      <DialogPrimitive.Content data-slot="dialog-content" className={cn(contentVariants({ size }), className)} {...contentProps} {...props}>
        {children}
        <DirtyCloseControls dirty={dirty} confirming={confirming} setConfirming={setConfirming} dirtyTitle={dirtyTitle} dirtyDescription={dirtyDescription} />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="dialog-header" className={cn('flex flex-col gap-2 pr-8', className)} {...props} />
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn('text-app-section', className)} {...props} />
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn('text-app-small text-muted-foreground', className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="dialog-footer" className={cn('flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end', className)} {...props} />
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger }
