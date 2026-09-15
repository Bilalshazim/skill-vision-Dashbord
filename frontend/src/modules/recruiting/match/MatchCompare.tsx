import { cn } from '@/lib/utils'
import type { Candidate } from '@/modules/recruiting/lib/types'

export type MatchPick = { c: Candidate; type: 'cand' | 'it' }

const TALENT_OPACITIES = [1, 0.78, 0.6, 0.46, 0.34]

// Ported verbatim from referenceFor()/gradeColor() (modules/recruiting.html
// ~4981-4993). External candidates are graded per skill against a
// reference: the average of the OTHER selected internal talents, or — if
// none are selected — the average of the other selected candidates.
function referenceFor(pick: MatchPick, sk: string, picks: MatchPick[]): number {
  const others = picks.filter((p) => p !== pick)
  const talentVals = others.filter((p) => p.type === 'it').map((p) => p.c.scores?.[sk] || 0)
  const base = talentVals.length ? talentVals : others.map((p) => p.c.scores?.[sk] || 0)
  return base.length ? base.reduce((a, b) => a + b, 0) / base.length : 0
}

function gradeTone(v: number, ref: number): 'muted' | 'success' | 'warning' | 'destructive' {
  if (ref <= 0) return 'muted' // nothing to compare against — neutral, not automatically positive
  const ratio = v / ref
  if (ratio >= 0.95) return 'success'
  if (ratio >= 0.7) return 'warning'
  return 'destructive'
}

const TONE_BAR_CLASS: Record<string, string> = {
  muted: 'bg-muted-foreground/40',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
}

// Migrated from renderMatchCompare() (modules/recruiting.html ~4953-5025) —
// the live implementation (renderMatch()/ci()-vs-single-bench, ~3114-3162,
// targets `matchPick`/`matchBody`, which the DOM marks "hidden ... for
// compat" — dead code, not reproduced here).
export function MatchCompare({ picks }: { picks: MatchPick[] }) {
  if (picks.length < 2) {
    return (
      <div className="rounded-md border border-border bg-card p-6 text-center text-[13px] text-muted-foreground">
        {picks.length === 1 ? 'Seleziona almeno un altro profilo per avviare il confronto' : 'Seleziona 2 o più profili per confrontarli'}
      </div>
    )
  }

  const allSkills = Array.from(new Set(picks.flatMap((p) => Object.keys(p.c.scores || {})))).sort()
  const barMax = 31

  // Mirrors legacy's own talentIdx counter exactly (modules/recruiting.html
  // ~4979-5010): declared ONCE outside the per-skill-row loop, so it keeps
  // incrementing across every row rather than resetting per row. The net
  // effect is that a given internal talent's bar opacity drifts row to row
  // instead of staying fixed to that talent — very likely an unintentional
  // upstream quirk (the comment above it describes a per-talent-stable
  // opacity), but a purely cosmetic one: no data or business logic is
  // affected, so it is reproduced exactly rather than "fixed" here.
  let talentIdx = 0

  const rows = allSkills.map((sk) => {
    const series = picks.map((pick) => {
      const v = pick.c.scores?.[sk] || 0
      if (pick.type === 'it') {
        const opacity = TALENT_OPACITIES[talentIdx % TALENT_OPACITIES.length]
        talentIdx++
        return { value: v, tone: 'muted' as const, opacity, name: pick.c.name }
      }
      return { value: v, tone: gradeTone(v, referenceFor(pick, sk, picks)), opacity: 1, name: pick.c.name }
    })
    return { sk, series }
  })

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Gap Analysis — soft skill</div>

      <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
        {picks.map((p, i) => (
          <span key={p.c.id} className="inline-flex items-center gap-1.5">
            {p.c.name}
            {p.c.isInternalTalent && (
              <span className="rounded-full border border-border bg-secondary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                INT
              </span>
            )}
            {i < picks.length - 1 && <span className="font-normal text-muted-foreground">vs</span>}
          </span>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-success" />
          In linea col riferimento
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-warning" />
          Gap moderato
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-destructive" />
          Gap ampio
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-muted-foreground/40" />
          Talento di riferimento
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="text-[12.5px] text-muted-foreground">Nessuna soft skill in comune trovata.</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <div key={row.sk} className="grid grid-cols-[minmax(0,150px)_1fr] items-center gap-3 text-[12px]">
              <span className="truncate font-semibold text-muted-foreground" title={row.sk}>
                {row.sk}
              </span>
              <div className="flex items-center gap-1">
                {row.series.map((s, i) => (
                  <div key={i} className="h-3 flex-1 rounded-full border border-border bg-secondary" title={`${s.name}: ${s.value.toFixed(1)}/31`}>
                    <div
                      className={cn('h-full rounded-full', TONE_BAR_CLASS[s.tone])}
                      style={{ width: `${Math.max(Math.min((s.value / barMax) * 100, 100), 2)}%`, opacity: s.opacity }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
