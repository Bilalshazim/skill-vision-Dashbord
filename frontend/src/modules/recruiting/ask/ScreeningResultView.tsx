import { Check, CircleHelp, Search, TriangleAlert, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { criteriaSummary } from '@/modules/recruiting/lib/ask'
import type { CriterionCheck, ScreeningMatch, ScreeningResult } from '@/modules/recruiting/lib/ask'

const STATUS_TONE: Record<CriterionCheck['status'], 'success' | 'destructive' | 'warning'> = {
  pass: 'success',
  fail: 'destructive',
  unknown: 'warning',
}
const STATUS_ICON: Record<CriterionCheck['status'], typeof Check> = { pass: Check, fail: X, unknown: CircleHelp }

function CheckBadge({ check }: { check: CriterionCheck }) {
  const Icon = STATUS_ICON[check.status]
  return (
    <Badge tone={STATUS_TONE[check.status]}>
      <Icon aria-hidden="true" />
      {check.label}
      {check.detail ? ` — ${check.detail}` : ''}
    </Badge>
  )
}

function ContactBadge({ m }: { m: ScreeningMatch }) {
  if (m.contactable && (m.consent === 'explicit' || m.consent === 'implicit')) {
    return (
      <Badge tone="success">
        <Check aria-hidden="true" />
        Contattabile{m.contactChannels.length ? ` (${m.contactChannels.join(', ')})` : ''}
      </Badge>
    )
  }
  if (m.contactable) {
    return (
      <Badge tone="warning">
        <TriangleAlert aria-hidden="true" />
        Contatti presenti — consenso da verificare
      </Badge>
    )
  }
  return (
    <Badge tone="destructive">
      <X aria-hidden="true" />
      Non contattabile
    </Badge>
  )
}

// Migrated from _psRender() (modules/recruiting.html ~5355-5370) — the
// local pre-screening query's result list (see lib/ask.ts
// runLocalScreeningQuery()).
export function ScreeningResultView({ result }: { result: ScreeningResult }) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="flex items-center gap-2 text-app-small font-semibold text-foreground">
          <Search className="size-4" aria-hidden="true" />
          Pre-screening CV — {result.total} candidati su {result.evaluated}
        </div>
        <p className="text-app-caption text-muted-foreground">
          Criteri: {criteriaSummary(result.criteria)} · origine: {result.source}
        </p>
      </div>
      {!result.matches.length ? (
        <p className="text-app-small text-muted-foreground">Nessun candidato soddisfa i criteri indicati.</p>
      ) : (
        <div>
          {result.matches.map((m, i) => (
            <div key={i} className="border-b border-border py-2 last:border-0">
              <div className="text-app-small">
                <b className="font-semibold text-foreground">{m.name}</b>
                <span
                  className={cn(
                    'label-mono ml-2 rounded-full px-2 py-0.5',
                    m.sourceTag === 'NEW_APPLICANT' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {m.sourceTag}
                </span>
                {m.role ? ` · ${m.role}` : ''}
                {m.icv != null ? (
                  <>
                    {' '}
                    · <span className="text-muted-foreground">ICV {m.icv}</span>
                  </>
                ) : null}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {m.checks.map((c, j) => (
                  <CheckBadge key={j} check={c} />
                ))}
                <ContactBadge m={m} />
              </div>
              {m.email || m.phone ? <div className="mt-0.5 text-app-caption text-muted-foreground">{[m.email, m.phone].filter(Boolean).join(' · ')}</div> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
