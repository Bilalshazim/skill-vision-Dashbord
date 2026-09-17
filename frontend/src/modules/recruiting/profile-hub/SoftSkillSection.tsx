import { Lock } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { DEFAULT_FLAGS, SKILL_MATRIX, SUBFACTORS, W } from '@/modules/recruiting/lib/constants'
import type { SoftSkillLevel } from '@/modules/recruiting/lib/types'

const TAG_CLASS: Record<SoftSkillLevel, string> = {
  3: 'bg-primary text-primary-foreground',
  2: 'bg-primary/55 text-primary-foreground',
  1: 'bg-primary/20 text-foreground',
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className={cn('inline-block size-2.5 rounded-full', className)} aria-hidden="true" />
      {label}
    </span>
  )
}

// Ported from renderSkillsInto()/updateProfCnt()/updateProfileCardsSS()
// (modules/recruiting.html ~5529-5581) — the "Soft skill" master card's
// teaser row + the full "Le 35 soft skill APEX 5D" picker modal
// (ssModalOv/skillGridModal, ~1018-1035).
//
// READ-ONLY BY DESIGN (Phase 19/20 scope): the picker's click handler
// (cycleSkillFlag()) mutates the shared `flags` global, but its ONLY
// persistence trigger anywhere in legacy is inside the role-switch
// function — which this migration has never built (DEFAULT_ROLE/
// DEFAULT_FLAGS are fixed since Phase 4). So an editable version here would
// have no way to ever save a change, unlike legacy where switching away
// from a role is what commits it. Reproducing the display only, off the
// same DEFAULT_FLAGS every other migrated screen already reads, with the
// modal's own weight tags/legend/Sottofattori column intact for visual
// parity — never wired to a click handler.
export function SoftSkillSection() {
  const flaggedCount = Object.keys(DEFAULT_FLAGS).length
  const essentialCount = Object.values(DEFAULT_FLAGS).filter((v) => v === 3).length

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex w-full flex-col items-start gap-1 rounded-md border border-border p-3 text-left transition-colors hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="text-[12px] text-muted-foreground">Scegliere almeno 6 ESSENZIALI - 4 IMPORTANTI e 2 UTILI</span>
          <span className="text-[13px] font-semibold text-foreground">{flaggedCount > 0 ? `${flaggedCount} selezionate (${essentialCount} essenziali)` : '0 selezionate'}</span>
          <span className="text-[12px] font-medium text-foreground dark:text-primary">Apri selezione →</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)] lg:max-w-[1150px]">
        <DialogHeader>
          <DialogTitle>Le 35 soft skill APEX 5D</DialogTitle>
        </DialogHeader>

        <p className="flex items-start gap-1.5 rounded-md border border-border bg-secondary px-3 py-2 text-[12px] text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Sola lettura in questa versione — la modifica richiede il cambio ruolo, non ancora disponibile in questa migrazione.
        </p>

        <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-muted-foreground">
          <LegendSwatch className="bg-primary" label="Essenziale (peso 3)" />
          <LegendSwatch className="bg-primary/55" label="Importante (peso 2)" />
          <LegendSwatch className="bg-primary/20" label="Utile (peso 1)" />
          <LegendSwatch className="border border-border" label="Non richiesta" />
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-[168px] gap-3 pb-1">
            {SKILL_MATRIX.map((col) => (
              <div key={col.label} className="flex flex-col gap-1.5">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{col.label}</div>
                {col.items.map((sk) => {
                  const lv = DEFAULT_FLAGS[sk]
                  return (
                    <div key={sk} className="rounded-md border border-border px-2 py-1.5 text-[11.5px] leading-snug text-foreground">
                      {sk}
                      {lv && <span className={cn('ml-1.5 inline-block rounded-full px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wide', TAG_CLASS[lv])}>{W[lv].label}</span>}
                    </div>
                  )
                })}
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sottofattori</div>
              {SUBFACTORS.map((s) => (
                <div key={s} className="rounded-md px-2 py-1.5 text-[11.5px] italic leading-snug text-muted-foreground">
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
