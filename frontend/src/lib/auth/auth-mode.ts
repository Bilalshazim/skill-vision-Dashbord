// Fase 8 — come si entra nell'applicazione.
//  - 'legacy' (default): il guscio statico fa il login (index.html) e i
//    moduli leggono sessionStorage.sv_shell_auth; il ponte authBridge.ts
//    apre la sessione col backend. È il comportamento di oggi, invariato.
//  - 'backend': login React su /login contro POST /auth/login, token di
//    accesso solo in memoria, refresh token in cookie httpOnly, permessi dal
//    ruolo. Si accende con VITE_AUTH_MODE=backend (al momento della build).
// Il passaggio si prova su un ambiente separato prima della produzione:
// tornare indietro è togliere la variabile e rifare la build.
export type AuthMode = 'legacy' | 'backend'

export const AUTH_MODE: AuthMode = import.meta.env.VITE_AUTH_MODE === 'backend' ? 'backend' : 'legacy'

export const isBackendAuth = (): boolean => AUTH_MODE === 'backend'
