// L'unico punto in cui il codice legge l'ambiente. Le variabili VITE_ sono di
// compilazione: Vite le scrive nel pacchetto servito al browser, quindi non
// sono segreti, e su Railway una modifica richiede un nuovo deploy. L'elenco
// commentato è in `.env.example`; un valore nuovo entra prima qui e lì.

const raw = import.meta.env

/** `npm run dev`: in sviluppo locale alcune funzioni sono sempre accese. */
export const IS_DEV = raw.DEV

export const env = {
  /** Base dell'API del backend. In locale il backend di sviluppo. */
  apiBaseUrl: raw.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
  /** `backend`: login React sul backend; altrimenti il login del guscio legacy. */
  authMode: raw.VITE_AUTH_MODE === 'backend' ? 'backend' : 'legacy',
  /** Catalogo `/dev/components` anche nella build. */
  componentCatalog: IS_DEV || raw.VITE_ENABLE_COMPONENT_CATALOG === 'true',
  /** Versione demo: mostra "Reset demo". */
  demoMode: IS_DEV || raw.VITE_DEMO_MODE === 'true',
  /** Email dello staff di Skill Vision, minuscole. */
  staffEmails: (raw.VITE_STAFF_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
} as const
