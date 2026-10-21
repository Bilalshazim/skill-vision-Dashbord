#!/usr/bin/env node
// Nessun dato nel browser (PROGETTO-TUTTO-SUL-SERVER.md): fallisce se nel
// codice del frontend compare un accesso a localStorage, sessionStorage o
// IndexedDB fuori dagli unici file ammessi, che lo svuotano e basta.
//
//   node scripts/audit-storage.mjs
//
// Da lanciare con l'audit d'identità, a ogni fase e in CI.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..', 'frontend', 'src')

// Ammessi, con il motivo. Leggono le chiavi delle versioni precedenti solo
// per portarle sul server o per cancellarle; non scrivono mai.
const ALLOWED = {
  'lib/browser-cleanup.ts': 'cancella all’avvio le chiavi vecchie delle preferenze',
  'modules/assessment/lib/browser-import.ts': 'import una tantum dei dati di Assessment, poi li cancella',
  'modules/recruiting/lib/browser-import.ts': 'import una tantum dei dati di Recruiting, poi li cancella',
  // Da decidere con Roberto (scheda 5P come link online): il file che il
  // valutatore apre salva le risposte nel suo browser.
  'modules/assessment/gestione5p/scheda-valutatore.template.html': 'scheda 5P del valutatore, in attesa di decisione',
}

const PATTERN = /\b(localStorage|sessionStorage|indexedDB)\b/
const files = []
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.(ts|tsx|js|mjs|html)$/.test(e.name)) files.push(p)
  }
}
walk(ROOT)

const problems = []
for (const file of files) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/')
  if (rel in ALLOWED) continue
  fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '')
      if (PATTERN.test(code)) problems.push(`  ${rel}:${i + 1}  ${line.trim().slice(0, 100)}`)
    })
}

if (problems.length) {
  console.log(`Archivio del browser usato fuori dai file ammessi (${problems.length}):\n${problems.join('\n')}`)
  process.exit(1)
}
console.log(`Nessun dato nel browser: ${files.length} file controllati; ammessi solo ${Object.keys(ALLOWED).length} (svuotano e basta).`)
