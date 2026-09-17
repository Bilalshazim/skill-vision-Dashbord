// Phase 31 §3 — bridges the legacy shell's session (sessionStorage
// sv_shell_auth/sv_shell_user, set only by index.html's own login form —
// see modules/assessment/lib/shell-bridge.ts) to a real backend JWT
// session (Phase 30's /api/v1/auth/login).
//
// WHY A BRIDGE, NOT A SECOND LOGIN SCREEN: the brief is explicit — preserve
// the existing login/landing experience, do not create a new login UI. The
// legacy shell's own login (js/app.js ~275-280) checks a hardcoded
// username/password pair against a small in-file list and never talks to
// any backend — it was never connected to Phase 30's real `User` table, and
// by the time React mounts, the plaintext password the visitor typed is
// already gone (js/app.js clears the field right after a successful check;
// confirmed by reading handleLogin() in full). There is therefore no
// credential available here to relay to POST /auth/login even if we wanted
// to — the shell session proves "this browser passed the shell's own
// gate", nothing more.
//
// THE BRIDGE: a fixed, local mapping from each of the shell's 4 demo
// usernames (js/app.js ~275-280) to one of Phase 30's seeded backend
// accounts (backend/prisma/seed.ts) with a broadly equivalent role —
// platform admin, company admin, or recruiter. This is a **known,
// disclosed, temporary integration shim** for this demo/dev environment,
// not a production identity design — seeded plaintext credentials living in
// frontend source are exactly as sensitive as the legacy shell's own
// USERS array already sitting in js/app.js (this doesn't make anything LESS
// secure than what already shipped), and it is documented as such in the
// Phase 31 report rather than presented as a finished auth system. A real
// deployment needs either a shared identity provider or the shell's own
// login form to POST directly to the backend — out of scope here (the brief
// forbids a new login UI, and wiring the legacy static HTML form to a new
// backend is a legacy-file change beyond "minimal/required for
// integration").
//
// Once bridged, the resulting access/refresh tokens live under client.ts's
// OWN sv_backend_* keys — entirely separate from sv_shell_auth/sv_shell_user,
// which remain the single source of truth for "is this visitor allowed
// into /recruiting at all" (RecruitingLayout's existing auth guard is
// UNCHANGED by this file). Losing the backend session (e.g. an expired
// refresh token) does not log the visitor out of the shell; it just means
// backend-dependent actions show the "not connected" error state (§16)
// until re-bridged.
import { authApi } from '@/lib/api/endpoints'
import { ApiError, clearBackendSession, getAccessToken, getBackendUser, onRoleForbidden, onUnauthorized, setBackendSession } from '@/lib/api/client'
import { getShellUser } from '@/modules/assessment/lib/shell-bridge'

// Read at build time by Vite; set as VITE_OPERATORE_BRIDGE_PASSWORD on the
// Railway "Skill Vision" service — never hardcoded here, so no real
// credential lives in source control. An empty fallback means a missing var
// just fails this one bridge login cleanly (the existing "backend
// unavailable" banner), rather than exposing or guessing anything.
const OPERATORE_BRIDGE_PASSWORD = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_OPERATORE_BRIDGE_PASSWORD || ''

const SHELL_TO_BACKEND: Record<string, { email: string; password: string }> = {
  admin: { email: 'admin@skill-vision.it', password: 'admin123' }, // PLATFORM_ADMIN
  roberto: { email: 'hr@acme.example', password: 'acme123' }, // COMPANY_ADMIN
  Roberto: { email: 'hr@acme.example', password: 'acme123' }, // COMPANY_ADMIN (same seed account, different shell login)
  operatore: { email: 'operatore@skill-vision.it', password: OPERATORE_BRIDGE_PASSWORD }, // RECRUITER — real production account (no seeded Company; see campaigns/routes.ts's companyId fallback)
}
// A shell user with no mapping (or none logged in yet) falls back to the
// recruiter account — the most restricted of the three — rather than
// silently granting no backend session at all, so Recruiting screens still
// function; company-scoped reads/writes remain correctly scoped regardless.
const FALLBACK = SHELL_TO_BACKEND.operatore

let bridgeInFlight: Promise<boolean> | null = null

