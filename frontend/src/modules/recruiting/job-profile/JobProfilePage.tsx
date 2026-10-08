import { PageHeader } from '@/components/patterns/PageHeader'
import { AlertTriangle, CheckCircle2, Copy, FileText, Pencil, Save } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { useConfirm } from '@/hooks/use-confirm'
import { Checkbox } from '@/components/ui/checkbox'
import { jobProfilesApi } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'
import { DEFAULT_ROLE } from '@/modules/recruiting/lib/constants'
import { buildJdStateFromPreset, buildSoftSkillItems, loadJdTemplate, publicJobPostingUrl, saveJdTemplate } from '@/modules/recruiting/lib/jd'
import { loadJobProfileFromBackend, saveJobProfileToBackend } from '@/modules/recruiting/lib/backend-sync'
import { getActiveOpening } from '@/modules/recruiting/lib/pipeline'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'
import type { JdPresetId } from '@/modules/recruiting/lib/jd-presets'
import type { JdExtraRow, JdHardSkillGroup, JdSectionKey, JdState } from '@/modules/recruiting/lib/jd-types'
import { JdExtraRequirements } from '@/modules/recruiting/job-profile/JdExtraRequirements'
import { JdHardSkills } from '@/modules/recruiting/job-profile/JdHardSkills'
import { JdHeaderFields } from '@/modules/recruiting/job-profile/JdHeaderFields'
import { JdPreview } from '@/modules/recruiting/job-profile/JdPreview'
import { JdSalaryBenefits } from '@/modules/recruiting/job-profile/JdSalaryBenefits'
import { JdSection } from '@/modules/recruiting/job-profile/JdSection'
import { Hint } from '@/components/patterns/Hint'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const SECTION_TITLES: Record<JdSectionKey, string> = {
  responsabilita: 'Responsabilità',
  attivita: 'Attività principali',
  softSkills: 'Competenze trasversali',
  competenzeTecniche: 'Competenze tecniche (tool)',
  titoliStudio: 'Titoli di studio',
  certificazioni: 'Certificazioni',
  esperienza: 'Esperienza minima',
  settori: 'Settori di provenienza',
  lingue: 'Lingue',
  disponibilita: 'Disponibilità',
  personalita: 'Personalità ricercata',
  kpi: 'KPI',
  valutazione: 'Cosa valuterà SKILL-VISION',
}
const SECTION_SUB: Partial<Record<JdSectionKey, string>> = {
  softSkills: 'Le 35 competenze trasversali APEX 5D. Le voci con peso sono derivate dalle competenze selezionate per la posizione — imposta per ciascuna il valore atteso (scala APEX /31, decimali ammessi, es. 6.3).',
}

// Ported literal groups order from jd_buildEditor() (modules/recruiting.html
// ~4058-4080) — Intestazione + Compensation e Benefit first, then the 13
// section keys in this exact sequence, hard skills right after Attività,
// extra requirements last.
const SECTION_ORDER: JdSectionKey[] = ['responsabilita', 'attivita']
const SECTION_ORDER_REST: JdSectionKey[] = ['competenzeTecniche', 'titoliStudio', 'certificazioni', 'esperienza', 'settori', 'lingue', 'disponibilita', 'personalita', 'kpi', 'valutazione']
// Tutte le sezioni aperte all'inizio, come prima.
const ALL_SECTIONS = ['header', 'salary', ...SECTION_ORDER, 'hard', 'softSkills', ...SECTION_ORDER_REST, 'extra']

// Una sezione della scheda: voce di un Accordion a scelta multipla, dentro
// una card. Solo l'intestazione apre e chiude; le frecce passano da una
// intestazione all'altra.
function AccordionSection({ value, index, title, sub, children }: { value: string; index: number; title: string; sub?: string; children: ReactNode }) {
  return (
    <AccordionItem value={value} asChild>
      <Card padding="none">
        <AccordionTrigger className="gap-3 bg-muted px-4 py-3 hover:no-underline data-[state=open]:border-b data-[state=open]:border-border">
          <span className="flex flex-1 items-center gap-3">
            <span className="rounded-xs border border-border bg-card px-2 py-0.5 font-mono text-app-caption text-muted-foreground tabular-nums">{String(index).padStart(2, '0')}</span>
            <span className="text-app-section">{title}</span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="p-4">
          {sub && <p className="mb-3 text-app-small text-muted-foreground">{sub}</p>}
          {children}
        </AccordionContent>
      </Card>
    </AccordionItem>
  )
}

