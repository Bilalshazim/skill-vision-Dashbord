import { useCallback, useSyncExternalStore } from 'react'

import { apiGet, apiRequest } from '@/lib/api/client'

// Le preferenze dell'interfaccia dell'utente — tema, lingua, viste aperte,
// società scelta — stanno sul server (`/auth/me/preferences`), non nel
// browser (PROGETTO-TUTTO-SUL-SERVER.md, Parte 2). Si caricano quando la
// sessione si apre e si azzerano quando si esce; ogni modifica si salva poco
// dopo, unita alle altre in un solo PATCH. Prima dell'accesso (pagina di
// login, link pubblici) valgono i predefiniti.
type Prefs = Record<string, unknown>

let prefs: Prefs = {}
let version = 0
const listeners = new Set<() => void>()
const emit = () => {
  version++
  for (const l of listeners) l()
}

let pending: Prefs = {}
let timer: ReturnType<typeof setTimeout> | null = null
const SAVE_DELAY = 400

async function flush() {
  timer = null
  const body = pending
  pending = {}
  if (!Object.keys(body).length) return
  try {
    await apiRequest<Prefs>('/auth/me/preferences', { method: 'PATCH', body })
  } catch {
    // Una preferenza non salvata non blocca il lavoro: resta valida finché la
    // pagina è aperta e si riprova alla prossima modifica.
    pending = { ...body, ...pending }
  }
}

/** Alla sessione aperta: le preferenze salvate dall'utente. */
let loaded: Promise<void> | null = null

export function loadPreferences(): Promise<void> {
  loaded = (async () => {
    try {
      prefs = await apiGet<Prefs>('/auth/me/preferences')
    } catch {
      prefs = {}
    }
    emit()
  })()
  return loaded
}

/** Si risolve quando le preferenze dell'utente sono arrivate (subito se la sessione non è aperta). */
export function whenPreferencesLoaded(): Promise<void> {
  return loaded ?? Promise.resolve()
}

/** All'uscita: si torna ai predefiniti. */
export function resetPreferences(): void {
  loaded = null
  if (timer) clearTimeout(timer)
  timer = null
  pending = {}
  prefs = {}
  emit()
}

export function getPreference<T>(key: string, fallback: T): T {
  return key in prefs ? (prefs[key] as T) : fallback
}

export function setPreference(key: string, value: unknown): void {
  prefs = { ...prefs, [key]: value }
  pending[key] = value
  emit()
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => void flush(), SAVE_DELAY)
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Una preferenza come stato React: cambia ovunque è letta, e si salva sul server. */
export function usePreference<T>(key: string, fallback: T): [T, (value: T) => void] {
  useSyncExternalStore(subscribe, () => version)
  const set = useCallback((value: T) => setPreference(key, value), [key])
  return [getPreference(key, fallback), set]
}
