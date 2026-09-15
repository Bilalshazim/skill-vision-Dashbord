import { Link2 } from 'lucide-react'
import { useState } from 'react'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { DEFAULT_ROLE } from '@/modules/recruiting/lib/constants'
import { clearSurveyLink, isValidUrl, loadSurveyLink, saveSurveyLink } from '@/modules/recruiting/lib/profile-hub'

const inputClass =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
const ghostBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3.5 py-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
const dangerBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3.5 py-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
const primaryBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

// Ported verbatim from the "Survey Link" teaser row (modules/recruiting.html
// ~278-282) + its modal (svModalOv ~681-693, openSurveyModal()/saveSvUrl()/
// clearSvUrl() ~4358-4390). Nests inside the "Soft skill" master card, same
// as legacy's DOM (mcSoftSkills contains both pc-softskill and pc-survey).
//
// ADVISOR SCOPE — legacy gates this modal on `isAdmin` (openSurveyModal():
// non-admin users only ever get "click to open" or a "not configured"
// toast, never the editor). This migration has no login/isAdmin system at
// all — the same unmigrated-auth category as role-switching — and every
// other editable feature ported so far (JD, Salary/Benefits) is exposed
// unconditionally, matching legacy's isAdmin=true branch. This does the
// same: the edit dialog is always available, never gated behind a client/
// view-only mode this migration doesn't have.
export function SurveyLinkSection() {
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState(() => loadSurveyLink(DEFAULT_ROLE))
  const [draft, setDraft] = useState(link)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      // Fresh read on every open — matches legacy re-reading CONFIG.surveyLink
      // each time openSurveyModal() runs, not just once at page load.
      const fresh = loadSurveyLink(DEFAULT_ROLE)
      setLink(fresh)
      setDraft(fresh)
      setError('')
    }
  }

  function handleClear() {
    clearSurveyLink(DEFAULT_ROLE)
    setLink('')
    setOpen(false)
    setMessage(`Survey link rimosso per "${DEFAULT_ROLE}"`)
  }

  function handleSave() {
    const v = draft.trim()
    if (!v) {
      handleClear()
      return
    }
    if (!isValidUrl(v)) {
      setError('⚠ URL non valido — deve iniziare con http:// o https://')
      return
    }
    saveSurveyLink(DEFAULT_ROLE, v)
    setLink(v)
    setOpen(false)
    setMessage('Survey link salvato ✓')
    window.open(v, '_blank', 'noopener')
  }

  const has = !!link && isValidUrl(link)

  return (
    <div className="flex flex-col gap-1.5">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full items-center gap-2.5 rounded-md border border-border p-3 text-left transition-colors hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Link2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="flex-1 text-[13px] font-medium text-foreground">Survey Link</span>
            <span className={cn('truncate text-[12px]', has ? 'text-foreground' : 'text-muted-foreground')}>{has ? link.replace(/^https?:\/\//, '').slice(0, 32) + '…' : 'Non configurato'}</span>
            <span className="shrink-0 text-[12px] font-medium text-primary">Configura link →</span>
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="size-4 shrink-0" aria-hidden="true" />
              Survey Link
            </DialogTitle>
            <DialogDescription>
              Ruolo: <b className="font-semibold text-foreground">&quot;{DEFAULT_ROLE}&quot;</b> — incolla il link del survey/questionario
            </DialogDescription>
          </DialogHeader>

          <input
            type="url"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setError('')
            }}
            placeholder="https://forms.gle/..."
            className={inputClass}
          />
          <p className="min-h-[18px] text-[11.5px] font-medium text-destructive">{error}</p>

          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)} className={ghostBtnClass}>
              Annulla
            </button>
            <button type="button" onClick={handleClear} className={dangerBtnClass}>
              Rimuovi link
            </button>
            <button type="button" onClick={handleSave} className={primaryBtnClass}>
              Salva &amp; apri
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {message && <span className="pl-1 text-[11.5px] font-medium text-success">{message}</span>}
    </div>
  )
}
