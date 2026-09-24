import { ArrowRight, FileDown, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export type CrossModuleStat = { label: string; value: ReactNode; sub?: string }

// Purely additive: a shared card wired onto the bottom of both modules'
// Home pages so Assessment and Recruiting read as one decision tool
// instead of two disconnected products (see CLAUDE.md rule 4). Lives in
// the top-level shared components/ dir (next to ModuleLockGate) rather
// than under modules/assessment — Recruiting renders it too and doesn't
// otherwise import from Assessment. Built only from shadcn primitives, so
// it inherits the same tokens/shapes in both module trees without any new
// CSS.
export function CrossModuleBanner({
  heading,
  body,
  stats,
  ctaLabel,
  ctaTo,
  secondaryLabel,
  onSecondary,
}: {
  heading: string
  body: string
  stats: CrossModuleStat[]
  ctaLabel: string
  ctaTo: string
  secondaryLabel: string
  onSecondary: () => void
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-1 gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
            <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-[15px] font-bold leading-snug">{heading}</h3>
            <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-muted-foreground">{body}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to={ctaTo}>
                  {ctaLabel}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="sm" variant="outline" onClick={onSecondary}>
                <FileDown className="size-3.5" aria-hidden="true" />
                {secondaryLabel}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 lg:w-100 lg:shrink-0">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-lg font-extrabold tabular-nums tracking-tight">{s.value}</div>
              {s.sub && <div className="mt-0.5 text-[11.5px] text-muted-foreground">{s.sub}</div>}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
