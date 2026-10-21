/// <reference types="vite/client" />

// Le variabili d'ambiente lette dal frontend (src/lib/env.ts, .env.example).
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ENABLE_COMPONENT_CATALOG?: string
  readonly VITE_DEMO_MODE?: string
  readonly VITE_STAFF_EMAILS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
