import { Megaphone } from 'lucide-react'
import { useState } from 'react'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { DEFAULT_ROLE } from '@/modules/recruiting/lib/constants'
import { generateJobPostingPreview, isValidUrl, loadJobPostingSummary, saveJobPostingSummary } from '@/modules/recruiting/lib/profile-hub'

const inputClass =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
const textareaClass = cn(inputClass, 'min-h-[120px] resize-y')
const ghostBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3.5 py-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
const dangerBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3.5 py-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
const primaryBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

// Ported verbatim from the "Annuncio di lavoro" master card (modules/
// recruiting.html ~286-299) + its modal (jpModalOv ~664-678,
// openJobPosting()/saveJpUrl()/clearJpUrl()/publishJpSummary()
// ~4304-4354) + its teaser logic (updateProfileCardsJP() ~5582-5594).
//
// TWO independent fields, TWO independent persistence stories — reproduced
// exactly, not unified:
//  - URL (CONFIG.jobPostings[currentRole]): re-verified fresh at the start
//    of Phase 20 — legacy NEVER persists this to any storage key anywhere.
//    Kept here as plain in-memory React state, reset to '' on every mount,
//    exactly matching legacy's own un-persisted CONFIG.jobPostings object.
//  - Summary (apex5d_job_postings_summaries): persisted, and the SAME key
//    JD's "Salva JD" action writes (lib/jd.ts saveJdTemplate) — reused via
//    lib/profile-hub.ts's saveJobPostingSummary()/loadJobPostingSummary(),
//    never a second key.
//
// ADVISOR SCOPE — same isAdmin reasoning as SurveyLinkSection.tsx: legacy
// gates this modal on isAdmin; this migration has no login system, so the
// edit dialog is always available (matching legacy's isAdmin=true branch,
// same as every other editable feature already migrated).
export function JobPostingSection() {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [summary, setSummary] = useState(() => loadJobPostingSummary(DEFAULT_ROLE) || generateJobPostingPreview(DEFAULT_ROLE))
  const [urlDraft, setUrlDraft] = useState('')
  const [summaryDraft, setSummaryDraft] = useState(summary)
  const [urlError, setUrlError] = useState('')
  const [publishError, setPublishError] = useState('')
  const [message, setMessage] = useState('')

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      const freshSummary = loadJobPostingSummary(DEFAULT_ROLE) || generateJobPostingPreview(DEFAULT_ROLE)
      setSummary(freshSummary)
      setUrlDraft(url)
      setSummaryDraft(freshSummary)
      setUrlError('')
      setPublishError('')
    }
  }

  function handleClearUrl() {
    setUrl('')
    setOpen(false)
    setMessage(`Job Posting rimosso per "${DEFAULT_ROLE}"`)
  }

  function handleSaveUrl() {
    const v = urlDraft.trim()
    if (!v) {
      handleClearUrl()
      return
    }
    if (!isValidUrl(v)) {
      setUrlError('⚠ URL non valido — deve iniziare con http:// o https://')
      return
    }
    setUrl(v)
    setOpen(false)
    setMessage('Job Posting salvato ✓')
    window.open(v, '_blank', 'noopener')
  }

  function handlePublishSummary() {
    const result = saveJobPostingSummary(DEFAULT_ROLE, summaryDraft)
    if (!result.ok) {
      setPublishError('Nessun riepilogo da pubblicare')
      return
    }
    setSummary(summaryDraft.trim())
    setOpen(false)
    setMessage('Riepilogo pubblicato ✓')
  }

  const hasUrl = !!url && isValidUrl(url)
  const teaserValue = hasUrl ? url.replace(/^https?:\/\//, '').slice(0, 32) + '…' : summary ? summary.trim().slice(0, 48) + '…' : 'Non configurato'

  return (
    <div className="flex flex-col gap-1.5">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full items-center gap-2.5 rounded-md border border-border p-3 text-left transition-colors hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className={cn('flex-1 truncate text-[13px]', hasUrl || summary ? 'font-medium text-foreground' : 'text-muted-foreground')}>{teaserValue}</span>
            <span className="shrink-0 text-[12px] font-medium text-primary">Configura link →</span>
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="size-4 shrink-0" aria-hidden="true" />
              Job Posting
            </DialogTitle>
            <DialogDescription>
              Ruolo: <b className="font-semibold text-foreground">&quot;{DEFAULT_ROLE}&quot;</b> — incolla il link dell&apos;annuncio (LinkedIn, Indeed, sito aziendale)
            </DialogDescription>
          </DialogHeader>

          <input
            type="url"
            value={urlDraft}
            onChange={(e) => {
              setUrlDraft(e.target.value)
              setUrlError('')
            }}
            placeholder="https://www.linkedin.com/jobs/view/..."
            className={inputClass}
          />
          <p className="min-h-[18px] text-[11.5px] font-medium text-destructive">{urlError}</p>

          <textarea
            value={summaryDraft}
            onChange={(e) => {
              setSummaryDraft(e.target.value)
              setPublishError('')
            }}
            placeholder="Riepilogo automatico generato dal JD (modifica se necessario)"
            className={textareaClass}
          />
          {publishError && <p className="text-[11.5px] font-medium text-destructive">{publishError}</p>}

          <DialogFooter className="flex-wrap">
            <button type="button" onClick={() => setOpen(false)} className={ghostBtnClass}>
              Annulla
            </button>
            <button type="button" onClick={handleClearUrl} className={dangerBtnClass}>
              Rimuovi link
            </button>
            <button type="button" onClick={handlePublishSummary} className={primaryBtnClass}>
              Pubblica riepilogo
            </button>
            <button type="button" onClick={handleSaveUrl} className={primaryBtnClass}>
              Salva &amp; apri
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {message && <span className="pl-1 text-[11.5px] font-medium text-success">{message}</span>}
    </div>
  )
}
