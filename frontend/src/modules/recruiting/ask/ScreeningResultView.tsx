import { cn } from '@/lib/utils'
import { criteriaSummary } from '@/modules/recruiting/lib/ask'
import type { CriterionCheck, ScreeningMatch, ScreeningResult } from '@/modules/recruiting/lib/ask'

const STATUS_CLASS: Record<CriterionCheck['status'], string> = {
  pass: 'bg-success/12 text-success',
  fail: 'bg-destructive/10 text-destructive',
  unknown: 'bg-warning/12 text-warning',
}
const STATUS_SYMBOL: Record<CriterionCheck['status'], string> = { pass: '✓ ', fail: '✗ ', unknown: '? ' }

function CheckBadge({ check }: { check: CriterionCheck }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10.5px] font-semibold', STATUS_CLASS[check.status])}>
      {STATUS_SYMBOL[check.status]}
      {check.label}
      {check.detail ? ` — ${check.detail}` : ''}
    </span>
  )
}

function ContactBadge({ m }: { m: ScreeningMatch }) {
  if (m.contactable && (m.consent === 'explicit' || m.consent === 'implicit')) {
    return <span className={cn('rounded-full px-2 py-0.5 text-[10.5px] font-semibold', STATUS_CLASS.pass)}>✓ Contattabile{m.contactChannels.length ? ` (${m.contactChannels.join(', ')})` : ''}</span>
  }
  if (m.contactable) return <span className={cn('rounded-full px-2 py-0.5 text-[10.5px] font-semibold', STATUS_CLASS.unknown)}>⚠ Contatti presenti — consenso da verificare</span>
  return <span className={cn('rounded-full px-2 py-0.5 text-[10.5px] font-semibold', STATUS_CLASS.fail)}>✗ Non contattabile</span>
}

// Migrated from _psRender() (modules/recruiting.html ~5355-5370) — the
// local pre-screening query's result list (see lib/ask.ts
// runLocalScreeningQuery()).
export function ScreeningResultView({ result }: { result: ScreeningResult }) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="text-[13.5px] font-semibold text-foreground">
          🔎 Pre-screening CV — {result.total} candidati su {result.evaluated}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Criteri: {criteriaSummary(result.criteria)} · origine: {result.source}
        </p>
      </div>
      {!result.matches.length ? (
        <p className="text-[12.5px] text-muted-foreground">Nessun candidato soddisfa i criteri indicati.</p>
      ) : (
        <div>
          {result.matches.map((m, i) => (
            <div key={i} className="border-b border-border py-2 last:border-0">
              <div className="text-[13px]">
                <b className="font-semibold text-foreground">{m.name}</b>
                <span
                  className={cn(
                    'ml-2 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide',
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
              {m.email || m.phone ? <div className="mt-0.5 text-[11px] text-muted-foreground">{[m.email, m.phone].filter(Boolean).join(' · ')}</div> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
