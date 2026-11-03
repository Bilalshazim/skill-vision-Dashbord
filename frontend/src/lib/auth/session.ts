import { useSyncExternalStore } from 'react'

import { apiGet, buildApiUrl, clearBackendSession, getAccessToken, getBackendUser, onUnauthorized, refreshAccessToken, setBackendSession, setBackendUser, type BackendUser } from '@/lib/api/client'
import { loadPreferences, resetPreferences } from '@/lib/preferences'

// Fase 8, modalità `backend` — la sessione dell'utente. Il token di accesso
// vive in memoria (lib/api/client.ts); al ricaricamento della pagina si
// rinnova col cookie httpOnly, poi /auth/me dice chi è l'utente. Nessuna
// credenziale nel frontend, nessuna chiave scrivibile dalla console.
export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous'
type Snapshot = { status: SessionStatus; user: BackendUser | null }

let snapshot: Snapshot = { status: 'unknown', user: null }
const listeners = new Set<() => void>()
// Chi tiene dati in memoria (es. Recruiting) li svuota quando la sessione si
// chiude, così l'utente successivo nella stessa scheda non li vede.
const sessionEndCallbacks = new Set<() => void>()
export function onSessionEnd(cb: () => void): void {
  sessionEndCallbacks.add(cb)
}

function set(next: Snapshot) {
  const was = snapshot.status
  snapshot = next
  // Le preferenze dell'utente arrivano dal server quando la sessione si apre
  // e si azzerano quando si chiude (lib/preferences.ts).
  if (next.status === 'authenticated' && was !== 'authenticated') void loadPreferences()
  if (next.status === 'anonymous' && was === 'authenticated') {
    resetPreferences()
    for (const cb of sessionEndCallbacks) cb()
  }
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

// Un cambio di password, ruolo o stato fatto dall'amministratore chiude la
// sessione sul server (sessionVersion, backend middleware/auth.ts). Una pagina
// ferma non lo saprebbe fino alla prossima chiamata: ogni 30 secondi si chiede
// chi è l'utente, e un 401 fa uscire (onUnauthorized, in fondo al file).
const HEARTBEAT_MS = 30_000
let heartbeat: ReturnType<typeof setInterval> | null = null
function startHeartbeat() {
  if (heartbeat) return
  heartbeat = setInterval(() => {
    if (getAccessToken()) apiGet<BackendUser>('/auth/me').catch(() => undefined)
  }, HEARTBEAT_MS)
}
function stopHeartbeat() {
  if (heartbeat) clearInterval(heartbeat)
  heartbeat = null
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
        startHeartbeat()
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
  setBackendSession(data.accessToken, data.user)
  set({ status: 'authenticated', user: data.user })
  scheduleExpiry()
  startHeartbeat()
  return { ok: true, user: data.user }
}

export type SetOwnPasswordResult = { ok: true } | { ok: false; message: string }

/** L’utente sceglie la sua password (al primo accesso o quando vuole). Il
 *  server chiude le altre sessioni e restituisce token nuovi per questa. */
export async function setOwnPassword(currentPassword: string, newPassword: string): Promise<SetOwnPasswordResult> {
  let res: Response
  try {
    res = await fetch(buildApiUrl('/auth/me/password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  } catch {
    return { ok: false, message: 'Il server non risponde. Riprova fra poco.' }
  }
  if (res.status === 401) {
    void logout()
    return { ok: false, message: 'La sessione è scaduta: rientra con la password provvisoria.' }
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
    return { ok: false, message: body?.error?.message?.replace(/^w+: /, '') ?? 'Password non salvata. Riprova.' }
  }
  const data = (await res.json()) as { accessToken: string; user: BackendUser }
  setBackendSession(data.accessToken, data.user)
  set({ status: 'authenticated', user: data.user })
  scheduleExpiry()
  return { ok: true }
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
  stopHeartbeat()
  clearBackendSession()
  set({ status: 'anonymous', user: null })
}

// Una chiamata che resta non autorizzata anche dopo il rinnovo (sessione
// scaduta o revocata): si esce, e la guardia rimanda a /login.
onUnauthorized(() => void logout())
