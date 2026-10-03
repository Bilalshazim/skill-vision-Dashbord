// Fase 8 — limite ai tentativi, in memoria. Una finestra fissa per chiave:
// `max` colpi in `windowMs`, poi bloccato fino alla fine della finestra.
//
// In memoria vuol dire: vale per un'istanza del servizio e si azzera al
// riavvio. Con una sola istanza (oggi su Railway) basta; con più istanze
// serve un archivio condiviso (Redis o una tabella), stessa interfaccia.
export type Limiter = {
  /** Registra un colpo per `key`. `allowed: false` se la chiave era già oltre il limite. */
  hit(key: string, now?: number): { allowed: boolean; retryAfterSec: number }
  /** Solo lettura: la chiave è bloccata adesso? */
  blocked(key: string, now?: number): { blocked: boolean; retryAfterSec: number }
  reset(key: string): void
  /** Svuota tutto: solo per i test. */
  clear(): void
}

export function createLimiter({ max, windowMs }: { max: number; windowMs: number }): Limiter {
  const buckets = new Map<string, { count: number; resetAt: number }>()
  const live = (key: string, now: number) => {
    const b = buckets.get(key)
    if (b && b.resetAt <= now) {
      buckets.delete(key)
      return undefined
    }
    return b
  }
  // Pulizia periodica, così la mappa non cresce con chiavi vecchie.
  const sweep = setInterval(() => {
    const now = Date.now()
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
  }, windowMs)
  sweep.unref?.()

  return {
    hit(key, now = Date.now()) {
      const b = live(key, now)
      if (!b) {
        buckets.set(key, { count: 1, resetAt: now + windowMs })
        return { allowed: true, retryAfterSec: 0 }
      }
      b.count++
      const allowed = b.count <= max
      return { allowed, retryAfterSec: allowed ? 0 : Math.ceil((b.resetAt - now) / 1000) }
    },
    blocked(key, now = Date.now()) {
      const b = live(key, now)
      if (!b || b.count < max) return { blocked: false, retryAfterSec: 0 }
      return { blocked: true, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) }
    },
    reset(key) {
      buckets.delete(key)
    },
    clear() {
      buckets.clear()
    },
  }
}
