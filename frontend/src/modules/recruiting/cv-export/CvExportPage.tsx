import { CheckCircle2, FileCheck2, FileSpreadsheet, FileText, Loader2, Percent, Upload } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { KpiCard } from '@/modules/recruiting/components/KpiCard'
import { CvArchiveList } from '@/modules/recruiting/cv-export/CvArchiveList'
import { downloadRankingCsv, downloadRankingJson } from '@/modules/recruiting/lib/candidateExport'
import { setActiveContext } from '@/modules/recruiting/lib/pipeline'
import { ranking } from '@/modules/recruiting/lib/scoring'
import { uploadCvToActiveOpening } from '@/modules/recruiting/lib/cv-upload'
import { setCvRetentionChoice, syncRankingFromBackend, uploadCvViaBackend } from '@/modules/recruiting/lib/backend-sync'
import { useCvExportData } from '@/modules/recruiting/lib/use-cv-export-data'

const selectClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
const primaryBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[12px] font-bold text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
const goldBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-warning/40 bg-warning/15 px-3.5 py-1.5 text-[12px] font-bold text-foreground transition-colors hover:bg-warning/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
const ghostBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3.5 py-1.5 text-[12px] font-bold text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

const STEP_LABELS = [
  'Lettura del documento (OCR / estrazione testo)',
  'Estrazione entità: esperienze, ruoli, formazione',
  'Mappatura sulle 35 skill APEX (modello ML)',
  'Calcolo Match CV/Profilo e inserimento in Pagina A',
]
type StepState = 'pending' | 'run' | 'done'

type UploadFeedback = { kind: 'idle' } | { kind: 'error'; message: string } | { kind: 'success'; message: string }
const IDLE_FEEDBACK: UploadFeedback = { kind: 'idle' }

