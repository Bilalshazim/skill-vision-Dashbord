// Phase 31 §2 — the ONE shared HTTP boundary for the Recruiting backend
// (Phase 30, /Users/bilal/Desktop/Skill-Vision-React/backend). Every
// request the Recruiting frontend makes to the new API goes through here:
// base URL, bearer-token attachment, refresh-on-401, JSON/multipart
// handling, and a single typed error shape. No component or lib file may
// call `fetch()` directly against the backend — see api/index.ts for the
// per-domain functions built on top of this file.
//
// Token storage is deliberately namespaced away from the legacy shell's own
// sessionStorage keys (sv_shell_auth/sv_shell_user, see
// modules/assessment/lib/shell-bridge.ts) — this is a SEPARATE session the
// backend knows about, bridged from the shell session by lib/api/authBridge.ts,
// not a replacement for it. See authBridge.ts for exactly how the two co-exist.

const DEFAULT_BASE_URL = 'http://localhost:4000/api/v1'

export function apiBaseUrl(): string {
  const fromEnv = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL
  return fromEnv || DEFAULT_BASE_URL
}

const ACCESS_TOKEN_KEY = 'sv_backend_access_token'
const REFRESH_TOKEN_KEY = 'sv_backend_refresh_token'
const USER_KEY = 'sv_backend_user'

export type BackendUser = { id: string; email: string; fullName: string; role: string; companyId: string | null }

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}
export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}
export function getBackendUser(): BackendUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as BackendUser) : null
  } catch {
    return null
  }
}
export function setBackendSession(accessToken: string, refreshToken: string, user: BackendUser): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    /* storage unavailable — the caller's request will simply fail auth and surface an error */
  }
}
export function setBackendAccessToken(accessToken: string): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  } catch {
    /* ignore */
  }
}
export function clearBackendSession(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  status: number
  code?: string
  /** true when the request never reached the server (offline, DNS, CORS, connection refused) — §16. */
  network: boolean
  constructor(message: string, status: number, code?: string, network = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.network = network
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  /** multipart/form-data body — mutually exclusive with `body` */
  form?: FormData
  query?: Record<string, string | number | undefined | null>
  /** Skip the Authorization header entirely (login only). */
  anonymous?: boolean
  /** Extra headers — e.g. X-Evaluator-Token for the accountless evaluator path (OD-9). */
  headers?: Record<string, string>
  /** Internal — prevents infinite refresh loops. */
  _retried?: boolean
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(apiBaseUrl().replace(/\/$/, '') + path)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

let refreshInFlight: Promise<boolean> | null = null

// Refresh is idempotent-safe under concurrent 401s: every caller awaits the
// SAME in-flight refresh promise instead of each firing its own
// POST /auth/refresh (which would race to rotate/revoke tokens).
async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(buildUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        if (!res.ok) return false
        const data = (await res.json()) as { accessToken: string }
        setBackendAccessToken(data.accessToken)
        return true
      } catch {
        return false
      } finally {
        refreshInFlight = null
      }
    })()
  }
  return refreshInFlight
}

// Fired whenever a request fails auth even after a refresh attempt — lets
// the auth bridge re-establish a session (§3) instead of every call site
// having to know what "unauthorized" should do next.
type UnauthorizedListener = () => void
const unauthorizedListeners = new Set<UnauthorizedListener>()
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

// Fired on a 403 specifically coded 'role_forbidden' (see backend
// RoleForbiddenError, middleware/auth.ts's requireRole) — the JWT
// authenticates fine but its role isn't allowed here. Distinct from a
// generic 'forbidden' (e.g. requireCompanyScope's company mismatch),
// which must NEVER trigger this: re-bridging as the same shell user would
// hit the exact same company boundary again. A role mismatch, by
// contrast, is exactly what a STALE dev/authBridge session looks like — a
// role_forbidden 403 in what the user believes is now a RECRUITER/
// COMPANY_ADMIN session almost certainly means the bridged session
// predates a later shell-login switch. The listener re-establishes the
// bridge against the CURRENT shell login and reports whether that
// actually changed anything worth retrying for; returning a boolean
// (unlike onUnauthorized's void) lets apiRequest retry the ORIGINAL
// request once, in place, rather than only fixing things for next time.
type RoleForbiddenListener = () => Promise<boolean>
const roleForbiddenListeners = new Set<RoleForbiddenListener>()
export function onRoleForbidden(listener: RoleForbiddenListener): () => void {
  roleForbiddenListeners.add(listener)
  return () => roleForbiddenListeners.delete(listener)
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { ...options.headers }
  if (!options.form) headers['Content-Type'] = 'application/json'
  if (!options.anonymous && !headers['X-Evaluator-Token']) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(buildUrl(path, options.query), {
      method: options.method || 'GET',
      headers,
      body: options.form ? options.form : options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch (err) {
    // The backend is unreachable — §16 "backend unavailable". Never
    // silently treated as success; the caller decides how to show this.
    throw new ApiError(err instanceof Error ? err.message : 'Impossibile contattare il server', 0, 'NETWORK_ERROR', true)
  }

  if (res.status === 401 && !options.anonymous && !options._retried) {
    const refreshed = await tryRefresh()
    if (refreshed) return apiRequest<T>(path, { ...options, _retried: true })
    for (const listener of unauthorizedListeners) listener()
  }

  if (res.status === 204) return undefined as T

  let payload: unknown = undefined
  const text = await res.text()
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      /* non-JSON body — fall through, payload stays undefined */
    }
  }

  const errShape = payload as { error?: { code?: string; message?: string } } | undefined

  if (res.status === 403 && errShape?.error?.code === 'role_forbidden' && !options.anonymous && !options._retried) {
    let recovered = false
    for (const listener of roleForbiddenListeners) {
      if (await listener()) recovered = true
    }
    if (recovered) return apiRequest<T>(path, { ...options, _retried: true })
  }

  if (!res.ok) {
    const message = errShape?.error?.message || res.statusText || `Richiesta fallita (${res.status})`
    throw new ApiError(message, res.status, errShape?.error?.code)
  }

  return payload as T
}

export function apiGet<T>(path: string, query?: RequestOptions['query']): Promise<T> {
  return apiRequest<T>(path, { method: 'GET', query })
}
/** `evaluatorToken`, when given, sends X-Evaluator-Token instead of the bearer JWT (OD-9's accountless path). */
export function apiPost<T>(path: string, body?: unknown, evaluatorToken?: string): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body, headers: evaluatorToken ? { 'X-Evaluator-Token': evaluatorToken } : undefined })
}
export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'PATCH', body })
}
export function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE' })
}
export function apiUpload<T>(path: string, form: FormData): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', form })
}
export function apiPostAnonymous<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body, anonymous: true })
}
