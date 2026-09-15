// Phase 31 §5/§15 — resolves which REAL backend Company + Campaign a
// locally-seeded Company/JobOpening (apex5d_cv_matching_state, see
// lib/types.ts) corresponds to, without touching activeContext or any of
// the existing local Pipeline/CV-Export logic at all (§1's "map first,
// then migrate with clear boundaries").
//
// WHY A SEPARATE MAPPING, NOT A REPLACEMENT: the local company/opening
// selector (CvExportPage's "Routing & Isolation" panel) drives a lot of
// still-local-only behavior this phase doesn't touch (Pipeline's own
// screen, Pagina A, Job Profile/JD, Survey links, Interview Protocol — see
// the Phase 31 data-flow map). Swapping its SOURCE to the backend outright
// would either break all of that (their ids would no longer resolve) or
// require migrating every one of those screens in the same pass — well
// beyond "connect the CV/shortlist/send-test pipeline" scope. Instead: the
// local selector keeps working exactly as it always has, and THIS module
// separately tracks "which backend Company/Campaign does the CURRENTLY
// selected local opening correspond to" — resolved once per opening (by
// name, since that's the only identifier both systems share — Roberto's
// company name), cached, and used only by the NEW backend-backed actions
// this phase adds (CV upload-to-backend, shortlist, send-test).
//
// This is a one-way, additive, non-destructive bridge — it never writes to
// apex5d_cv_matching_state, never deletes anything, and an opening with no
// backend counterpart yet simply shows "non collegato al backend" instead
// of silently guessing one.
import { campaignsApi, companiesApi } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'
import type { BackendCampaign, BackendCompany } from '@/lib/api/types'

const LINK_MAP_KEY = 'apex5d_backend_link_map'

type LinkMap = Record<string, { companyId: string; campaignId: string } | undefined>

function readLinkMap(): LinkMap {
  try {
    const raw = localStorage.getItem(LINK_MAP_KEY)
    return raw ? (JSON.parse(raw) as LinkMap) : {}
  } catch {
    return {}
  }
}
function writeLinkMap(map: LinkMap): void {
  try {
    localStorage.setItem(LINK_MAP_KEY, JSON.stringify(map))
  } catch {
    /* non-fatal — resolution just runs again next time */
  }
}

export function getCachedBackendLink(openingId: string): { companyId: string; campaignId: string } | undefined {
  return readLinkMap()[openingId]
}

// Phase 32 §2/§8 — Ranking has no per-opening scope (it lists every
// candidate in local storage at once, see ranking/RankingPage.tsx), so
// reconciling it against the backend means walking every opening this
// browser has ever linked, not just the currently active one.
export function getAllCachedBackendLinks(): { openingId: string; companyId: string; campaignId: string }[] {
  const map = readLinkMap()
  return Object.entries(map)
    .filter((entry): entry is [string, { companyId: string; campaignId: string }] => Boolean(entry[1]))
    .map(([openingId, link]) => ({ openingId, ...link }))
}

function normalize(name: string): string {
  return name.trim().toLowerCase()
}

export type ResolveBackendLinkResult =
  | { ok: true; companyId: string; campaignId: string; companyCreated: boolean; campaignCreated: boolean }
  | { ok: false; reason: 'company-not-found'; message: string }
  | { ok: false; reason: 'error'; message: string }

// Resolves (and caches) the backend Company + Campaign for a local
// {companyName, openingId, openingTitle} triple. Matches by exact
// case-insensitive name; if the company itself has no backend counterpart,
// this does NOT invent one (creating a Company is a PLATFORM_ADMIN-only
// action, and guessing a new company into existence is exactly the kind of
// unrequested behavior the brief prohibits) — it reports 'company-not-found'
// so the caller can show an honest message instead. A missing CAMPAIGN
// under an already-resolved company IS created here (COMPANY_ADMIN/
// RECRUITER can legitimately do this — it's the same "start a new opening"
// action a recruiter already takes locally), never a missing company.
export async function resolveBackendLink(companyName: string, openingId: string, openingTitle: string): Promise<ResolveBackendLinkResult> {
  const cached = getCachedBackendLink(openingId)
  if (cached) return { ok: true, ...cached, companyCreated: false, campaignCreated: false }

  try {
    const companies = await companiesApi.list()
    const company = companies.find((c: BackendCompany) => normalize(c.name) === normalize(companyName))
    if (!company) {
      return {
        ok: false,
        reason: 'company-not-found',
        message: `Nessuna azienda backend chiamata "${companyName}" — un platform admin deve crearla prima di poter collegare questa posizione.`,
      }
    }

    const campaigns = await campaignsApi.list(company.id)
    let campaign = campaigns.find((c: BackendCampaign) => normalize(c.name) === normalize(openingTitle))
    let campaignCreated = false
    if (!campaign) {
      campaign = await campaignsApi.create(company.id, openingTitle)
      campaignCreated = true
    }

    const link = { companyId: company.id, campaignId: campaign.id }
    const map = readLinkMap()
    map[openingId] = link
    writeLinkMap(map)
    return { ok: true, ...link, companyCreated: false, campaignCreated }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Errore sconosciuto'
    return { ok: false, reason: 'error', message }
  }
}
