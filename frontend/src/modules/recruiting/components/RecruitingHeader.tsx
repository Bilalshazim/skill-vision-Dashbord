import { Check, IdCard, Pencil } from 'lucide-react'
import type { BackendCip } from '@/lib/api/types'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { cipApi } from '@/lib/api/endpoints'
import { getBackendUser } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { getCachedBackendLink } from '@/modules/recruiting/lib/backend-link'
import { getActiveOpening, renameCompany, renameOpening } from '@/modules/recruiting/lib/pipeline'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'
import { Hint } from '@/components/patterns/Hint'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function EditableField({ label, value, onSave }: { label: string; value: string; onSave: (next: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  function commit() {
    onSave(draft)
    setEditing(false)
  }

  return (
    <div className="min-w-48">
      <div className="label-mono text-muted-foreground">{label}</div>
      {editing ? (
        <div className="mt-1 flex items-center gap-1">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(value)
                setEditing(false)
              }
            }}
            size="sm"
 />
          <Hint label="Salva">
            <Button
              type="button"
              onClick={commit}
              aria-label="Salva"
              variant="outline"
              size="icon-sm"
            >
              <Check className="size-3.5 shrink-0" aria-hidden="true" />
            </Button>
          </Hint>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-1 flex min-h-10 w-full items-center gap-2 rounded-sm border-2 border-border-strong bg-background px-3 text-left text-app-small font-semibold text-foreground transition-colors outline-none hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label={`Modifica ${label.toLowerCase()}`}
        >
          <span className="min-w-0 flex-1 truncate">{value || '—'}</span>
          <Pencil className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

// Client §1 — 3 editable/configurable header metadata fields (Company Name,
// Campaign Name, CIP), replacing what was previously no header at all (a
// grep found no "ACME CORP"/"SENIOR FRONTEND ENGINEER" literal anywhere —
// see the investigation this phase started from). Company/Campaign are the
// SAME local activeContext every other Recruiting screen already reads
// (getActiveOpening/renameCompany/renameOpening, lib/pipeline.ts) — this
// header is a new, more visible place to see and edit them, not a second
// source of truth.
//
// CIP is read-only here and deliberately does NOT try to generate one:
// GET/POST /cip (list/generate) are PLATFORM_ADMIN-only server-side (see
// backend/src/modules/cip/routes.ts's own comments — "CIP credentials/
// administration must respect platform-admin permissions"), so a recruiter
// or company admin has no endpoint that could honestly show them a CIP
// beyond "not generated yet". Only a platform admin sees a live lookup +
// a link to the full CIP admin screen; anyone else sees a static, honest
// placeholder rather than a broken or silently-guessed value.
export function RecruitingHeader() {
  const [, forceRerender] = useState(0)
  const { company, opening } = getActiveOpening(readCvMatchingState())
  const backendCampaignId = opening ? getCachedBackendLink(opening.id)?.campaignId : undefined
  const user = getBackendUser()
  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN'

  const [cip, setCip] = useState<BackendCip | null>(null)
  const cipCode = cip?.code ?? null
  const [cipLoading, setCipLoading] = useState(false)

  useEffect(() => {
    if (!isPlatformAdmin || !backendCampaignId) {
      setCip(null)
      return
    }
    let cancelled = false
    setCipLoading(true)
    cipApi
      .list({ ownerType: 'CAMPAIGN', ownerId: backendCampaignId })
      .then((cips) => {
        if (cancelled) return
        const active = cips.find((c) => c.status === 'ACTIVE')
        setCip(active ?? null)
      })
      .catch(() => {
        if (!cancelled) setCip(null)
      })
      .finally(() => {
        if (!cancelled) setCipLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isPlatformAdmin, backendCampaignId])

  if (!company || !opening) return null

  return (
    <Card className="gap-4">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
        <EditableField label="Società" value={company.name} onSave={(next) => {
          renameCompany(company.id, next)
          forceRerender((n) => n + 1)
        }} />
        <EditableField label="Campagna" value={opening.title} onSave={(next) => {
          renameOpening(company.id, opening.id, next)
          forceRerender((n) => n + 1)
        }} />
        <div className="min-w-48">
          <div className="label-mono text-muted-foreground">CIP</div>
          <div className="mt-1 flex min-h-10 items-center gap-2 rounded-sm border-2 border-border-strong bg-muted px-3 text-app-small font-semibold">
            <IdCard className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            {!isPlatformAdmin ? (
              <span className="text-muted-foreground">Non disponibile — chiedilo all'amministratore della piattaforma</span>
            ) : cipLoading ? (
              <span className="text-muted-foreground">Verifica…</span>
            ) : cipCode ? (
              <span className={cn('font-mono')}>{cipCode}</span>
            ) : (
              <>
                <span className="text-muted-foreground">Non generato</span>
                <Link to="/recruiting/admin/cip" className="text-app-caption font-semibold text-foreground hover:underline dark:text-primary">
                  Genera →
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      {cip ? (
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <CipDetail label="Cliente" value={company.name} />
          <CipDetail label="Campagna" value={opening.title} />
          <CipDetail label="N. progressivo" value={`${String(cip.sequence).padStart(2, '0')}`} mono />
          <CipDetail label="Referente aziendale" value={cip.referent || '—'} />
          <CipDetail label="Advisor" value={cip.advisor || '—'} />
          <CipDetail label="Venditore" value={cip.sellerCode ? `${cip.sellerCode.code} · ${cip.sellerCode.label}` : cip.sellerCodeId} />
          <CipDetail label="Attivazione" value={new Date(cip.generatedAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })} mono />
        </dl>
      ) : null}
    </Card>
  )
}

function CipDetail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="label-mono text-muted-foreground">{label}</dt>
      <dd className={cn('mt-1 truncate text-app-small font-semibold text-foreground', mono && 'font-mono')}>{value}</dd>
    </div>
  )
}
