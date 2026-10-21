import { useSyncExternalStore } from 'react'

import { ApiError, apiRequest } from '@/lib/api/client'
import { onSessionEnd } from '@/lib/auth/session'
import { whenPreferencesLoaded } from '@/lib/preferences'

// Recruiting sul server (PROGETTO-TUTTO-SUL-SERVER.md, Parti 4–9). I dati che
// Recruiting teneva nel browser stanno sul server (backend/src/modules/
// recruitingStore), un documento per area, nella stessa forma di testo JSON.
// Qui ne vive solo una copia in memoria, per la pagina aperta: si carica
// all'ingresso in Recruiting, ogni modifica parte subito verso il server, e
// nel browser non si scrive niente.
//
// L'interfaccia è quella dell'archivio del browser (getItem / setItem /
// removeItem): lib/storage.ts e gli altri lettori non cambiano forma, e il
// comportamento delle schermate resta lo stesso.
//
// Tempo reale: ogni POLL_MS (e tornando sulla scheda) si chiedono al server le
// sole versioni; i documenti cambiati da un collega si scaricano e
// `useRecruitingRemoteVersion` cambia, così il guscio ridisegna la pagina.
// Un salvataggio su una versione vecchia riceve 409: si ricarica il documento
// del collega e si avvisa, invece di sovrascriverlo.

type Docs = Record<string, { data: string; version: number }>

const data = new Map<string, string>()
const versions = new Map<string, number>()
/** Modifiche non ancora confermate dal server: testo nuovo, o `null` per cancellare. */
const pending = new Map<string, string | null>()

export type StoreStatus = 'idle' | 'loading' | 'ready' | 'error'
let status: StoreStatus = 'idle'
let loadError: string | null = null
/** Il problema dell'ultimo salvataggio, finché il successivo non riesce. */
let saveProblem: string | null = null
let remoteVersion = 0
let snapshotVersion = 0

const listeners = new Set<() => void>()
function emit() {
  snapshotVersion++
  for (const l of listeners) l()
}

type Notice = (msg: string) => void
let notify: Notice = () => {}
/** Chi mostra gli avvisi (conflitti, server irraggiungibile): il guscio di Recruiting. */
export function setRecruitingNotice(fn: Notice) {
  notify = fn
}

const BASE = '/recruiting-store'
const POLL_MS = 10_000
const SAVE_DELAY = 250

function reason(err: unknown): string {
  if (err instanceof ApiError) return err.network || (err.status >= 502 && err.status <= 504) ? 'il server non risponde' : err.message
  return err instanceof Error ? err.message : String(err)
}

function applyDocs(docs: Docs, keys?: string[]) {
  for (const k of keys ?? Object.keys(docs)) {
    const d = docs[k]
    if (d) {
      data.set(k, d.data)
      versions.set(k, d.version)
    } else {
      data.delete(k)
      versions.delete(k)
    }
  }
}

// ---------- caricamento ----------

let loading: Promise<void> | null = null

/** Carica tutti i dati di Recruiting dal server (una volta per sessione). */
export function loadRecruitingStore(): Promise<void> {
  if (status === 'ready') return Promise.resolve()
  if (!loading) {
    status = 'loading'
    loadError = null
    emit()
    loading = (async () => {
      try {
        // Anche le preferenze dell'utente (società e posizione attive).
        const [docs] = await Promise.all([apiRequest<Docs>(BASE), whenPreferencesLoaded()])
        data.clear()
        versions.clear()
        applyDocs(docs)
        status = 'ready'
        startPolling()
      } catch (err) {
        status = 'error'
        loadError = reason(err)
      } finally {
        loading = null
        emit()
      }
    })()
  }
  return loading
}

/** All'uscita dalla sessione: niente resta in memoria per l'utente successivo. */
export function resetRecruitingStore() {
  stopPolling()
  data.clear()
  versions.clear()
  pending.clear()
  if (timer) clearTimeout(timer)
  timer = null
  status = 'idle'
  loadError = null
  saveProblem = null
  emit()
}

// ---------- lettura e scrittura (stessa interfaccia dell'archivio del browser) ----------

export const recruitingStore = {
  getItem(key: string): string | null {
    return data.get(key) ?? null
  },
  setItem(key: string, value: string): void {
    // Nessuna modifica vera: niente da mandare al server.
    if (data.get(key) === value && !pending.has(key)) return
    data.set(key, value)
    pending.set(key, value)
    scheduleSave()
  },
  removeItem(key: string): void {
    data.delete(key)
    pending.set(key, null)
    scheduleSave()
  },
}

