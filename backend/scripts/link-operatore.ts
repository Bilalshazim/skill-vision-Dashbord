// One-off data fix: links operatore@skill-vision.it to a specific Company
// and ensures that Company's purchasedModules includes RECRUITING and
// ASSESSMENT. NOT wired into app startup on purpose — see the usage note
// below. Idempotent and safe to re-run: the company lookup is keyed by the
// exact id given (never guessed/generated), and purchasedModules is
// MERGED, never replaced, so any other module already purchased survives.
//
// Usage (from backend/):
//   npx tsx scripts/link-operatore.ts                # preview only — writes nothing
//   npx tsx scripts/link-operatore.ts --apply         # actually writes
//
// Point it at the right database by setting DATABASE_URL for this one
// invocation, e.g.:
//   DATABASE_URL="<production connection string>" npx tsx scripts/link-operatore.ts --apply
// Never hardcode a production DATABASE_URL in this file or commit one
// anywhere in this repo — pass it as an env var on the command line so it
// never lands in shell history-independent source control.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const COMPANY_ID = 'fc439495-2928-4ea3-b21b-c16a2b84f2b2'
const COMPANY_NAME = 'Acme Corp'
const REQUIRED_MODULES = ['RECRUITING', 'ASSESSMENT'] as const
const OPERATORE_EMAIL = 'operatore@skill-vision.it'

function redactDatabaseUrl(url: string | undefined): string {
  if (!url) return '(unset)'
  try {
    const u = new URL(url)
    return `${u.protocol}//${u.username ? u.username + '@' : ''}${u.host}${u.pathname}`
  } catch {
    return '(unparseable)'
  }
}

async function main() {
  const apply = process.argv.includes('--apply')
  console.log(`Target database: ${redactDatabaseUrl(process.env.DATABASE_URL)}`)
  console.log(`Mode: ${apply ? 'APPLY (will write)' : 'DRY RUN (no writes — pass --apply to write)'}\n`)

  const existingCompany = await prisma.company.findUnique({ where: { id: COMPANY_ID } })
  const mergedModules = Array.from(new Set([...(existingCompany?.purchasedModules ?? []), ...REQUIRED_MODULES]))

  if (!existingCompany) {
    console.log(`Company ${COMPANY_ID} does not exist yet — would create it as "${COMPANY_NAME}" with purchasedModules=${JSON.stringify(mergedModules)}.`)
  } else {
    console.log(
      `Company ${COMPANY_ID} ("${existingCompany.name}") found. purchasedModules: ${JSON.stringify(existingCompany.purchasedModules)} -> ${JSON.stringify(mergedModules)}`,
    )
    if (existingCompany.name !== COMPANY_NAME) {
      console.warn(`WARNING: existing company name ("${existingCompany.name}") does not match expected "${COMPANY_NAME}" — double-check COMPANY_ID is correct before applying.`)
    }
  }

  const operatore = await prisma.user.findUnique({ where: { email: OPERATORE_EMAIL } })
  if (!operatore) {
    console.error(`No user found with email ${OPERATORE_EMAIL} in this database — nothing to link. Aborting.`)
    process.exitCode = 1
    await prisma.$disconnect()
    return
  }
  console.log(`User ${OPERATORE_EMAIL} found (id=${operatore.id}, role=${operatore.role}). companyId: ${operatore.companyId ?? 'null'} -> ${COMPANY_ID}`)

  if (!apply) {
    console.log('\nDry run complete — no changes written. Re-run with --apply to write these changes.')
    await prisma.$disconnect()
    return
  }

  const company = await prisma.company.upsert({
    where: { id: COMPANY_ID },
    update: { purchasedModules: mergedModules },
    create: { id: COMPANY_ID, name: COMPANY_NAME, purchasedModules: mergedModules },
  })
  await prisma.user.update({ where: { id: operatore.id }, data: { companyId: company.id } })

  console.log(`\nSuccess: ${OPERATORE_EMAIL} is now linked to Company "${company.name}" (${company.id}) with purchasedModules=${JSON.stringify(company.purchasedModules)}.`)
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('FAILED:', err)
  await prisma.$disconnect()
  process.exit(1)
})
