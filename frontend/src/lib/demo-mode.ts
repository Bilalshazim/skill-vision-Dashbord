// Siamo nella versione demo? (CLAUDE.md cap. 7, "Reset demo", deciso dal
// cliente il 2026-09-30: la voce esiste solo in demo.) Il prodotto non aveva
// un modo per saperlo; proposta in DECISIONI ("Come si riconosce la demo"):
// un'impostazione esplicita dell'ambiente, `VITE_DEMO_MODE=true`, messa solo
// sul servizio che fa da demo. In sviluppo locale vale sempre come demo.
export function isDemoMode(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'
}
