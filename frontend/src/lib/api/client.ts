// Phase 31 §2 — the ONE shared HTTP boundary for the Recruiting backend
// (Phase 30, /Users/bilal/Desktop/Skill-Vision-React/backend). Every
// request the Recruiting frontend makes to the new API goes through here:
// base URL, bearer-token attachment, refresh-on-401, JSON/multipart
// handling, and a single typed error shape. No component or lib file may
// call `fetch()` directly against the backend — see api/index.ts for the
// per-domain functions built on top of this file.
//
// La sessione è quella del login React (lib/auth/session.ts); qui solo il
// token in memoria.

import { env } from '@/lib/env'

export function apiBaseUrl(): string {
  return env.apiBaseUrl
}

// Un link del server ("/api/v1/…/file?token=…") come indirizzo assoluto da
// aprire in una scheda. La base può essere relativa (`/api/v1`, stessa
// origine, in modalità backend): si risolve prima sulla pagina, altrimenti
// `new URL(path, '/api/v1')` lancia un errore.
export function apiFileUrl(path: string): string {
  return new URL(path, new URL(apiBaseUrl(), window.location.origin)).toString()
}

export type BackendUser = { id: string; email: string; fullName: string; role: string; companyId: string | null }

// Fase 8: il token di accesso e l'utente stanno solo in memoria — mai
// nell'archivio del browser, che uno script può leggere — e il refresh token
// non passa mai da JavaScript: è un cookie httpOnly che il server imposta e
// legge. Ricaricando la pagina si rinnova col cookie (lib/auth/session.ts).
let memoryAccessToken: string | null = null
let memoryUser: BackendUser | null = null

export function getAccessToken(): string | null {
  return memoryAccessToken
}
export function getBackendUser(): BackendUser | null {
  return memoryUser
}
export function setBackendSession(accessToken: string, user: BackendUser): void {
  memoryAccessToken = accessToken
  memoryUser = user
}
export function setBackendAccessToken(accessToken: string): void {
  memoryAccessToken = accessToken
}
export function setBackendUser(user: BackendUser | null): void {
  memoryUser = user
}
export function clearBackendSession(): void {
  memoryAccessToken = null
  memoryUser = null
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
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
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
  // La base può essere relativa (`/api/v1`, modalità `backend`: l'API passa
  // dal server del frontend, stessa origine del cookie).
  const url = new URL(apiBaseUrl().replace(/\/$/, '') + path, window.location.origin)
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
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        // Il refresh token è il cookie httpOnly: il corpo è vuoto e il browser
        // manda il cookie da solo; il server lo ruota con un cookie nuovo.
        const res = await fetch(buildUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: '{}',
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
// the session close (lib/auth/session.ts) instead of every call site
// having to know what "unauthorized" should do next.
type UnauthorizedListener = () => void
const unauthorizedListeners = new Set<UnauthorizedListener>()
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { ...options.headers }
  if (!options.form) headers['Content-Type'] = 'application/json'
  if (!options.anonymous && !headers['X-Evaluator-Token']) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const targetUrl = buildUrl(path, options.query)
  let res: Response
  try {
    res = await fetch(targetUrl, {
      method: options.method || 'GET',
      headers,
      body: options.form ? options.form : options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch (err) {
    // The backend is unreachable — §16 "backend unavailable". Never
    // silently treated as success; the caller decides how to show this.
    // A raw `fetch()` throw (TypeError, typically "Failed to fetch") is
    // indistinguishable from JS alone between "wrong host" (e.g.
    // VITE_API_BASE_URL still pointing at localhost in a deployed build)
    // and a real CORS rejection — logging the exact URL this build
    // actually targeted is what makes that diagnosable from the browser
    // console instead of guessed at.
    console.error(`[apiRequest] fetch failed for ${options.method || 'GET'} ${targetUrl}`, err)
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
export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'PUT', body })
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
export function apiGetAnonymous<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET', anonymous: true })
}
export function apiPostAnonymous<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body, anonymous: true })
}

// Fase 8 — usato dalla sessione in modalità `backend` all'avvio: rinnova il
// token di accesso col cookie httpOnly (nessun token in JavaScript).
export function refreshAccessToken(): Promise<boolean> {
  return tryRefresh()
}

export { buildUrl as buildApiUrl }
