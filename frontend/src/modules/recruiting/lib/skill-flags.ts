import { useSyncExternalStore } from 'react'

import { DEFAULT_FLAGS, DEFAULT_ROLE, ROLES, SKILL_FLAGS_KEY } from '@/modules/recruiting/lib/constants'
import { recruitingStore } from '@/modules/recruiting/lib/recruiting-store'
import type { SoftSkillLevel } from '@/modules/recruiting/lib/types'

// Il peso delle 35 competenze trasversali per la posizione in uso: 0 non
// richiesta, 1 utile, 2 importante, 3 essenziale. Il clic sul selettore li
// fa girare così: 1 clic essenziale, 2 importante, 3 utile, 4 non richiesta. Si salva sul server (SKILL_FLAGS_KEY, recruiting-store.ts) e si
// scrive sul posto in DEFAULT_FLAGS, che il resto del modulo già legge.

const listeners = new Set<() => void>()
let version = 0

function commit() {
  recruitingStore.setItem(SKILL_FLAGS_KEY, JSON.stringify(DEFAULT_FLAGS))
  version += 1
  listeners.forEach((l) => l())
}

const NEXT_FLAG: Record<number, number> = { 0: 3, 3: 2, 2: 1, 1: 0 }

export function cycleSkillFlag(skill: string): void {
  const next = NEXT_FLAG[DEFAULT_FLAGS[skill] ?? 0]
  if (next === 0) delete DEFAULT_FLAGS[skill]
  else DEFAULT_FLAGS[skill] = next as SoftSkillLevel
  commit()
}

// Torna ai pesi di partenza del profilo (cancella la scelta salvata).
export function resetSkillFlags(): void {
  Object.keys(DEFAULT_FLAGS).forEach((k) => delete DEFAULT_FLAGS[k])
  Object.assign(DEFAULT_FLAGS, ROLES[DEFAULT_ROLE].flags)
  recruitingStore.removeItem(SKILL_FLAGS_KEY)
  version += 1
  listeners.forEach((l) => l())
}

// I pesi salvati sul server sostituiscono quelli di partenza: si applicano
// quando i dati di Recruiting arrivano dal server e quando un collega li cambia.
export function applySavedSkillFlags(): void {
  Object.keys(DEFAULT_FLAGS).forEach((k) => delete DEFAULT_FLAGS[k])
  Object.assign(DEFAULT_FLAGS, ROLES[DEFAULT_ROLE].flags)
  try {
    const raw = recruitingStore.getItem(SKILL_FLAGS_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Record<string, number>
      Object.keys(DEFAULT_FLAGS).forEach((k) => delete DEFAULT_FLAGS[k])
      Object.entries(saved).forEach(([k, v]) => {
        if (v === 1 || v === 2 || v === 3) DEFAULT_FLAGS[k] = v
      })
    }
  } catch {
    // Dato illeggibile: restano i pesi di partenza.
  }
  version += 1
  listeners.forEach((l) => l())
}

// Si ridisegna a ogni cambio di peso; restituisce una copia dei pesi.
export function useSkillFlags(): Record<string, SoftSkillLevel> {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => version,
  )
  return { ...DEFAULT_FLAGS }
}