// ---------- salvataggio ----------

let timer: ReturnType<typeof setTimeout> | null = null
let saving = false

function scheduleSave() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => void flush(), SAVE_DELAY)
}

async function reloadKey(key: string) {
  const docs = await apiRequest<Docs>(BASE, { query: { keys: key } })
  applyDocs(docs, [key])
}

async function flush() {
  timer = null
  if (saving) return
  saving = true
  try {
    while (pending.size) {
      const [key, value] = pending.entries().next().value as [string, string | null]
      pending.delete(key)
      const version = versions.get(key) ?? 0
      try {
        const res =
          value === null
            ? await apiRequest<{ version: number }>(`${BASE}/${encodeURIComponent(key)}`, { method: 'DELETE', query: { version } })
            : await apiRequest<{ version: number }>(`${BASE}/${encodeURIComponent(key)}`, { method: 'PUT', body: { data: value, version } })
        if (res.version) versions.set(key, res.version)
        else versions.delete(key)
        if (saveProblem) {
          saveProblem = null
          emit()
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          // Un collega ha salvato prima: vale la sua versione.
          pending.delete(key)
          await reloadKey(key).catch(() => undefined)
          remoteVersion++
          emit()
          notify('Un collega ha modificato questi dati nel frattempo: ora vedi la sua versione. Rifai l’ultima modifica.')
        } else {
          // Server irraggiungibile: la modifica resta in attesa (in memoria) e si riprova.
          if (!pending.has(key)) pending.set(key, value)
          saveProblem = `Modifiche non salvate: ${reason(err)}. Si riprova da solo; non chiudere la pagina.`
          emit()
          setTimeout(() => void flush(), 5_000)
          return
        }
      }
    }
  } finally {
    saving = false
  }
}

// ---------- tempo reale ----------

let pollTimer: ReturnType<typeof setInterval> | null = null

async function poll() {
  if (status !== 'ready' || saving || pending.size || timer || document.visibilityState !== 'visible') return
  try {
    const server = await apiRequest<Record<string, number>>(`${BASE}/versions`)
    const changed = Object.keys(server).filter((k) => versions.get(k) !== server[k])
    const removed = [...versions.keys()].filter((k) => !(k in server))
    if (!changed.length && !removed.length) return
    const docs = changed.length ? await apiRequest<Docs>(BASE, { query: { keys: changed.join(',') } }) : {}
    // Nel frattempo è partita una modifica locale: si aspetta il giro dopo.
    if (pending.size || saving) return
    applyDocs(docs, [...changed, ...removed])
    remoteVersion++
    emit()
  } catch {
    /* il prossimo giro riprova */
  }
}

function onReturn() {
  if (document.visibilityState === 'visible') void poll()
}

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(() => void poll(), POLL_MS)
  window.addEventListener('focus', onReturn)
  document.addEventListener('visibilitychange', onReturn)
  window.addEventListener('beforeunload', onUnload)
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
  window.removeEventListener('focus', onReturn)
  document.removeEventListener('visibilitychange', onReturn)
  window.removeEventListener('beforeunload', onUnload)
}

// Chiudere la pagina con modifiche non ancora sul server le perderebbe: il browser chiede conferma.
function onUnload(e: BeforeUnloadEvent) {
  if (pending.size || saving || timer) e.preventDefault()
}

// ---------- per React ----------

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useRecruitingStore() {
  useSyncExternalStore(subscribe, () => snapshotVersion)
  return { status, loadError, saveProblem, remoteVersion, retry: loadRecruitingStore }
}

// Sessione chiusa: niente resta in memoria per l'utente successivo.
onSessionEnd(resetRecruitingStore)

/** C'è già un documento sul server per questa area? */
export function serverHasDocument(key: string): boolean {
  return versions.has(key)
}

/** Si risolve quando tutte le modifiche in attesa sono sul server; fallisce se il server non risponde. */
export async function whenSaved(timeoutMs = 30_000): Promise<void> {
  const start = Date.now()
  while (pending.size || saving || timer) {
    if (saveProblem) throw new Error(saveProblem)
    if (Date.now() - start > timeoutMs) throw new Error('il server non ha confermato in tempo')
    await new Promise((r) => setTimeout(r, 200))
  }
}
