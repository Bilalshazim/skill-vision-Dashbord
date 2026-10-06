// Fase 8 — crea un account per il gruppo di lavoro o per la società demo.
// Senza --role crea un PLATFORM_ADMIN (uso originale: uno per Alessio, uno
// per Bilal, uno per Roberto). Con --role e --company-id crea un account
// legato a una società (es. demo@skill-vision.it, COMPANY_ADMIN sulla sola
// società demo). Gli account del CLIENTE (le società reali) NON si creano
// qui: si concordano con il cliente (CLAUDE.md, Fase 8).
//
// La password non passa mai da codice, Git, argomenti o cronologia:
//  - di default lo script la chiede al terminale, senza mostrarla, due volte;
//  - con --generate ne genera una casuale e la mostra UNA volta sola, da
//    consegnare a voce o con un gestore di password, mai per email in chiaro.
// Nel database va solo l'hash bcrypt.
//
// Uso (da backend/):
//   npx tsx scripts/create-team-admin.ts --email nome@dominio --name "Nome Cognome"            # anteprima, PLATFORM_ADMIN
//   npx tsx scripts/create-team-admin.ts --email nome@dominio --name "Nome Cognome" --apply    # crea
//   … --role COMPANY_ADMIN --company-id <id società>   # account legato a una società, non PLATFORM_ADMIN
//   … --apply --generate          # crea con una password generata
//   … --apply --reset-password    # account già esistente: nuova password, sessioni revocate
//
// --role accetta PLATFORM_ADMIN (default, senza società), COMPANY_ADMIN,
// RECRUITER, EVALUATOR, READONLY (richiedono --company-id). Lo script non
// crea società: --company-id deve essere l'id di una società già esistente.
//
// Database: DATABASE_URL della singola esecuzione. Su Railway l'indirizzo
// interno non è raggiungibile dal computer: usare quello pubblico del
// servizio Postgres, passato solo al comando, oppure lanciare lo script dalla
// shell del servizio Backend (`railway ssh`). Mai scriverlo in un file.
import { randomBytes } from 'node:crypto'
import { stdin, stdout } from 'node:process'

import { PrismaClient, type UserRole } from '@prisma/client'

import { hashPassword } from '../src/lib/password.js'

const VALID_ROLES: UserRole[] = ['PLATFORM_ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'EVALUATOR', 'READONLY']
const MIN_LENGTH = 14
// Le password pubbliche del seed e del ponte: mai riusabili.
const FORBIDDEN = ['admin123', 'acme123', 'password', 'skillvision']

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const has = (name: string) => process.argv.includes(name)

function redactDatabaseUrl(url: string | undefined): string {
  if (!url) return '(non impostato)'
  try {
    const u = new URL(url)
    return `${u.protocol}//${u.host}${u.pathname}`
  } catch {
    return '(non leggibile)'
  }
}

// Legge una riga dal terminale senza mostrarla.
function promptHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY) return reject(new Error('Nessun terminale interattivo: usa --generate oppure lancia lo script da un terminale.'))
    stdout.write(question)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    let value = ''
    const onData = (ch: string) => {
      if (ch === '\r' || ch === '\n' || ch === '\u0004') {
        stdin.setRawMode(false)
        stdin.pause()
        stdin.off('data', onData)
        stdout.write('\n')
        resolve(value)
      } else if (ch === '\u0003') {
        stdin.setRawMode(false)
        process.exit(130)
      } else if (ch === '\u007f' || ch === '\b') {
        value = value.slice(0, -1)
      } else {
        value += ch
      }
    }
    stdin.on('data', onData)
  })
}

function validatePassword(pw: string): string | null {
  if (pw.length < MIN_LENGTH) return `La password deve avere almeno ${MIN_LENGTH} caratteri.`
  if (FORBIDDEN.some((f) => pw.toLowerCase().includes(f))) return 'La password contiene una parola già pubblica (seed o ponte del guscio).'
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) return 'Servono almeno una minuscola, una maiuscola e una cifra.'
  return null
}