// Le competenze trasversali seguono i pesi scelti nel selettore delle 35
// (lib/skill-flags.ts): una scheda salvata prima di cambiarli li aggiorna qui,
// tenendo i valori attesi già scritti.
function buildInitialState(): JdState {
  const state = loadJdTemplate(DEFAULT_ROLE) || buildJdStateFromPreset('sam')
  state.sections.softSkills.items = buildSoftSkillItems(state.sections.softSkills.items)
  return state
}

// Migrated from modules/recruiting.html #scr-jd ("Configura la Scheda
// Professionale per la ricerca in corso" — nav label "Profilo di Lavoro",
// ~477-525, jd_* functions ~3700-5745). Per the Phase 17 audit and this
// phase's explicit scope: full editor + live preview + Save/Load per role +
// Salary & Benefits are migrated; role search/switching, "Crea scheda
// vuota", and CSV/XLSX import remain deferred (see the notice below) —
// none of their code is ported here.
//
// ROLE SCOPE — React has no role-switcher (a boundary established since
// Phase 4). This screen always operates on DEFAULT_ROLE ('Sales Account
// Manager'), which is exactly JD_PROFILES.sam's title — the same content a
// fresh legacy session with no role ever switched shows.
//
// LOAD-ON-MOUNT — a deliberate, documented adaptation: legacy's own boot
// sequence (`jd_loadProfile('sam')` at script-parse time) always shows the
// raw 'sam' preset on a fresh page load, EVEN IF a JD template was already
// saved for "Sales Account Manager" — only an explicit role-switch (Home's
// role selector) or a title-field keystroke match ever loads a saved
// template (loadJdTemplateForRole(), ~5645-5657). Since role-switching is
// out of scope here, faithfully reproducing "boot always discards your
// saved work" would make the Save button pointless and would fail this
// phase's own Step 13 test ("save -> reload -> same content restored").
// React's page-mount is closer to "the user re-entering the screen" than
// to "the whole browser tab's one-time script boot" anyway, so this page
// runs the SAME already-existing loadJdTemplateForRole() logic legacy uses
// for that "entering the screen" case, just triggered by mount instead of
// by a role-switch event that doesn't exist in this architecture.
export default function JobProfilePage() {
  const [jdState, setJdState] = useState<JdState>(buildInitialState)
  const [confirm, confirmDialog] = useConfirm()
  const [saveMessage, setSaveMessage] = useState('')
  const [backendNote, setBackendNote] = useState('')
  const [invioCvError, setInvioCvError] = useState('')

  // Client §3 — "Compile -> Save -> Display clean finished preview state",
  // an edit toggle, and an "Approvata" flag that generates a publication
  // link. 'preview' mode hides every accordion editor and shows only
  // JdPreview full-width — the existing side-by-side layout (still used in
  // 'edit' mode) already keeps editor/preview in sync by construction (both
  // read the same jdState), so this isn't fixing a data bug, it's adding
  // the distinct "clean finished view" the brief asks for.
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [backendProfileId, setBackendProfileId] = useState<string | null>(null)
  const [approved, setApproved] = useState(false)
  const [publicationLink, setPublicationLink] = useState<string | null>(null)
  const [approvalPending, setApprovalPending] = useState(false)
  const [approvalError, setApprovalError] = useState('')

  // Phase 32 §5 — backend becomes primary for READ too: on mount, if the
  // active opening has a linked backend Campaign AND that campaign already
  // has a saved JobProfile, it REPLACES whatever buildInitialState() showed
  // (local template or preset) — same "backend wins when it has data"
  // pattern as Ranking/Pagina A's reconciliation. No link, or a link with
  // nothing saved yet, leaves the existing local-first behavior completely
  // untouched (this is the honest, expected common case today — see final
  // report).
  useEffect(() => {
    const { opening } = getActiveOpening(readCvMatchingState())
    if (!opening) return
    let cancelled = false
    void loadJobProfileFromBackend(opening.id).then((result) => {
      if (cancelled) return
      if (result.ok) {
        setJdState(result.jdState)
        setBackendNote('Scheda caricata dal server')
        setBackendProfileId(result.profileId)
        setApproved(result.approved)
        setPublicationLink(result.publicationLink)
        if (result.approved) setMode('preview')
      } else if (result.reason === 'error') {
        setBackendNote(`Impossibile leggere la scheda dal server (${result.message}) — mostrata la versione locale.`)
      } else if (result.reason === 'incompatible-shape') {
        // A JobProfile row exists for this campaign but isn't in this
        // editor's shape (e.g. the seed data's simpler match-criteria
        // form) — never reinterpreted/guessed, shown honestly instead.
        setBackendNote('Sul server esiste un profilo di lavoro in un formato diverso da questo editor — non caricato per evitare di sovrascriverlo con dati incompatibili. Salvando qui verrà creata una nuova versione nel formato di questo editor.')
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Ported from jd_loadProfile()/jd_confirmSwitch() (modules/recruiting.html
  // ~3843-3856) — switching a preset never touches global role/scoring
  // state (only "Crea scheda vuota" does that, and it stays deferred), so
  // it's safe to reproduce directly. Does NOT auto-persist — matches
  // legacy exactly; only the explicit "Salva JD" button writes storage.
  async function handleSelectPreset(pid: JdPresetId) {
    if (!(await confirm({ title: 'Cambiare profilo di partenza?', description: 'Le selezioni correnti della scheda verranno sovrascritte.', confirmLabel: 'Cambia profilo', destructive: true }))) return
    setJdState(buildJdStateFromPreset(pid))
    setSaveMessage('')
    setBackendNote('')
  }

  // Phase 32 §5 — backend first, then the unchanged local mirror (§8
  // write-through): saveJdTemplate() still runs every time so every
  // existing local-only reader of apex5d_jd_templates (the preview, Job
  // Posting summary cross-write) keeps working exactly as before.
  async function handleSave() {
    // Fase 5: come inviare il CV è obbligatorio — senza, l'annuncio non dice
    // ai candidati dove candidarsi.
    if (!jdState.header.invioCv?.trim()) {
      setInvioCvError('Indica come e dove i candidati inviano il CV (email di destinazione o modulo di caricamento).')
      setSaveMessage('')
      return
    }
    setInvioCvError('')
    const { opening } = getActiveOpening(readCvMatchingState())
    if (opening) {
      const backendResult = await saveJobProfileToBackend(opening.id, jdState)
      if (backendResult.ok) {
        setBackendNote('')
        // A fresh save always creates a NEW JobProfile row (see
        // jobProfiles/routes.ts — no upsert, versioned by design), so it
        // is never the previously-approved one: reset approval state
        // rather than carrying a stale "Approvata" flag over to content
        // that hasn't itself been approved yet.
        setBackendProfileId(backendResult.profileId)
        setApproved(false)
        setPublicationLink(null)
      } else if (backendResult.reason === 'error') {
        setBackendNote(`Salvato solo localmente — impossibile salvare sul server (${backendResult.message}).`)
      }
      // 'no-link' — this opening has no backend Campaign yet (no CV
      // uploaded through the backend flow for it) — silently local-only,
      // exactly like every other feature gated on a backend link.
    }
    saveJdTemplate(DEFAULT_ROLE, jdState)
    setSaveMessage(`JD salvata per la posizione "${DEFAULT_ROLE}"`)
    setMode('preview')
  }

  async function handleToggleApproval() {
    if (!backendProfileId || approvalPending) return
    setApprovalPending(true)
    setApprovalError('')
    try {
      const updated = approved ? await jobProfilesApi.unapprove(backendProfileId) : await jobProfilesApi.approve(backendProfileId)
      setApproved(updated.approved)
      setPublicationLink(updated.publicationLink)
    } catch (err) {
      setApprovalError(err instanceof ApiError ? err.message : 'Errore sconosciuto')
    } finally {
      setApprovalPending(false)
    }
  }

  function updateSection(key: JdSectionKey, next: JdState['sections'][JdSectionKey]) {
    setJdState((prev) => ({ ...prev, sections: { ...prev.sections, [key]: next } }))
  }
  function updateHardSkillGroups(next: JdHardSkillGroup[]) {
    setJdState((prev) => ({ ...prev, hardSkillGroups: next }))
  }
  function updateExtra(next: JdExtraRow[]) {
    setJdState((prev) => ({ ...prev, extra: next }))
  }

  let idx = 0
  const nextIdx = () => ++idx

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        level="page"
        className="mb-0"
        title="Configura la Scheda Professionale per la ricerca in corso"
        description={mode === 'preview' ? 'Anteprima pulita della scheda salvata — pronta per essere approvata e condivisa. Usa "Modifica" per tornare all\'editor.' : undefined}
        actions={
          <Button
            type="button"
            onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
            variant="outline"
            size="sm"
          >
            {mode === 'edit' ? (
              <>
                <FileText className="size-4 shrink-0" aria-hidden="true" />
                Vedi anteprima
              </>
            ) : (
              <>
                <Pencil className="size-4 shrink-0" aria-hidden="true" />
                Modifica
              </>
            )}
          </Button>
        }
      />

      {mode === 'edit' ? (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
            <Accordion type="multiple" defaultValue={ALL_SECTIONS} className="flex flex-col gap-4">
              <AccordionSection index={nextIdx()} title="Intestazione posizione" value="header">
                <JdHeaderFields header={jdState.header} scopo={jdState.scopo} onSelectPreset={handleSelectPreset} invioCvError={invioCvError} onHeaderChange={(patch) => {
                  if (patch.invioCv !== undefined) setInvioCvError('')
                  setJdState((prev) => ({ ...prev, header: { ...prev.header, ...patch } }))
                }} onScopoChange={(scopo) => setJdState((prev) => ({ ...prev, scopo }))} />
              </AccordionSection>

              <AccordionSection index={nextIdx()} title="Compensation e Benefit" value="salary">
                <JdSalaryBenefits role={DEFAULT_ROLE} />
              </AccordionSection>

              {SECTION_ORDER.map((key) => (
                <AccordionSection key={key} index={nextIdx()} title={SECTION_TITLES[key]} sub={SECTION_SUB[key]} value={key}>
                  <JdSection section={jdState.sections[key]} onChange={(next) => updateSection(key, next)} />
                </AccordionSection>
              ))}

              <AccordionSection index={nextIdx()} title="Competenze professionali" sub="Livello richiesto: seleziona una voce, poi Base / Intermedio / Avanzato / Esperto." value="hard">
                <JdHardSkills groups={jdState.hardSkillGroups} onChange={updateHardSkillGroups} />
              </AccordionSection>

              <AccordionSection index={nextIdx()} title="Competenze trasversali" sub={SECTION_SUB.softSkills} value="softSkills">
                <JdSection section={jdState.sections.softSkills} onChange={(next) => updateSection('softSkills', next)} />
              </AccordionSection>

              {SECTION_ORDER_REST.map((key) => (
                <AccordionSection key={key} index={nextIdx()} title={SECTION_TITLES[key]} sub={SECTION_SUB[key]} value={key}>
                  <JdSection section={jdState.sections[key]} onChange={(next) => updateSection(key, next)} />
                </AccordionSection>
              ))}

              <AccordionSection index={nextIdx()} title="Richieste specifiche aggiuntive" sub="Spazi liberi per competenze o requisiti non coperti sopra — cambia ad ogni ricerca." value="extra">
                <JdExtraRequirements rows={jdState.extra} onChange={updateExtra} />
              </AccordionSection>
            </Accordion>

            <Card className="self-start">
              <JdPreview jd={jdState} />
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button type="button" onClick={handleSave}>
              <Save className="size-4 shrink-0" aria-hidden="true" />
              Salva JD per &quot;{DEFAULT_ROLE}&quot;
            </Button>
            {saveMessage && <span className="text-app-small font-medium text-success">{saveMessage}</span>}
            {backendNote && (
              <span className="flex items-center gap-1.5 text-app-small font-medium text-muted-foreground">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                {backendNote}
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          <Card padding="lg">
            <JdPreview jd={jdState} />
          </Card>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <label className="flex items-center gap-2 text-app-small font-semibold">
              <Checkbox checked={approved} disabled={!backendProfileId || approvalPending} onCheckedChange={() => handleToggleApproval()} />
              {approved ? (
                <span className="flex items-center gap-1.5 text-success">
                  <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                  Approvata
                </span>
              ) : (
                'Approvata'
              )}
            </label>
            {!backendProfileId && (
              <span className="text-app-caption text-muted-foreground">Salva sul server (carica un CV per collegare la posizione) prima di approvare.</span>
            )}
            {approvalError && <span className="text-app-caption font-medium text-destructive">{approvalError}</span>}
            {approved && publicationLink && (
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-app-caption text-muted-foreground">
                <span>Link di pubblicazione:</span>
                <a
                  href={publicJobPostingUrl(publicationLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground underline-offset-2 hover:underline"
                >
                  {publicJobPostingUrl(publicationLink)}
                </a>
                <Hint label="Copia link">
                  <Button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(publicJobPostingUrl(publicationLink))}
                    aria-label="Copia link"
                    variant="outline"
                    size="icon-sm"
                  >
                    <Copy className="size-3 shrink-0" aria-hidden="true" />
                  </Button>
                </Hint>
              </div>
            )}
          </div>
        </>
      )}
      {confirmDialog}
    </div>
  )
}
