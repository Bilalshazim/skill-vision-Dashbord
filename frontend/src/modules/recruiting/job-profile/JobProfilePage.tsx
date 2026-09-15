import { AlertTriangle, ChevronDown, FileText, Save } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import { DEFAULT_ROLE } from '@/modules/recruiting/lib/constants'
import { buildJdStateFromPreset, loadJdTemplate, saveJdTemplate } from '@/modules/recruiting/lib/jd'
import { loadJobProfileFromBackend, saveJobProfileToBackend } from '@/modules/recruiting/lib/backend-sync'
import { getActiveOpening } from '@/modules/recruiting/lib/pipeline'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'
import type { JdPresetId } from '@/modules/recruiting/lib/jd-presets'
import { JD_PROFILES } from '@/modules/recruiting/lib/jd-presets'
import type { JdExtraRow, JdHardSkillGroup, JdSectionKey, JdState } from '@/modules/recruiting/lib/jd-types'
import { JdExtraRequirements } from '@/modules/recruiting/job-profile/JdExtraRequirements'
import { JdHardSkills } from '@/modules/recruiting/job-profile/JdHardSkills'
import { JdHeaderFields } from '@/modules/recruiting/job-profile/JdHeaderFields'
import { JdPreview } from '@/modules/recruiting/job-profile/JdPreview'
import { JdSalaryBenefits } from '@/modules/recruiting/job-profile/JdSalaryBenefits'
import { JdSection } from '@/modules/recruiting/job-profile/JdSection'

const SECTION_TITLES: Record<JdSectionKey, string> = {
  responsabilita: 'Responsabilità',
  attivita: 'Attività principali',
  softSkills: 'Soft skills',
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
  softSkills: 'Le 35 soft skill APEX 5D. Le voci con peso sono derivate dalle skill flaggate per il ruolo — imposta per ciascuna il VALORE ATTESO (scala APEX /31, decimali ammessi, es. 6.3).',
}

// Ported literal groups order from jd_buildEditor() (modules/recruiting.html
// ~4058-4080) — Intestazione + Fasce Retributive first, then the 13
// section keys in this exact sequence, hard skills right after Attività,
// extra requirements last.
const SECTION_ORDER: JdSectionKey[] = ['responsabilita', 'attivita']
const SECTION_ORDER_REST: JdSectionKey[] = ['competenzeTecniche', 'titoliStudio', 'certificazioni', 'esperienza', 'settori', 'lingue', 'disponibilita', 'personalita', 'kpi', 'valutazione']

function AccordionSection({ index, title, sub, collapsed, onToggle, children }: { index: number; title: string; sub?: string; collapsed: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 border-b border-border bg-secondary px-4 py-3.5 text-left">
        <span className="rounded-sm border border-border bg-card px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">{String(index).padStart(2, '0')}</span>
        <h2 className="flex-1 text-[14px] font-semibold">{title}</h2>
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', collapsed && '-rotate-90')} aria-hidden="true" />
      </button>
      {!collapsed && (
        <div className="p-4">
          {sub && <p className="mb-3 text-[12px] text-muted-foreground">{sub}</p>}
          {children}
        </div>
      )}
    </div>
  )
}

