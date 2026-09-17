import { Check, IdCard, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { cipApi } from '@/lib/api/endpoints'
import { getBackendUser } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { getCachedBackendLink } from '@/modules/recruiting/lib/backend-link'
import { getActiveOpening, renameCompany, renameOpening } from '@/modules/recruiting/lib/pipeline'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'

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
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      {editing ? (
        <div className="mt-0.5 flex items-center gap-1">
          <input
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
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-[14px] font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <button
            type="button"
            onClick={commit}
            title="Salva"
            aria-label="Salva"
            className="inline-flex shrink-0 items-center justify-center rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground"
          >
            <Check className="size-3.5 shrink-0" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="group mt-0.5 flex w-full items-center gap-1.5 text-left text-[14px] font-semibold text-foreground"
          title={`Modifica ${label.toLowerCase()}`}
        >
          <span className="truncate">{value || '—'}</span>
          <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
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

  const [cipCode, setCipCode] = useState<string | null>(null)
  const [cipLoading, setCipLoading] = useState(false)

  useEffect(() => {
    if (!isPlatformAdmin || !backendCampaignId) {
      setCipCode(null)
      return
    }
    let cancelled = false
    setCipLoading(true)
    cipApi
      .list({ ownerType: 'CAMPAIGN', ownerId: backendCampaignId })
      .then((cips) => {
        if (cancelled) return
        const active = cips.find((c) => c.status === 'ACTIVE')
        setCipCode(active?.code || null)
      })
      .catch(() => {
        if (!cancelled) setCipCode(null)
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
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-border bg-card shadow-sm px-4 py-3">
      <EditableField label="Company" value={company.name} onSave={(next) => {
        renameCompany(company.id, next)
        forceRerender((n) => n + 1)
      }} />
      <EditableField label="Campagna" value={opening.title} onSave={(next) => {
        renameOpening(company.id, opening.id, next)
        forceRerender((n) => n + 1)
      }} />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">CIP</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[14px] font-semibold">
          <IdCard className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          {!isPlatformAdmin ? (
            <span className="text-muted-foreground">Non disponibile — richiedilo a un platform admin</span>
          ) : cipLoading ? (
            <span className="text-muted-foreground">Verifica…</span>
          ) : cipCode ? (
            <span className={cn('font-mono')}>{cipCode}</span>
          ) : (
            <>
              <span className="text-muted-foreground">Non generato</span>
              <Link to="/recruiting/admin/cip" className="text-[12px] font-semibold text-foreground hover:underline dark:text-primary">
                Genera →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
