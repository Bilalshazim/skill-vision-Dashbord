// L'unico punto in cui il codice legge l'ambiente. Le variabili VITE_ sono di
// compilazione: Vite le scrive nel pacchetto servito al browser, quindi non
// sono segreti, e su Railway una modifica richiede un nuovo deploy. L'elenco
// commentato è in `.env.example`; un valore nuovo entra prima qui e lì.

const raw = import.meta.env

/** `npm run dev`: in sviluppo locale alcune funzioni sono sempre accese. */
export const IS_DEV = raw.DEV

const list = (value: string) =>
  value
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

export const env = {
  /** Base dell'API del backend. In locale il backend di sviluppo. */
  apiBaseUrl: raw.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
  /** Catalogo `/dev/components` anche nella build. */
  componentCatalog: IS_DEV || raw.VITE_ENABLE_COMPONENT_CATALOG === 'true',
  /** Versione demo: i dati dimostrativi e, per l'account demo, i suoi strumenti. */
  demoMode: IS_DEV || raw.VITE_DEMO_MODE === 'true',
  /** Gli account demo: email, minuscole. Vedono l'amministrazione dei dati dimostrativi. */
  demoAccounts: list(raw.VITE_DEMO_ACCOUNTS ?? 'demo@skill-vision.it'),
  /** Le società demo del backend. Nessuna in una build, se non è impostata: i dati dimostrativi non partono. In locale la Acme del seed. */
  demoCompanyIds: list(raw.VITE_DEMO_COMPANY_IDS ?? (IS_DEV ? '00000000-0000-0000-0000-000000000002' : '')),
  /** Email dello staff di Skill Vision, minuscole. */
  staffEmails: list(raw.VITE_STAFF_EMAILS ?? ''),
} as const
