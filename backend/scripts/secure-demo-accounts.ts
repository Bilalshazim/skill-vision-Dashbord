// Fase 8 — chiude gli account le cui password sono pubbliche: scritte nel
// seed (prisma/seed.ts) e nel ponte del guscio legacy
// (frontend/src/lib/api/authBridge.ts), quindi leggibili da chiunque apra il
// repository o il JavaScript servito al browser.
//
// Cosa fa con --apply: stato DISABLED (il login è rifiutato), revoca di tutti
// i refresh token (le sessioni aperte non si rinnovano: /auth/refresh rifiuta
// gli account disattivati), una riga in AuditLog. Non cancella niente: i dati
// collegati (CV caricati, campagne, valutazioni) restano. Si annulla con
// --restore (stato ACTIVE; le sessioni revocate restano revocate).
//
// ORDINE OBBLIGATORIO. In modalità `legacy` il ponte del guscio entra nel
// backend proprio con questi account: disattivarli prima del passaggio a
// VITE_AUTH_MODE=backend blocca la verifica dei moduli e chiude l'app a tutti.
//   1. account del gruppo di lavoro (scripts/create-team-admin.ts)
//   2. frontend in modalità `backend` (PROPOSTA-AUTENTICAZIONE.md)
//   3. questo script con --apply --frontend-is-backend-mode
//
// Uso (da backend/):
//   npx tsx scripts/secure-demo-accounts.ts                                   # anteprima
//   npx tsx scripts/secure-demo-accounts.ts --apply --frontend-is-backend-mode
//   npx tsx scripts/secure-demo-accounts.ts --restore                         # annulla
import { PrismaClient } from '@prisma/client'

// Gli account con password pubblica. recruiter@acme.example ha la stessa
// password del seed di hr@acme.example; operatore usa una password che il
// ponte mette nel bundle (VITE_OPERATORE_BRIDGE_PASSWORD).
export const EXPOSED_ACCOUNTS = ['admin@skill-vision.it', 'hr@acme.example', 'recruiter@acme.example', 'operatore@skill-vision.it']

function redactDatabaseUrl(url: string | undefined): string {
  if (!url) return '(non impostato)'
  try {
    const u = new URL(url)
    return `${u.protocol}//${u.host}${u.pathname}`
  } catch {
    return '(non leggibile)'
  }
}

async function main() {
  const apply = process.argv.includes('--apply')
  const restore = process.argv.includes('--restore')
  const prisma = new PrismaClient()
  try {
    console.log(`Database: ${redactDatabaseUrl(process.env.DATABASE_URL)}`)
    console.log(`Modalità: ${restore ? 'RIPRISTINO' : apply ? 'SCRITTURA' : 'ANTEPRIMA (nessuna scrittura)'}\n`)

    const users = await prisma.user.findMany({
      where: { email: { in: EXPOSED_ACCOUNTS } },
      select: { id: true, email: true, role: true, status: true, lastLoginAt: true, _count: { select: { refreshTokens: { where: { revokedAt: null } } } } },
    })
    for (const email of EXPOSED_ACCOUNTS) {
      const u = users.find((x) => x.email === email)
      console.log(u ? `  ${email.padEnd(28)} ${u.role.padEnd(15)} ${u.status.padEnd(9)} sessioni attive: ${u._count.refreshTokens}` : `  ${email.padEnd(28)} (non esiste in questo database)`)
    }

    if (restore) {
      const r = await prisma.user.updateMany({ where: { email: { in: EXPOSED_ACCOUNTS }, status: 'DISABLED' }, data: { status: 'ACTIVE' } })
      for (const u of users) await prisma.auditLog.create({ data: { action: 'exposed_account.restored', entityType: 'User', entityId: u.id, metadata: { email: u.email } } })
      console.log(`\nRiattivati: ${r.count}. Le loro password restano quelle pubbliche: è un ripristino d'emergenza, non uno stato da tenere.`)
      return
    }

    // Mai chiudere fuori tutti: serve almeno un PLATFORM_ADMIN attivo fuori dall'elenco.
    const otherAdmins = await prisma.user.count({ where: { role: 'PLATFORM_ADMIN', status: 'ACTIVE', email: { notIn: EXPOSED_ACCOUNTS } } })
    console.log(`\nAltri PLATFORM_ADMIN attivi (gruppo di lavoro): ${otherAdmins}`)
    if (!apply) {
      console.log('\nAnteprima. Per scrivere: --apply --frontend-is-backend-mode (vedi l’ordine obbligatorio in testa al file).')
      return
    }
    if (otherAdmins === 0) {
      console.error('Nessun altro PLATFORM_ADMIN attivo: prima crea gli account del gruppo (scripts/create-team-admin.ts). Interrompo.')
      process.exitCode = 1
      return
    }
    if (!process.argv.includes('--frontend-is-backend-mode')) {
      console.error('Manca --frontend-is-backend-mode: in modalità legacy il ponte usa questi account e l’app si chiuderebbe a tutti. Interrompo.')
      process.exitCode = 1
      return
    }

    const now = new Date()
    for (const u of users) {
      await prisma.$transaction([
        prisma.user.update({ where: { id: u.id }, data: { status: 'DISABLED' } }),
        prisma.refreshToken.updateMany({ where: { userId: u.id, revokedAt: null }, data: { revokedAt: now } }),
        prisma.auditLog.create({ data: { action: 'exposed_account.disabled', entityType: 'User', entityId: u.id, metadata: { email: u.email, reason: 'password pubblica nel repository o nel bundle' } } }),
      ])
    }
    console.log(`\nDisattivati: ${users.length}. Login rifiutato, sessioni revocate. I token d'accesso già emessi scadono entro 15 minuti.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exitCode = 1
})
