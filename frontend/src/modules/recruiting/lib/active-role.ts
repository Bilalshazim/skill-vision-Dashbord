import { getActiveOpening } from '@/modules/recruiting/lib/pipeline'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'

// La posizione di cui si parla, per schede, annunci e protocollo di intervista: il titolo
// della posizione attiva, che è anche la chiave con cui si salvano (Decisioni del
// 2026-11-06: «il profilo è quello della posizione attiva»). Prima era un ruolo fisso per
// tutta Recruiting. Quanto salvato sotto il ruolo fisso resta nei documenti, sotto quel nome.
export function activeRole(): string {
  return getActiveOpening(readCvMatchingState()).opening?.title || 'Nessuna posizione'
}