function buildInitialState(): JdState {
  return loadJdTemplate(DEFAULT_ROLE) || buildJdStateFromPreset('sam')
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
  const [currentPreset, setCurrentPreset] = useState<JdPresetId>('sam')
  const [collapsed, setCollapsed] = useState<Partial<Record<string, boolean>>>({})
  const [saveMessage, setSaveMessage] = useState('')
  const [backendNote, setBackendNote] = useState('')

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
        setBackendNote('Scheda caricata dal server ✓')
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

  function toggleSection(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Ported from jd_loadProfile()/jd_confirmSwitch() (modules/recruiting.html
  // ~3843-3856) — switching a preset never touches global role/scoring
  // state (only "Crea scheda vuota" does that, and it stays deferred), so
  // it's safe to reproduce directly. Does NOT auto-persist — matches
  // legacy exactly; only the explicit "Salva JD" button writes storage.
  function handleSelectPreset(pid: JdPresetId) {
    if (!window.confirm('Cambiare profilo di partenza sovrascriverà le selezioni correnti. Continuare?')) return
    setCurrentPreset(pid)
    setJdState(buildJdStateFromPreset(pid))
    setSaveMessage('')
    setBackendNote('')
  }

  // Phase 32 §5 — backend first, then the unchanged local mirror (§8
  // write-through): saveJdTemplate() still runs every time so every
  // existing local-only reader of apex5d_jd_templates (the preview, Job
  // Posting summary cross-write) keeps working exactly as before.
  async function handleSave() {
    const { opening } = getActiveOpening(readCvMatchingState())
    if (opening) {
      const backendResult = await saveJobProfileToBackend(opening.id, jdState)
      if (backendResult.ok) {
        setBackendNote('')
      } else if (backendResult.reason === 'error') {
        setBackendNote(`Salvato solo localmente — impossibile salvare sul server (${backendResult.message}).`)
      }
      // 'no-link' — this opening has no backend Campaign yet (no CV
      // uploaded through the backend flow for it) — silently local-only,
      // exactly like every other feature gated on a backend link.
    }
    saveJdTemplate(DEFAULT_ROLE, jdState)
    setSaveMessage(`JD salvata per il ruolo "${DEFAULT_ROLE}" ✓`)
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
      <div className="flex items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary">
          <FileText className="size-[22px] text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Configura la Scheda Professionale per la ricerca in corso</h2>
          <p className="max-w-[70ch] text-[13px] text-muted-foreground">
            Parti da un profilo precompilato, poi seleziona, deseleziona, cambia livelli e aggiungi righe libere per adattarlo alla ricerca specifica.
            L'anteprima a destra si aggiorna in tempo reale ed è pronta per essere stampata o condivisa.
          </p>
        </div>
      </div>

      <p className="rounded-md border border-border bg-secondary px-3 py-2 text-[12px] text-muted-foreground">
        Ricerca/cambio ruolo, "Crea scheda vuota" e l'importazione CSV/XLSX restano disponibili solo nell'app corrente — questa scheda resta sul ruolo
        attivo (<b className="font-semibold text-foreground">{DEFAULT_ROLE}</b>).
      </p>

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Profilo di partenza</div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(JD_PROFILES) as JdPresetId[]).map((pid) => (
            <button
              key={pid}
              type="button"
              onClick={() => handleSelectPreset(pid)}
              className={cn(
                'rounded-md border px-3.5 py-2 text-[13px] font-medium transition-colors',
                pid === currentPreset ? 'border-primary bg-primary/10 font-semibold text-foreground' : 'border-border text-muted-foreground hover:border-ring',
              )}
            >
              {JD_PROFILES[pid].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <div className="flex flex-col gap-4">
          <AccordionSection index={nextIdx()} title="Intestazione posizione" collapsed={!!collapsed.header} onToggle={() => toggleSection('header')}>
            <JdHeaderFields header={jdState.header} scopo={jdState.scopo} onHeaderChange={(patch) => setJdState((prev) => ({ ...prev, header: { ...prev.header, ...patch } }))} onScopoChange={(scopo) => setJdState((prev) => ({ ...prev, scopo }))} />
          </AccordionSection>

          <AccordionSection index={nextIdx()} title="Fasce Retributive e Benefit" collapsed={!!collapsed.salary} onToggle={() => toggleSection('salary')}>
            <JdSalaryBenefits role={DEFAULT_ROLE} />
          </AccordionSection>

          {SECTION_ORDER.map((key) => (
            <AccordionSection key={key} index={nextIdx()} title={SECTION_TITLES[key]} sub={SECTION_SUB[key]} collapsed={!!collapsed[key]} onToggle={() => toggleSection(key)}>
              <JdSection section={jdState.sections[key]} onChange={(next) => updateSection(key, next)} />
            </AccordionSection>
          ))}

          <AccordionSection index={nextIdx()} title="Hard skills" sub="Livello richiesto: seleziona una voce, poi Base / Intermedio / Avanzato / Esperto." collapsed={!!collapsed.hard} onToggle={() => toggleSection('hard')}>
            <JdHardSkills groups={jdState.hardSkillGroups} onChange={updateHardSkillGroups} />
          </AccordionSection>

          <AccordionSection index={nextIdx()} title="Soft skills" sub={SECTION_SUB.softSkills} collapsed={!!collapsed.softSkills} onToggle={() => toggleSection('softSkills')}>
            <JdSection section={jdState.sections.softSkills} onChange={(next) => updateSection('softSkills', next)} />
          </AccordionSection>

          {SECTION_ORDER_REST.map((key) => (
            <AccordionSection key={key} index={nextIdx()} title={SECTION_TITLES[key]} sub={SECTION_SUB[key]} collapsed={!!collapsed[key]} onToggle={() => toggleSection(key)}>
              <JdSection section={jdState.sections[key]} onChange={(next) => updateSection(key, next)} />
            </AccordionSection>
          ))}

          <AccordionSection index={nextIdx()} title="Richieste specifiche aggiuntive" sub="Spazi liberi per competenze o requisiti non coperti sopra — cambia ad ogni ricerca." collapsed={!!collapsed.extra} onToggle={() => toggleSection('extra')}>
            <JdExtraRequirements rows={jdState.extra} onChange={updateExtra} />
          </AccordionSection>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <JdPreview jd={jdState} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button type="button" onClick={handleSave} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-primary bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:brightness-95">
          <Save className="size-4 shrink-0" aria-hidden="true" />
          Salva JD per &quot;{DEFAULT_ROLE}&quot;
        </button>
        {saveMessage && <span className="text-[12.5px] font-medium text-success">{saveMessage}</span>}
        {backendNote && (
          <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
            {backendNote}
          </span>
        )}
      </div>
    </div>
  )
}
