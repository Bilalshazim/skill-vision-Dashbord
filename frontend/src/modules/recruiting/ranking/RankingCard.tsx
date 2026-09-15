import { AlertTriangle, ArrowLeftRight, ChevronDown, Download, FileJson } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { ActionButton } from '@/modules/recruiting/components/ActionButton'
import { EssentialSkillBars } from '@/modules/recruiting/components/EssentialSkillBars'
import { LegacyBridgeButton } from '@/modules/recruiting/components/LegacyBridgeButton'
import { CandidateProfileDialog } from '@/modules/recruiting/cv/CandidateProfileDialog'
import { CvMatchDialog } from '@/modules/recruiting/cv/CvMatchDialog'
import { CvOpenButton } from '@/modules/recruiting/cv/CvOpenButton'
import { BigFiveRows } from '@/modules/recruiting/ranking/BigFiveRows'
import { ScoreBadge } from '@/modules/recruiting/ranking/ScoreBadge'
import { SkillTierSums } from '@/modules/recruiting/ranking/SkillTierSums'
import { SubScoreBoxes } from '@/modules/recruiting/ranking/SubScoreBoxes'
import { downloadCandidateProfileJson, downloadCandidateReport } from '@/modules/recruiting/lib/candidateExport'
import { DEFAULT_FLAGS } from '@/modules/recruiting/lib/constants'
import { fasce, skillTierSums } from '@/modules/recruiting/lib/scoring'
import type { AhiResult } from '@/modules/recruiting/lib/scoring'
import type { Candidate, RoleProfile } from '@/modules/recruiting/lib/types'

const ESSENTIAL_SKILLS = Object.entries(DEFAULT_FLAGS)
  .filter(([, lv]) => lv === 3)
  .map(([sk]) => sk)

// Ported from renderRanking()'s per-card markup (modules/recruiting.html
// ~2865-2933). Candidate-detail actions: name click → CandidateProfileDialog
// (the showCand() equivalent, already migrated), CV → CvOpenButton (the real
// backend-stored file — same component Pagina A uses; this card's "CV" used
// to bridge to /modules/recruiting.html, a page that no longer exists, so it
// opened a 404 instead of the candidate's actual CV), report download and
// JSON export are real local downloads. Only the internal-talent compare
// isn't implemented yet (LegacyBridgeButton — now a disabled button, never a
// dead legacy link).
export function RankingCard({
  candidate,
  result,
  position,
  totalRanked,
  role,
}: {
  candidate: Candidate
  result: AhiResult
  position: number
  totalRanked: number
  role: RoleProfile
}) {
  // Phase 30 §15: the results list stays closed initially — no candidate,
  // including #1, opens automatically. Previously this defaulted the
  // top-ranked card open (`position === 1`); every card now starts
  // collapsed until the recruiter clicks it.
  const [open, setOpen] = useState(false)
  const f = fasce(result.v, result.capped)
  const hardFlags = result.rf.filter((x) => x.hard)
  const sums = skillTierSums(candidate)

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[46px_1fr_auto_auto]"
      >
        <div
          className={cn(
            'grid size-[46px] shrink-0 place-items-center rounded-md font-mono text-xl font-bold',
            position === 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
          )}
        >
          {position}
        </div>

        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold">{candidate.name}</div>
          <div className="text-[12.5px] font-semibold text-muted-foreground">{candidate.src}</div>
        </div>

        <div className="hidden text-right sm:block">
          <div className="font-mono text-[28px] font-semibold leading-none text-foreground">{result.v}</div>
          <ScoreBadge fascia={f} className="mt-1 block" />
        </div>

        <ChevronDown className={cn('size-5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {/* Score repeats on its own row on narrow screens — the header grid
          hides it above md to keep the header from wrapping awkwardly. */}
      <div className="mt-3 flex items-center justify-between sm:hidden">
        <div className="font-mono text-2xl font-semibold">{result.v}</div>
        <ScoreBadge fascia={f} />
      </div>

      {open && (
        <div className="mt-4 border-t border-dashed border-border pt-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <CvMatchDialog candidate={candidate} />
            <CandidateProfileDialog candidate={candidate} />
            <CvOpenButton candidate={candidate} className="shrink-0" />
            <ActionButton icon={Download} label="Report" onClick={() => downloadCandidateReport(candidate, result, position, totalRanked)} />
          </div>

          <SubScoreBoxes fc={result.fc} ab={result.ab} icv={result.icv} />
          <SkillTierSums sums={sums} />

          <div className="mt-4 text-[13px] font-semibold">Skill essenziali vs target (linea = target)</div>
          <div className="mt-2">
            <EssentialSkillBars candidate={candidate} essentialSkills={ESSENTIAL_SKILLS} />
          </div>

          <div className="mt-4 text-[13px] font-semibold">Big Five (percentili) vs profilo ideale del ruolo</div>
          <div className="mt-2">
            <BigFiveRows candidate={candidate} role={role} />
          </div>

          {hardFlags.length > 0 && (
            <p className="mt-4 flex items-start gap-2 text-[13.5px] font-semibold text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Sbarramento attivo: {hardFlags.map((x) => `${x.sk} (${x.s.toFixed(1)} vs target ${x.t})`).join(' · ')} — AHI
              bloccato a 59.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <LegacyBridgeButton icon={ArrowLeftRight} label="Confronta con i dipendenti interni" />
            <ActionButton icon={FileJson} label="Esporta profilo" onClick={() => downloadCandidateProfileJson(candidate, result)} />
          </div>
        </div>
      )}
    </div>
  )
}
