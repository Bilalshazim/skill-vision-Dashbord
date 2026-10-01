import { Lock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DEFAULT_FLAGS, SKILL_MATRIX, SUBFACTORS, W } from '@/modules/recruiting/lib/constants'

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
          className="flex w-full flex-col items-start gap-1 rounded-sm border border-border p-3 text-left transition-colors hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="text-app-caption text-muted-foreground">Scegliere almeno 6 ESSENZIALI - 4 IMPORTANTI e 2 UTILI</span>
          <span className="text-app-small font-semibold text-foreground">{flaggedCount > 0 ? `${flaggedCount} selezionate (${essentialCount} essenziali)` : '0 selezionate'}</span>
          <span className="text-app-caption font-medium text-foreground dark:text-primary">Apri selezione →</span>
        </button>
      </DialogTrigger>
      <DialogContent size="full">
        <DialogHeader>
          <DialogTitle>Le 35 soft skill APEX 5D</DialogTitle>
        </DialogHeader>

        <p className="flex items-start gap-1.5 rounded-sm border border-border bg-secondary px-3 py-2 text-app-caption text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Sola lettura in questa versione — la modifica richiede il cambio ruolo, non ancora disponibile in questa migrazione.
        </p>

        <div className="flex flex-wrap items-center gap-3 text-app-caption text-muted-foreground">
          {/* Il peso è una categoria, non uno stato: badge neutro con la
              parola, nessun colore che lo distingua (regola 10). */}
          {([3, 2, 1] as const).map((lv) => (
            <span key={lv} className="inline-flex items-center gap-1.5">
              <Badge>{W[lv].label}</Badge>
              peso {lv}
            </span>
          ))}
          <span>Senza badge: non richiesta</span>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-[10.5rem] gap-3 pb-1">
            {SKILL_MATRIX.map((col) => (
              <div key={col.label} className="flex flex-col gap-1.5">
                <div className="label-mono mb-1 text-muted-foreground">{col.label}</div>
                {col.items.map((sk) => {
                  const lv = DEFAULT_FLAGS[sk]
                  return (
                    <div key={sk} className="rounded-sm border border-border px-2 py-1.5 text-app-caption leading-snug text-foreground">
                      {sk}
                      {lv && <Badge className="ml-1.5 align-middle">{W[lv].label}</Badge>}
                    </div>
                  )
                })}
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <div className="label-mono mb-1 text-muted-foreground">Sottofattori</div>
              {SUBFACTORS.map((s) => (
                <div key={s} className="rounded-sm px-2 py-1.5 text-app-caption italic leading-snug text-muted-foreground">
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
