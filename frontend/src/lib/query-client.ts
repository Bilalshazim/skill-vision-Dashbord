import { QueryClient } from '@tanstack/react-query'

// Una sola cache per i dati del server (decisione 5 del 2026-10-14,
// PROGETTO-ASSESSMENT-SERVER.md §7). Le schermate lavorano sullo stato che
// ricevono e lo salvano esse stesse: niente ricarichi automatici al ritorno
// sulla finestra, che sovrascriverebbero una modifica in corso.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity, refetchOnWindowFocus: false, retry: 1 },
  },
})
