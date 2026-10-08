import { RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SKILL_MATRIX, SUBFACTORS, W } from '@/modules/recruiting/lib/constants'
import { cycleSkillFlag, resetSkillFlags, useSkillFlags } from '@/modules/recruiting/lib/skill-flags'

// Il riquadro "Soft skill" del Profilo della ricerca e il selettore delle 35
// competenze trasversali APEX 5D. Un clic su una competenza ne cambia il peso
// (1 clic essenziale → 2 importante → 3 utile → 4 non richiesta); la scelta
// si salva in questo browser e la usano ranking, punteggi e scheda di lavoro
// (lib/skill-flags.ts).
const CLICKS = { 3: '1 clic', 2: '2 clic', 1: '3 clic' } as const
const TILE_TONE = {
  3: 'border-primary bg-primary text-primary-foreground',
  2: 'surface-accent text-foreground',
  1: 'border-border-strong bg-muted text-foreground',
} as const
const BADGE_TONE = {
  3: 'border-transparent bg-foreground text-background',
  2: 'surface-accent text-foreground',
  1: 'border-border-strong bg-muted text-foreground',
} as const

export function SoftSkillSection() {
  const flags = useSkillFlags()
  const flaggedCount = Object.keys(flags).length
  const countOf = (lv: number) => Object.values(flags).filter((v) => v === lv).length
  const essentialCount = countOf(3)

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
          <DialogTitle>Le 35 competenze trasversali APEX 5D</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-app-small text-muted-foreground">
            Clicca su una competenza per darle un peso: 1 clic essenziale, 2 clic importante, 3 clic utile, 4 clic la toglie. La scelta si salva in questo browser.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={resetSkillFlags}>
            <RotateCcw aria-hidden="true" />
            Ripristina i pesi di partenza
          </Button>
        </div>
        <p className="text-app-small text-foreground" aria-live="polite">
          Selezionate: <b className="font-semibold">{countOf(3)}</b> essenziali · <b className="font-semibold">{countOf(2)}</b> importanti · <b className="font-semibold">{countOf(1)}</b> utili
          <span className="text-muted-foreground"> — da scegliere almeno 6 essenziali, 4 importanti e 2 utili.</span>
        </p>

        <div className="flex flex-wrap items-center gap-3 text-app-caption text-muted-foreground">
          {/* Il peso è una categoria, non uno stato: scala di intensità sul
              lime (pieno, tenue, neutro) e sempre la parola accanto (regola 10). */}
          {([3, 2, 1] as const).map((lv) => (
            <span key={lv} className="inline-flex items-center gap-1.5">
              <Badge className={BADGE_TONE[lv]}>{W[lv].label}</Badge>
              {CLICKS[lv]}
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
                  const lv = flags[sk]
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => cycleSkillFlag(sk)}
                      aria-label={`${sk}: ${lv ? W[lv].label : 'non richiesta'}. Clic per cambiare il peso`}
                      className={`rounded-sm border px-2 py-1.5 text-left text-app-caption leading-snug transition-colors outline-none hover:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${lv ? TILE_TONE[lv] : 'border-border text-foreground'}`}
                    >
                      {sk}
                      {lv && <Badge className={`ml-1.5 align-middle ${BADGE_TONE[lv]}`}>{W[lv].label}</Badge>}
                    </button>
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
