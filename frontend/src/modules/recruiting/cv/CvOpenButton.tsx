import { FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { resolveCandidateCvUrl } from '@/modules/recruiting/lib/backend-sync'
import type { Candidate } from '@/modules/recruiting/lib/types'

type OpenState = { kind: 'idle' } | { kind: 'pending' } | { kind: 'error'; message: string }

// Real replacement for the "CV" LegacyBridgeButton next to INVIA LINK TEST
// (PaginaACandidateRow.tsx) — that one opened /modules/recruiting.html (the
// legacy shell landing page), never the candidate's actual file. This opens
// the real backend-stored CV via the SAME signed-download mechanism already
// used everywhere else a CV is read (backend-sync.ts's
// resolveCandidateCvUrl() -> cv/routes.ts's GET /:id for a short-lived
// token + GET /:id/file for the bytes) — no new backend endpoint. A
// candidate whose CV was never uploaded through the backend flow
// (backendCvId unset) gets an honest "no CV" message instead of a dead
// legacy link; a genuine fetch failure is shown the same way, distinct
// wording, both non-blocking (never a false "opened").
export function CvOpenButton({ candidate, className }: { candidate: Candidate; className?: string }) {
  const [state, setState] = useState<OpenState>({ kind: 'idle' })
  const pending = state.kind === 'pending'

  async function handleClick() {
    if (pending) return
    setState({ kind: 'pending' })
    // window.open() must happen SYNCHRONOUSLY inside the click handler to
    // count as user-gesture-triggered — calling it only after the await
    // below (once the signed URL is resolved) loses that gesture and gets
    // silently popup-blocked in Chromium/Firefox alike. Opening a blank tab
    // immediately and pointing it at the real URL once resolved keeps the
    // whole thing inside the original gesture. (No `noopener` here on
    // purpose: it's required to keep a handle to redirect afterward — the
    // new tab only ever shows our own signed CV file, not third-party
    // content, so the usual tabnabbing risk noopener guards against doesn't
    // apply.)
    const tab = window.open('', '_blank')
    const result = await resolveCandidateCvUrl(candidate.backendCvId)
    if (!result.ok) {
      tab?.close()
      const message = result.reason === 'no-cv' ? 'Nessun CV caricato per questo candidato.' : `Impossibile aprire il CV: ${result.message}`
      setState({ kind: 'error', message })
      return
    }
    // A signed, short-lived link to the actual stored file (PDF or Word,
    // per the backend's ALLOWED_MIME) — a PDF renders inline in the new
    // tab (Content-Disposition: inline, see cv/routes.ts), other types
    // download, exactly as any browser handles a direct file link.
    if (tab) tab.location.href = result.url
    else window.open(result.url, '_blank') // the initial open was itself blocked — try once more with the real URL
    setState({ kind: 'idle' })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            disabled={pending}
            className={cn(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60',
              className,
            )}
          >
            {pending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <FileText className="size-3.5 shrink-0" aria-hidden="true" />}
            CV
          </button>
        </TooltipTrigger>
        <TooltipContent>Apre il CV caricato in una nuova scheda</TooltipContent>
      </Tooltip>
      {state.kind === 'error' && <p className="max-w-[160px] text-[10.5px] font-medium text-destructive">{state.message}</p>}
    </div>
  )
}
