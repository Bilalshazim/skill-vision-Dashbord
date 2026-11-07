import { useSyncExternalStore } from 'react'

import { DEFAULT_EXPECTED, DEFAULT_FLAGS, SKILL_FLAGS_KEY } from '@/modules/recruiting/lib/constants'
import { getActiveOpening } from '@/modules/recruiting/lib/pipeline'
import { recruitingStore } from '@/modules/recruiting/lib/recruiting-store'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'
import type { SoftSkillLevel } from '@/modules/recruiting/lib/types'

// Le competenze trasversali di ogni posizione (Decisioni del 2026-11-06: «ogni ricerca ha
// la sua configurazione, che cambia con la posizione»): per ognuna il peso, 1 utile, 2
// importante, 3 essenziale, e il valore atteso da 1 a 10. Si scelgono solo nella pagina
// Competenze trasversali. Sul server stanno in un documento solo (SKILL_FLAGS_KEY), una voce
// per posizione; quelli della posizione attiva si scrivono sul posto in DEFAULT_FLAGS e
// DEFAULT_EXPECTED, che punteggi e classifiche già leggono. Una posizione senza
// configurazione parte vuota. Il vecchio documento, un profilo unico per tutte, non si legge
// più e resta sul server finché nessuno salva.

export type SkillConfig = { flags: Record<string, SoftSkillLevel>; expected: Record<string, number> }
type Doc = { positions: Record<string, SkillConfig> }

const listeners = new Set<() => void>()
let version = 0
const notify = () => {
  version += 1
  listeners.forEach((l) => l())
}

function readDoc(): Doc {
  try {
    const raw = recruitingStore.getItem(SKILL_FLAGS_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<Doc>) : null
    if (parsed?.positions && typeof parsed.positions === 'object') return { positions: parsed.positions }
  } catch {
    // Dato illeggibile: si riparte da vuoto.
  }
  return { positions: {} }
}

const activeId = () => getActiveOpening(readCvMatchingState()).opening?.id ?? null

function writeActive(next: SkillConfig) {
  const id = activeId()
  if (!id) return
  const doc = readDoc()
  recruitingStore.setItem(SKILL_FLAGS_KEY, JSON.stringify({ positions: { ...doc.positions, [id]: next } }))
  applySavedSkillFlags()
}

const current = (): SkillConfig => ({ flags: { ...DEFAULT_FLAGS }, expected: { ...DEFAULT_EXPECTED } })

/** Il peso di una competenza sulla posizione attiva. 0: non richiesta, e l'atteso se ne va con lei. */
export function setSkillLevel(skill: string, level: SoftSkillLevel | 0): void {
  const next = current()
  if (level === 0) {
    delete next.flags[skill]
    delete next.expected[skill]
  } else next.flags[skill] = level
  writeActive(next)
}

/** Il valore atteso, da 1 a 10. `null`: si torna alla soglia del peso. */
export function setSkillExpected(skill: string, value: number | null): void {
  const next = current()
  if (value == null) delete next.expected[skill]
  else next.expected[skill] = Math.min(10, Math.max(1, value))
  writeActive(next)
}

/** Toglie tutte le scelte della posizione attiva. */
export function resetSkillFlags(): void {
  writeActive({ flags: {}, expected: {} })
}

export function hasSkillConfig(openingId: string): boolean {
  return !!readDoc().positions[openingId]
}

/** La configurazione di una posizione qualsiasi: per i dati dimostrativi. */
export function saveSkillConfig(openingId: string, config: SkillConfig): void {
  const doc = readDoc()
  recruitingStore.setItem(SKILL_FLAGS_KEY, JSON.stringify({ positions: { ...doc.positions, [openingId]: config } }))
}

/**
 * Mette in memoria la configurazione della posizione attiva: quando i dati arrivano dal
 * server, quando un collega li cambia e quando si cambia posizione. `true` se è cambiato
 * qualcosa: le pagine che leggono i punteggi vanno ridisegnate.
 */
export function applySavedSkillFlags(): boolean {
  const id = activeId()
  const saved = id ? readDoc().positions[id] : undefined
  const before = JSON.stringify(current())
  Object.keys(DEFAULT_FLAGS).forEach((k) => delete DEFAULT_FLAGS[k])
  Object.keys(DEFAULT_EXPECTED).forEach((k) => delete DEFAULT_EXPECTED[k])
  Object.entries(saved?.flags ?? {}).forEach(([k, v]) => {
    if (v === 1 || v === 2 || v === 3) DEFAULT_FLAGS[k] = v
  })
  Object.entries(saved?.expected ?? {}).forEach(([k, v]) => {
    if (typeof v === 'number') DEFAULT_EXPECTED[k] = v
  })
  const changed = JSON.stringify(current()) !== before
  notify()
  return changed
}

function useVersion() {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => version,
  )
}

// Si ridisegna a ogni cambio di peso; restituisce una copia dei pesi.
export function useSkillFlags(): Record<string, SoftSkillLevel> {
  useVersion()
  return { ...DEFAULT_FLAGS }
}

export function useSkillExpected(): Record<string, number> {
  useVersion()
  return { ...DEFAULT_EXPECTED }
}
