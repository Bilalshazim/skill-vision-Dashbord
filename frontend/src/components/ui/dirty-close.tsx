import { XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Il ✕ e la conferma "Chiudere senza salvare?" condivisi da Dialog e Sheet.
// L'intercettazione di Esc e del clic fuori sta in hooks/use-dirty-close.

const closeClass =
  'absolute top-4 right-4 rounded-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

// Il ✕ in alto a destra e, sotto, la conferma. Va dentro il Content.
export function DirtyCloseControls({
  dirty,
  confirming,
  setConfirming,
  closeLabel = 'Chiudi',
  dirtyTitle = 'Chiudere senza salvare?',
  dirtyDescription = 'Le modifiche fatte in questa finestra andranno perse.',
}: {
  dirty: boolean
  confirming: boolean
  setConfirming: (v: boolean) => void
  closeLabel?: string
  dirtyTitle?: string
  dirtyDescription?: string
}) {
  return (
    <>
      {dirty ? (
        <button type="button" onClick={() => setConfirming(true)} className={closeClass}>
          <XIcon className="size-4" />
          <span className="sr-only">{closeLabel}</span>
        </button>
      ) : (
        <DialogPrimitive.Close className={closeClass}>
          <XIcon className="size-4" />
          <span className="sr-only">{closeLabel}</span>
        </DialogPrimitive.Close>
      )}
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dirtyTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dirtyDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continua a modificare</AlertDialogCancel>
            {/* Close dentro l'albero del Dialog: chiude anche il livello sotto. */}
            <DialogPrimitive.Close asChild>
              <AlertDialogAction destructive>Chiudi senza salvare</AlertDialogAction>
            </DialogPrimitive.Close>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
