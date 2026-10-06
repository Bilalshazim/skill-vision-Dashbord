import { getBackendUser } from '@/lib/api/client'

// Chi lavora sulla piattaforma (non un cliente): lo staff vede contenuti che
// ai clienti e alla demo restano chiusi, come la pagina Metodo di Recruiting.
// Vale staff chi ha il ruolo PLATFORM_ADMIN sul backend, oppure chi ha
// l'indirizzo email in `VITE_STAFF_EMAILS` (elenco separato da virgole, messo
// sul servizio Railway al momento della build: nessun indirizzo nel codice).
// Nota: è un filtro d'interfaccia, non un controllo di sicurezza — i testi
// restano nel pacchetto servito al browser.
export function isPlatformStaff(): boolean {
  const user = getBackendUser()
  if (!user) return false
  if (user.role === 'PLATFORM_ADMIN') return true
  const list = ((import.meta.env.VITE_STAFF_EMAILS as string | undefined) ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(user.email.toLowerCase())
}
