import { useSyncExternalStore } from 'react'

import { buildApiUrl, clearBackendSession, getAccessToken, getBackendUser, refreshAccessToken, setBackendSession, setBackendUser, type BackendUser } from '@/lib/api/client'
import { loadPreferences, resetPreferences } from '@/lib/preferences'

// Fase 8, modalità `backend` — la sessione dell'utente. Il token di accesso
// vive in memoria (lib/api/client.ts); al ricaricamento della pagina si
// rinnova col cookie httpOnly, poi /auth/me dice chi è l'utente. Nessuna
// credenziale nel frontend, nessuna chiave scrivibile dalla console.
export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous'
type Snapshot = { status: SessionStatus; user: BackendUser | null }

let snapshot: Snapshot = { status: 'unknown', user: null }
const listeners = new Set<() => void>()
function set(next: Snapshot) {
  const was = snapshot.status
  snapshot = next
  // Le preferenze dell'utente arrivano dal server quando la sessione si apre
  // e si azzerano quando si chiude (lib/preferences.ts).
  if (next.status === 'authenticated' && was !== 'authenticated') void loadPreferences()
  if (next.status === 'anonymous' && was === 'authenticated') resetPreferences()
  for (const l of listeners) l()
}

export function useSession(): Snapshot {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => snapshot,
  )
}

// La sessione dura un tempo fisso dal login (backend: SESSION_TTL_HOURS, 3
// ore). Il token d'accesso scade insieme a lei, quindi alla sua scadenza si
// esce e si torna al login, anche se la pagina è ferma e non chiama l'API.
let expiryTimer: ReturnType<typeof setTimeout> | null = null
function scheduleExpiry() {
  if (expiryTimer) clearTimeout(expiryTimer)
  expiryTimer = null
  const token = getAccessToken()
  if (!token) return
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    if (exp) expiryTimer = setTimeout(() => void logout(), Math.max(0, exp * 1000 - Date.now()))
  } catch {
    /* token illeggibile: ci pensa il 401 alla prossima chiamata */
  }
}

let ensuring: Promise<boolean> | null = null

/** Apre (o conferma) la sessione: token in memoria, oppure rinnovo col cookie. */
export function ensureSession(): Promise<boolean> {
  if (getAccessToken() && getBackendUser()) {
    if (snapshot.status !== 'authenticated') set({ status: 'authenticated', user: getBackendUser() })
    return Promise.resolve(true)
  }
  if (!ensuring) {
    ensuring = (async () => {
      try {
        if (!(await refreshAccessToken())) {
          set({ status: 'anonymous', user: null })
          return false
        }
        const res = await fetch(buildApiUrl('/auth/me'), { headers: { Authorization: `Bearer ${getAccessToken()}` } })
        if (!res.ok) {
          clearBackendSession()
          set({ status: 'anonymous', user: null })
          return false
        }
        const user = (await res.json()) as BackendUser
        setBackendUser(user)
        set({ status: 'authenticated', user })
        scheduleExpiry()
        return true
      } catch {
        set({ status: 'anonymous', user: null })
        return false
      } finally {
        ensuring = null
      }
    })()
  }
  return ensuring
}

export type LoginResult =
  | { ok: true; user: BackendUser }
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'locked'; retryAfterSec: number }
  | { ok: false; reason: 'network' }

export async function login(email: string, password: string): Promise<LoginResult> {
  let res: Response
  try {
    res = await fetch(buildApiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
  } catch {
    return { ok: false, reason: 'network' }
  }
  if (res.status === 429) return { ok: false, reason: 'locked', retryAfterSec: Number(res.headers.get('retry-after')) || 900 }
  if (res.status === 401 || res.status === 400) return { ok: false, reason: 'invalid' }
  if (!res.ok) return { ok: false, reason: 'network' }
  const data = (await res.json()) as { accessToken: string; user: BackendUser }
  // Il refresh token del corpo si ignora: in questa modalità vale il cookie.
  setBackendSession(data.accessToken, '', data.user)
  set({ status: 'authenticated', user: data.user })
  scheduleExpiry()
  return { ok: true, user: data.user }
}

/** Esce: il server revoca il refresh token e cancella il cookie. */
export async function logout(): Promise<void> {
  try {
    await fetch(buildApiUrl('/auth/logout'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: '{}' })
  } catch {
    /* anche senza rete si esce dall'interfaccia; il token scade da solo */
  }
  if (expiryTimer) clearTimeout(expiryTimer)
  expiryTimer = null
  clearBackendSession()
  set({ status: 'anonymous', user: null })
}
