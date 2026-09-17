import { Eye, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { resolveCandidateCvUrl } from '@/modules/recruiting/lib/backend-sync'

type ViewState = { kind: 'idle' } | { kind: 'pending' } | { kind: 'ready'; url: string } | { kind: 'error'; message: string }

// Client §4 — "inline view/modal to inspect each candidate's uploaded CV
// document", distinct from CvOpenButton.tsx (which deliberately opens the
// file in a new tab — see that file's own comment on why: a synchronous
// user-gesture window.open()). This reuses the SAME signed-URL resolution
// (resolveCandidateCvUrl -> cv/routes.ts's real backend file), just renders
// it inside an <iframe> in a dialog instead of a new tab — no new backend
// endpoint, no duplicate CV-resolution logic.
export function CvInlineViewerButton({ backendCvId, candidateName, className }: { backendCvId?: string; candidateName: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ViewState>({ kind: 'idle' })

  async function handleOpen() {
    setOpen(true)
    if (state.kind === 'ready') return
    setState({ kind: 'pending' })
    const result = await resolveCandidateCvUrl(backendCvId)
    if (!result.ok) {
      const message = result.reason === 'no-cv' ? 'Nessun CV caricato per questo candidato.' : `Impossibile aprire il CV: ${result.message}`
      setState({ kind: 'error', message })
      return
    }
    setState({ kind: 'ready', url: result.url })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setState({ kind: 'idle' })
      }}
    >
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          className,
        )}
      >
        <Eye className="size-3.5 shrink-0" aria-hidden="true" />
        Visualizza CV
      </button>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>CV — {candidateName}</DialogTitle>
        </DialogHeader>
        <div className="h-[70vh] w-full overflow-hidden rounded-md border border-border bg-secondary">
          {state.kind === 'pending' && (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
            </div>
          )}
          {state.kind === 'error' && <p className="flex h-full items-center justify-center px-6 text-center text-[13px] font-medium text-destructive">{state.message}</p>}
          {state.kind === 'ready' && <iframe src={state.url} title={`CV di ${candidateName}`} className="size-full border-0" />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