// Tracks WHY the most recent bridge login failed, so callers can tell "the
// backend/DB is unreachable" (connectivity — see entitlements.ts's dev-only
// fail-open) apart from "the backend answered but said no" (a real auth
// problem, e.g. a bad seeded password, which should stay visible even in
// dev). ApiError.network is set by client.ts only when fetch() itself never
// reached the server; a 5xx means it reached a broken backend (e.g. the
// local Postgres isn't up) — both count as connectivity, not an auth bug.
let lastBridgeFailureWasConnectivity = false
export function wasLastBridgeFailureConnectivity(): boolean {
  return lastBridgeFailureWasConnectivity
}

// Phase 34 §2/§16 — REAL BUG FOUND AND FIXED during final QA: this key
// records WHICH shell user the cached backend session was bridged for. The
// original "if a token is already cached, reuse it" check had no way to
// tell whose token it was — logging out of the shell and back in as a
// DIFFERENT demo user (same browser tab, same localStorage) silently kept
// operating under the FIRST user's backend identity/role/company scope,
// since sv_shell_auth/sv_shell_user (sessionStorage) and sv_backend_*
// (localStorage) were never cross-checked against each other. Verified live:
// logging in as 'roberto' (COMPANY_ADMIN) then switching to 'admin'
// (PLATFORM_ADMIN) left every backend call running as the COMPANY_ADMIN —
// the CIP admin page (platform-admin-only) stayed gated, and the Recruiting
// nav hid the CIP link, for a user who had genuinely just logged in as the
// platform admin. Fixed by recording the bridged-for shell user alongside
// the session and forcing a fresh bridge whenever it no longer matches.
const BRIDGED_SHELL_USER_KEY = 'sv_backend_bridged_shell_user'

async function performBridgeLogin(): Promise<boolean> {
  const shellUser = getShellUser()
  const creds = SHELL_TO_BACKEND[shellUser] || FALLBACK
  try {
    const { accessToken, refreshToken, user } = await authApi.login(creds.email, creds.password)
    setBackendSession(accessToken, refreshToken, user)
    try {
      localStorage.setItem(BRIDGED_SHELL_USER_KEY, shellUser)
    } catch {
      /* non-fatal — worst case, the next check just re-bridges unnecessarily */
    }
    lastBridgeFailureWasConnectivity = false
    return true
  } catch (err) {
    lastBridgeFailureWasConnectivity = err instanceof ApiError && (err.network || err.status >= 500)
    return false
  }
}

function cachedSessionMatchesCurrentShellUser(): boolean {
  try {
    return localStorage.getItem(BRIDGED_SHELL_USER_KEY) === getShellUser()
  } catch {
    return false
  }
}

/**
 * Ensures a backend session exists for the CURRENT shell user, establishing
 * or replacing one as needed. Safe to call repeatedly — concurrent calls
 * share one in-flight login.
 *
 * `force: true` skips the "already cached and matches" shortcut and always
 * re-bridges against `getShellUser()` right now — used by the
 * role-forbidden recovery below, where a cache that CLAIMS to match could
 * itself be the stale thing (e.g. an already-mounted page whose one-time
 * bridge check ran before the user switched shell logins elsewhere and
 * never got a reason to re-check since).
 */
export async function ensureBackendSession(force = false): Promise<boolean> {
  if (!force && getAccessToken() && getBackendUser() && cachedSessionMatchesCurrentShellUser()) return true
  if (!bridgeInFlight) bridgeInFlight = performBridgeLogin().finally(() => (bridgeInFlight = null))
  return bridgeInFlight
}

// Re-bridges automatically the first time any API call comes back
// unauthorized even after a refresh attempt (client.ts's onUnauthorized
// hook) — e.g. the backend was restarted and every refresh token was
// invalidated. Registered once, at module load.
//
// Also re-bridges (forced) on a role_forbidden 403 (client.ts's
// onRoleForbidden hook) — the concrete fix for "logged in as roberto but
// Recruiting still says Requires role: RECRUITER or COMPANY_ADMIN": the
// bridge only ever checked itself once, on mount (useBackendSession's
// effect has no re-run trigger), so an already-open/already-mounted
// Recruiting page has no way to notice a LATER shell-login switch on its
// own. A role_forbidden response is the first concrete signal that
// whatever's cached might not match the CURRENT shell login anymore — this
// forces a fresh check right then, and client.ts retries the original
// request once if it succeeds, so the fix is transparent: no second click,
// no manual page reload required.
let unauthorizedHandlerRegistered = false
export function registerAuthBridgeRecovery(): void {
  if (unauthorizedHandlerRegistered) return
  unauthorizedHandlerRegistered = true
  onUnauthorized(() => {
    clearBackendSession()
    void ensureBackendSession()
  })
  onRoleForbidden(() => ensureBackendSession(true))
}
