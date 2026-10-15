// PostgreSQL locale per lo sviluppo (README.md in questa cartella).
//
// Legge porta e nomi dei database da backend/.env e backend/.env.test, così
// il backend e i test si collegano senza cambiare niente. Accesso "trust":
// risponde solo su localhost e i dati sono di prova. I dati restano in
// ./data fra un avvio e l'altro; per ripartire da zero si cancella ./data a
// database spento.
import fs from 'node:fs'
import path from 'node:path'

import EmbeddedPostgres from 'embedded-postgres'

const here = import.meta.dirname
const backendDir = path.resolve(here, '..')

function databaseUrl(file) {
  const p = path.join(backendDir, file)
  if (!fs.existsSync(p)) return null
  const line = fs.readFileSync(p, 'utf8').split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL='))
  return line ? new URL(line.slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '')) : null
}

const urls = ['.env', '.env.test'].map(databaseUrl).filter(Boolean)
if (!urls.length) {
  console.error('Manca DATABASE_URL in backend/.env: copia backend/.env.example in backend/.env.')
  process.exit(1)
}
const first = urls[0]
for (const u of urls) {
  if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') {
    console.error(`DATABASE_URL punta a ${u.hostname}, non a localhost: questo database è solo locale.`)
    process.exit(1)
  }
}

const dataDir = path.join(here, 'data')
const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: decodeURIComponent(first.username) || 'postgres',
  password: decodeURIComponent(first.password) || 'local',
  port: Number(first.port || 5432),
  persistent: true,
  // UTF-8 come su Railway: su Windows initdb sceglierebbe WIN1252.
  initdbFlags: ['--auth-local=trust', '--auth-host=trust', '--encoding=UTF8', '--locale=C'],
})

if (!fs.existsSync(path.join(dataDir, 'PG_VERSION'))) await pg.initialise()
await pg.start()

for (const u of urls) {
  const name = u.pathname.replace(/^\//, '')
  try {
    await pg.createDatabase(name)
    console.log(`database creato: ${name}`)
  } catch {
    console.log(`database presente: ${name}`)
  }
}
console.log(`PostgreSQL locale pronto su localhost:${first.port || 5432}. Ctrl+C per fermarlo.`)

const stop = async () => {
  await pg.stop()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
setInterval(() => {}, 1 << 30)
