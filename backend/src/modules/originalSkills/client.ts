// Original Skills — lettura dall'API ExportData (PROPOSTA-ORIGINAL-SKILLS.md §3).
// Credenziali e codici azienda arrivano SOLO dall'ambiente del servizio
// Backend; non escono mai dal server, non si loggano, non tornano in nessuna
// risposta. Questo modulo legge e basta: niente viene salvato.

import { BadGatewayError, ServiceDisabledError } from '../../lib/errors.js'

export const MAX_RANGE_DAYS = 89 // l'API rifiuta 90 giorni o più
const TIMEOUT_MS = 15_000

export type OsConfig = {
  url: string
  authKey: string
  authCompany: string
  // chiave (companyId della piattaforma, o etichetta provvisoria) → codAzienda
  companies: { key: string; code: string }[]
}

// Letta a ogni richiesta, non all'avvio: cambiare una variabile su Railway
// non deve richiedere altro che il riavvio che Railway fa da sé.
export function readConfig(): OsConfig {
  if (process.env.ORIGINAL_SKILLS_ENABLED !== 'true') throw new ServiceDisabledError('Integrazione con il Comitato scientifico non attiva')
  const url = process.env.ORIGINAL_SKILLS_API_URL || ''
  const authKey = process.env.ORIGINAL_SKILLS_AUTH_KEY || ''
  const authCompany = process.env.ORIGINAL_SKILLS_AUTH_COMPANY || ''
  let companies: OsConfig['companies'] = []
  try {
    const map = JSON.parse(process.env.ORIGINAL_SKILLS_COMPANY_MAP || '{}') as Record<string, unknown>
    companies = Object.entries(map)
      .filter((e): e is [string, string] => typeof e[1] === 'string' && e[1].trim() !== '')
      .map(([key, code]) => ({ key, code: code.trim() }))
  } catch {
    companies = []
  }
  if (!url || !authKey || !authCompany || !companies.length) throw new ServiceDisabledError('Integrazione con il Comitato scientifico non configurata')
  return { url, authKey, authCompany, companies }
}

export async function fetchExport(cfg: OsConfig, from: string, to: string, codes: string[]): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(cfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authKey: cfg.authKey, authCompany: cfg.authCompany },
      body: JSON.stringify({ dataDa: from, dataA: to, lingua: 'IT', codAzienda: codes }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new BadGatewayError('Il Comitato scientifico non risponde')
  }
  if (!res.ok) throw new BadGatewayError(`Il Comitato scientifico ha risposto ${res.status}`)
  try {
    return await res.json()
  } catch {
    throw new BadGatewayError('Il Comitato scientifico ha restituito una risposta non leggibile')
  }
}
