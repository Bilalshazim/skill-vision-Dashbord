import { CheckCircle2, Copy, Mail } from 'lucide-react'
import { useState } from 'react'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { setPrescreenStatus } from '@/modules/recruiting/lib/pipeline'
import type { Candidate, PrescreenedEntry } from '@/modules/recruiting/lib/types'

// Fallback path for "Invia Lettera e Link Test" (Migliori Candidati) when
// the real backend dispatch can't complete — the active opening's company
// has no backend counterpart yet, or the backend/mail provider is
// genuinely unreachable (see PaginaACandidateRow's error handling for
// which sendTestLinkForCandidate() failures route here). Mirrors the
// Assessment module's own SurveyLinkModal mailto fallback (same idea:
// never block the recruiter on infrastructure, but never claim a real
// send happened either) — rebuilt against Recruiting's own Dialog/Tailwind
// components rather than reused directly, since Assessment's Modal is a
// different, legacy-CSS-based design system.
//
// The candidate already has a local PrescreenedEntry by the time this
// opens (PaginaACandidateRow creates one via addPrescreenedEntry(auto:
// false) before showing this dialog) — its testLink is the same locally
// generated URL every other local-only flow in this module already uses.
// "Segna come inviato" only flips that entry's status to 'inviato' (the
// same setPrescreenStatus() the pre-existing "Segna inviato" action uses
// elsewhere) — it records that the RECRUITER dispatched it themselves, not
// that a real email went out through the server.
export function SendTestLinkFallbackModal({
  candidate,
  entry,
  reasonMessage,
  open,
  onOpenChange,
  onSent,
}: {
  candidate: Candidate
  entry: PrescreenedEntry
  reasonMessage: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSent: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const email = candidate.email?.trim()
  const subject = `Link al test — ${candidate.name}`
  const body = `Gentile ${candidate.name},\n\nla ringraziamo per l'interesse. Può completare il test soft skill al link seguente:\n${entry.testLink}\n\nCordiali saluti`
  const mailto = email ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : undefined

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(entry.testLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Impossibile copiare automaticamente — seleziona e copia il link manualmente.')
    }
  }

  function handleMarkSent() {
    const result = setPrescreenStatus(entry.id, 'inviato')
    if (!result.ok) {
      const message =
        result.reason === 'no-active-opening'
          ? 'Seleziona prima una company/opening nella pagina CV & Esportazione'
          : result.reason === 'entry-not-found'
            ? 'Voce di pre-screening non trovata — potrebbe essere stata rimossa altrove.'
            : `Impossibile salvare: ${result.message}`
      setError(message)
      return
    }
    onSent()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="min-w-0">
          <DialogTitle>Invio manuale — {candidate.name}</DialogTitle>
          <DialogDescription className="mt-2 min-w-0 max-h-32 overflow-y-auto break-words pt-1 leading-relaxed">
            Il server non può completare l&apos;invio automatico in questo momento ({reasonMessage}). Puoi comunque contattare il candidato
            manualmente e segnare l&apos;invio come effettuato.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Link test</div>
          <div className="min-w-0 rounded-md border border-border bg-secondary px-3 py-2">
            <code className="block min-w-0 truncate text-[12px]">{entry.testLink}</code>
          </div>
          {copied && <p className="text-[11px] font-medium text-success">Link copiato negli appunti.</p>}
        </div>

        {error && (
          <p role="alert" className="text-[12px] font-medium text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="min-w-0 flex-col items-stretch gap-2 border-t border-border pt-4 sm:flex-col sm:items-stretch sm:justify-start">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3.5 py-1.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Copy className="size-3.5 shrink-0" aria-hidden="true" />
            Copia link test
          </button>
          {mailto ? (
            <a
              href={mailto}
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3.5 py-1.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Mail className="size-3.5 shrink-0" aria-hidden="true" />
              Apri client email (mailto)
            </a>
          ) : (
            <p className="text-[11px] text-muted-foreground">Nessuna email per questo candidato — copia il link e invialo tramite un altro canale.</p>
          )}
          <button
            type="button"
            onClick={handleMarkSent}
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
            Segna come inviato
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