function generatePassword(): string {
  // 24 caratteri da un alfabeto senza simboli ambigui (0/O, 1/l/I).
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_.'
  let out = ''
  while (validatePassword(out) !== null || out.length < 24) {
    out = Array.from(randomBytes(24), (b) => alphabet[b % alphabet.length]).join('')
  }
  return out
}

async function main() {
  const email = arg('--email')?.trim().toLowerCase()
  const fullName = arg('--name')?.trim()
  const apply = has('--apply')
  const reset = has('--reset-password')
  const role = (arg('--role')?.trim().toUpperCase() ?? 'PLATFORM_ADMIN') as UserRole
  const companyId = arg('--company-id')?.trim()
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !fullName) {
    console.error('Uso: npx tsx scripts/create-team-admin.ts --email nome@dominio --name "Nome Cognome" [--role RUOLO] [--company-id id] [--apply] [--generate] [--reset-password]')
    process.exitCode = 1
    return
  }
  if (!VALID_ROLES.includes(role)) {
    console.error(`Ruolo non valido: ${role}. Validi: ${VALID_ROLES.join(', ')}.`)
    process.exitCode = 1
    return
  }
  if (role === 'PLATFORM_ADMIN' && companyId) {
    console.error('PLATFORM_ADMIN non ha società: non passare --company-id.')
    process.exitCode = 1
    return
  }
  if (role !== 'PLATFORM_ADMIN' && !companyId) {
    console.error(`Il ruolo ${role} richiede --company-id (l'id di una società già esistente).`)
    process.exitCode = 1
    return
  }

  const prisma = new PrismaClient()
  try {
    console.log(`Database: ${redactDatabaseUrl(process.env.DATABASE_URL)}`)
    console.log(`Modalità: ${apply ? 'SCRITTURA' : 'ANTEPRIMA (nessuna scrittura: aggiungi --apply)'}\n`)

    let company: { id: string; name: string } | null = null
    if (companyId) {
      company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true } })
      if (!company) {
        console.error(`Nessuna società con id ${companyId}. Lo script non crea società.`)
        process.exitCode = 1
        return
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing && (existing.role !== role || existing.companyId !== (companyId ?? null))) {
      console.error(`Esiste già ${email} con ruolo ${existing.role}${existing.companyId ? ` (società ${existing.companyId})` : ''}: lo script non cambia ruolo o società. Interrompo.`)
      process.exitCode = 1
      return
    }
    if (existing && !reset) {
      console.error(`${email} esiste già (${role}, ${existing.status}). Per una nuova password: --reset-password.`)
      process.exitCode = 1
      return
    }
    console.log(
      existing
        ? `Account esistente: nuova password per ${email}, sessioni aperte revocate.`
        : `Nuovo account ${role}: ${fullName} <${email}>${company ? `, società «${company.name}»` : ', senza società'}.`,
    )
    if (!apply) return

    let password: string
    if (has('--generate')) {
      password = generatePassword()
    } else {
      password = await promptHidden('Password (non viene mostrata): ')
      const problem = validatePassword(password)
      if (problem) {
        console.error(problem)
        process.exitCode = 1
        return
      }
      if ((await promptHidden('Ripeti la password: ')) !== password) {
        console.error('Le due password non coincidono.')
        process.exitCode = 1
        return
      }
    }

    const passwordHash = await hashPassword(password)
    const user = existing
      ? await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, status: 'ACTIVE' } })
      : await prisma.user.create({ data: { email, fullName, role, companyId: companyId ?? null, passwordHash } })
    if (existing) await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } })
    await prisma.auditLog.create({
      data: {
        action: existing ? 'provisioned_account.password_reset' : 'provisioned_account.created',
        entityType: 'User',
        entityId: user.id,
        metadata: { email, role, companyId: companyId ?? null, via: 'scripts/create-team-admin.ts' },
      },
    })

    console.log(`\nFatto: ${email} (${user.id}).`)
    if (has('--generate')) {
      console.log('\nPassword generata, mostrata solo ora. Consegnala a voce o con un gestore di password, poi pulisci il terminale:')
      console.log(`\n    ${password}\n`)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exitCode = 1
})