// Migrated from modules/recruiting.html #scr-cv ("Carica CV, esporta dati",
// ~397-460) — renderCvContextSelectors()/handleCvContextChange()/
// runPipeline()/renderUploadedCVs()/exportCSV()/exportJSON() (see
// lib/cv-upload.ts, lib/pipeline.ts, lib/candidateExport.ts for the
// individual write/pure-logic contracts this orchestrates).
//
// ACTIVE CONTEXT — this screen is the real owner: every activeContext
// change goes through setActiveContext() (lib/pipeline.ts), the same
// apex5d_cv_matching_state key and shape every other screen already reads
// via getActiveOpening(). No second context store is introduced.
//
// NOT MIGRATED / REMOVED (per the Phase 15 audit, re-confirmed this phase):
//  - Bulk Import — real backend dependency (POST /api/ingest/bulk), and no
//    such backend route exists (verified against backend/src), so there is
//    nothing honest to call; the control renders disabled rather than
//    navigating to the retired /modules/recruiting.html bridge page.
//  - "Parse CV & Match" — REMOVED outright: a second, redundant
//    upload-adjacent action whose only candidate-naming signal
//    (window.UPLOADED_CVS[0]) is permanently dead code (nothing ever
//    populates that array — verified by searching for every call site of
//    addUploadedCV()), and whose bridge target page no longer exists. The
//    real parse+match+backend-persist flow is the drop zone above
//    (uploadCvViaBackend — see lib/backend-sync.ts).
//  - CV file opening — now REAL for backend-uploaded CVs (CvOpenButton /
//    resolveCandidateCvUrl → the backend's signed download URL); the old
//    session-only object-URL limitation only applies to pre-backend local
//    records that never had a durable file to begin with.
export default function CvExportPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const handleMutated = useCallback(() => setRefreshKey((k) => k + 1), [])
  const { companies, company, opening, candidates } = useCvExportData(refreshKey)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [steps, setSteps] = useState<StepState[]>(['pending', 'pending', 'pending', 'pending'])
  const [uploading, setUploading] = useState(false)
  const [uploadFeedback, setUploadFeedback] = useState<UploadFeedback>(IDLE_FEEDBACK)
  const [transferMessage, setTransferMessage] = useState('')
  // GDPR retention consent (§6) — default 2 years, candidate can ask to
  // shorten to 6 months; captured at upload time, saved against the real
  // backend Candidate record once one exists (setCvRetentionChoice below).
  const [retentionChoice, setRetentionChoice] = useState<'TWO_YEARS' | 'SIX_MONTHS'>('TWO_YEARS')

  // Phase 32 §3/§8 — same backend-primary reconciliation Ranking runs, so
  // the "CV caricati" archive list (CvArchiveList below) shows a
  // backend-verified match % too, not just whatever was computed once at
  // upload time.
  useEffect(() => {
    let cancelled = false
    void syncRankingFromBackend().then((result) => {
      if (!cancelled && result.ok && result.updated > 0) handleMutated()
    })
    return () => {
      cancelled = true
    }
  }, [handleMutated])

  function handleCompanyChange(companyId: string) {
    setActiveContext(companyId, opening?.id || '')
    handleMutated()
  }
  function handleOpeningChange(openingId: string) {
    setActiveContext(company?.id || '', openingId)
    handleMutated()
  }

  // Reproduces runPipeline()'s exact 4-step, 850ms-per-step sequential
  // animation (modules/recruiting.html ~3165-3234) before the real logic
  // runs — same total ~3.4s timing, not shortened or skipped, since the
  // step labels above are legacy's own existing UI copy (see this file's
  // disclaimer paragraph below for the same "simulated" caveat legacy
  // itself already shows).
  //
  // Phase 31 §6/§15: once the animation completes, this now tries the REAL
  // backend upload first (uploadCvViaBackend() — candidate + CV file +
  // AHI/match all persisted server-side, see lib/backend-sync.ts). Only if
  // that's genuinely unavailable (backend unreachable, or this local
  // company/opening has no backend counterpart yet — see
  // lib/backend-link.ts) does it fall back to the pre-existing local-only
  // uploadCvToActiveOpening(), with an honest note added to the success
  // message so "saved locally, not yet on the server" is never presented
  // as "saved" without qualification (§16 — never a false success).
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return

    setShowProgress(true)
    setUploading(true)
    setUploadFeedback(IDLE_FEEDBACK)
    setSteps(['run', 'pending', 'pending', 'pending'])

    let i = 1
    const timer = window.setInterval(() => {
      if (i < STEP_LABELS.length) {
        const stepIndex = i
        setSteps((prev) => {
          const next = [...prev]
          next[stepIndex - 1] = 'done'
          next[stepIndex] = 'run'
          return next
        })
        i++
        return
      }
      setSteps((prev) => {
        const next = [...prev]
        next[STEP_LABELS.length - 1] = 'done'
        return next
      })
      window.clearInterval(timer)
      void finishUpload(file)
    }, 850)
  }

  async function finishUpload(file: File) {
    const backendResult = await uploadCvViaBackend(file)
    if (backendResult.ok) {
      setUploading(false)
      // cvSyncFailed: the candidate + campaign enrollment were created and
      // linked on the backend, but the CV upload/match itself failed
      // afterward (see backend-sync.ts's uploadCvViaBackend — auto-send
      // failures are NOT reported here anymore; they keep the candidate in
      // Pagina A as "Da inviare" instead). The candidate is real and
      // backend-linked (a later "INVIA LINK TEST" will work), just missing
      // its match score for now, so this is shown as a warning, never as a
      // silent full success.
      setUploadFeedback(
        backendResult.cvSyncFailed
          ? {
              kind: 'error',
              message: `${backendResult.candidateName} salvato e collegato al server, ma la sincronizzazione del CV non è riuscita — riprova più tardi.`,
            }
          : {
              kind: 'success',
              message: backendResult.autoSent
                ? `${backendResult.candidateName} salvato sul server e link test inviato automaticamente (match ${backendResult.icv}%) ✓`
                : `${backendResult.candidateName} salvato sul server · match CV/Profilo: ${backendResult.icv}% · in Pagina A ✓`,
            },
      )
      void setCvRetentionChoice(backendResult.backendCandidateId, retentionChoice)
      handleMutated()
      return
    }

    // Fallback: local-only, exactly the pre-Phase-31 behavior — only for
    // the cases where this genuinely isn't a backend candidate-creation
    // failure the recruiter needs to see (link/connectivity issues).
    if (backendResult.reason === 'no-active-opening') {
      setUploading(false)
      setUploadFeedback({ kind: 'error', message: 'Seleziona un apertura di job per il routing del CV.' })
      return
    }

    const result = uploadCvToActiveOpening(file)
    setUploading(false)
    if (!result.ok) {
      const message = result.reason === 'no-active-opening' ? 'Seleziona un apertura di job per il routing del CV.' : `Impossibile salvare: ${result.message}`
      setUploadFeedback({ kind: 'error', message })
      return
    }
    const localNote = ` (salvato solo localmente — ${backendResult.message})`
    setUploadFeedback({
      kind: 'success',
      message: (result.autoSent
        ? `${result.candidateName} aggiunto e link test inviato automaticamente (match ${result.icv}%) ✓`
        : `Profilo creato · match CV/Profilo: ${result.icv}% · in Pagina A ✓`) + localNote,
    })
    handleMutated()
  }

  const rk = ranking(candidates)
  const avgIcv = candidates.length ? Math.round(candidates.reduce((sum, c) => sum + (c.icv ?? 0), 0) / candidates.length) : 0

  return (
    <div className="flex flex-col gap-4">
      {/* TOP — header & summary: page identity plus at-a-glance counters,
          so the recruiter sees the state of the archive before touching
          any control below. */}
      <div className="flex items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary">
          <FileText className="size-[22px] text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Carica CV, esporta dati</h2>
          <p className="text-[13px] text-muted-foreground">
            Il parsing ML legge il CV e crea il profilo candidato pre-APEX. I dati escono in formati standard per qualsiasi ATS.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard icon={FileText} value={candidates.length} label="CV caricati" />
        <KpiCard icon={Percent} value={avgIcv} label="Match medio (ICV %)" />
        <KpiCard icon={FileCheck2} value={rk.length} label="Pronti per il ranking" />
      </div>

      {/* MIDDLE — action area: upload, GDPR retention consent, routing,
          bulk import and export/transfer controls. */}
      <label
        className={cn(
          'flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary px-6 py-8 text-center transition-colors',
          uploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-ring hover:bg-primary/5',
        )}
      >
        {uploading ? <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" /> : <Upload className="size-8 text-muted-foreground" aria-hidden="true" />}
        <h3 className="text-[17px] font-semibold">{uploading ? 'Analisi in corso…' : 'Tocca per caricare un CV'}</h3>
        <p className="text-[13.5px] font-semibold text-muted-foreground">PDF o Word · il sistema estrae dati anagrafici, esperienza e segnali di competenza</p>
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} disabled={uploading} />
      </label>

      {/* Client §6 — GDPR retention disclosure, shown once per upload session
          (retentionChoice persists across uploads in this same page visit).
          Consent default is 2 years; a candidate can always ask to shorten
          it to 6 months, which is why this stays a live control rather than
          a static notice — see setCvRetentionChoice() (lib/backend-sync.ts),
          which persists it against the real backend Candidate record. */}
      <div className="flex flex-col gap-2 rounded-md border border-border bg-secondary/60 px-4 py-3 text-[12px] text-muted-foreground">
        <p>
          I dati del CV vengono conservati per <b className="font-semibold text-foreground">2 anni</b> dalla candidatura, salvo revoca. Il
          candidato può in qualsiasi momento richiedere di limitare la conservazione a <b className="font-semibold text-foreground">6 mesi</b>.
        </p>
        <label className="flex w-fit items-center gap-2 text-[11.5px] font-semibold text-foreground">
          <span>Conservazione dati:</span>
          <select
            value={retentionChoice}
            onChange={(e) => setRetentionChoice(e.target.value as 'TWO_YEARS' | 'SIX_MONTHS')}
            disabled={uploading}
            className={selectClass}
          >
            <option value="TWO_YEARS">2 anni (default)</option>
            <option value="SIX_MONTHS">6 mesi (su richiesta del candidato)</option>
          </select>
        </label>
      </div>

      {showProgress && (
        <div className="rounded-xl border border-border bg-card shadow-sm p-5">
          <div className="flex flex-col gap-3">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className={cn('flex items-center gap-3 text-[13.5px] font-semibold', steps[i] === 'done' ? 'text-foreground' : 'text-muted-foreground')}>
                <span
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-full border-2 text-[11px]',
                    steps[i] === 'done' && 'border-success bg-success/15 text-success',
                    steps[i] === 'run' && 'border-primary',
                    steps[i] === 'pending' && 'border-border',
                  )}
                >
                  {steps[i] === 'done' ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : steps[i] === 'run' ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : i + 1}
                </span>
                {label}
              </div>
            ))}
          </div>
          {uploadFeedback.kind === 'error' && <p className="mt-3 text-[12.5px] font-medium text-destructive">{uploadFeedback.message}</p>}
          {uploadFeedback.kind === 'success' && <p className="mt-3 text-[12.5px] font-medium text-success">{uploadFeedback.message}</p>}
        </div>
      )}

      <div className="rounded-xl border border-border bg-secondary p-4">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Routing &amp; Isolation</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-muted-foreground">
            Company
            <select value={company?.id || ''} onChange={(e) => handleCompanyChange(e.target.value)} className={selectClass}>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-muted-foreground">
            Job Opening
            <select value={opening?.id || ''} onChange={(e) => handleOpeningChange(e.target.value)} className={selectClass}>
              {(company?.jobOpenings || []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* "Parse CV & Match" removed — its legacy implementation was dead
              code (see this file's header comment) and its bridge target
              (/modules/recruiting.html) no longer exists; the real
              parse+match+backend flow is the drop zone above. */}
          {company && opening && (
            <span className="text-[12px] text-muted-foreground">
              <b className="font-semibold text-foreground">{company.name}</b> · {opening.title}
              <br />
              Profile: <b className="font-semibold text-foreground">{opening.jobProfile?.title || '—'}</b> · Candidate pool:{' '}
              <b className="font-semibold text-foreground">{opening.candidatePool?.length || 0}</b>
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-secondary p-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Import massivo · archivio storico</div>
        <p className="mb-3 text-[12.5px] leading-relaxed text-muted-foreground">
          Carica in un colpo solo l'intero database di CV esistente (più PDF insieme) nell'archivio della company selezionata sopra. Richiede il
          servizio di ingestione backend — non disponibile in questa build, resta nell'app corrente.
        </p>
        {/* No backend ingest route exists (POST /api/ingest/bulk was never
            implemented — verified against backend/src), and the old bridge
            target (/modules/recruiting.html) no longer exists — so this is
            an honest DISABLED control, never a dead link or a fake upload. */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Il servizio di ingestione backend non è disponibile in questa build"
          className="inline-flex cursor-not-allowed items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-[11.5px] font-semibold text-muted-foreground opacity-60"
        >
          <FileSpreadsheet className="size-3.5 shrink-0" aria-hidden="true" />
          Seleziona più CV (PDF)…
        </button>
      </div>

      <div>
        <div className="mb-2 text-[13px] font-semibold">Esporta o trasferisci</div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => downloadRankingCsv(rk)} className={primaryBtnClass}>
            Scarica ranking (CSV)
          </button>
          <button type="button" onClick={() => downloadRankingJson(rk)} className={goldBtnClass}>
            Profili completi (JSON per ATS)
          </button>
          <button type="button" onClick={() => setTransferMessage('In produzione: invio diretto via API al vostro ATS (es. Zucchetti, Factorial)')} className={ghostBtnClass}>
            Trasferisci ad altro sistema
          </button>
        </div>
        {transferMessage && <p className="mt-2 text-[12px] text-muted-foreground">{transferMessage}</p>}
      </div>

      <p className="text-[13px] leading-relaxed text-muted-foreground">
        Nota demo: il parsing è simulato con dati realistici. In produzione il modello ML legge il documento reale; nessun dato lascia l'ambiente del
        cliente senza autorizzazione.
      </p>

      {/* BOTTOM — data table: the full candidate archive, as the page's
          main content view below all controls. */}
      <CvArchiveList candidates={candidates} />
    </div>
  )
}
