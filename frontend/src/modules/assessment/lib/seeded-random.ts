// Numeri pseudo-casuali ripetibili per i dati illustrativi (Customer Care,
// andamento della Home): stesso seme, stessa sequenza, così i valori non
// cambiano a ogni caricamento. Non servono a nient'altro.

/** Hash FNV-1a di una stringa: il seme per persona. */
export function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Generatore mulberry32: restituisce numeri in [0, 1). */
export function seedRandom(seed: number): () => number {
  let t = seed
  return function () {
    t |= 0
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
