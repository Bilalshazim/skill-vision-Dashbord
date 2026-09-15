// Live E2E: upload a real PDF CV through the React Recruiting UI and verify
// the complete backend chain + the fixed failure reporting + legacy-route
// removal. Run: node e2e-cv-upload-final.mjs  (backend :4000 + combined :8300 must be up)
import fs from 'node:fs'
import { chromium } from 'playwright'

const BASE = 'http://localhost:8300'
const API = 'http://localhost:4000/api/v1'
const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass: !!pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

// A real, minimal one-page PDF (valid structure so PDF viewers render it).
const pdf = Buffer.from(
  `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 60>>stream
BT /F1 18 Tf 72 720 Td (E2E CV upload test) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Size 6/Root 1 0 R>>
%%EOF`,
  'utf8',
)
const pdfPath = '/tmp/e2e-cv-upload.pdf'
fs.writeFileSync(pdfPath, pdf)

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()

let legacyNavHits = 0
const sendTestResponses = []
page.on('request', (req) => {
  if (req.url().includes('/modules/recruiting.html')) legacyNavHits++
})
page.on('response', (res) => {
  if (res.url().includes('/send-test')) sendTestResponses.push({ url: res.url(), status: res.status() })
})

// 1. Shell login as roberto (COMPANY_ADMIN) and enter Recruiting like a real user.
await page.goto(BASE + '/')
await page.fill('#sv-user', 'roberto')
await page.fill('#sv-pass', 'sv2024')
await page.click('#sv-login-form button[type="submit"]')
await page.waitForTimeout(600)
await page.click('[data-enter-module="recruiting"]')
await page.waitForLoadState('networkidle')
await page.waitForTimeout(1200)
check('entered React /recruiting', page.url().includes('/recruiting'), page.url())

// 2. CV & Esportazione page, then upload the real PDF through the actual drop zone.
await page.goto(BASE + '/recruiting/cv')
await page.waitForLoadState('networkidle')
await page.waitForTimeout(800)
await page.setInputFiles('input[type="file"]', pdfPath)
// 4-step × 850ms animation, then candidate/enroll/upload/match/shortlist/send API chain.
await page.waitForTimeout(11000)

const bodyText = await page.evaluate(() => document.body.innerText)
check('NO "CV sync failed" error', !bodyText.includes('sincronizzazione del CV non è riuscita'))
check('success message shown (saved on server)', bodyText.includes('salvato sul server'), bodyText.match(/[^\n]*salvato[^\n]*/)?.[0]?.trim() || '')

// 3. Local mirror: link map + prescreened entry carrying the real backend ids.
const ls = await page.evaluate(() => ({
  linkMap: JSON.parse(localStorage.getItem('apex5d_backend_link_map') || '{}'),
  state: JSON.parse(localStorage.getItem('apex5d_cv_matching_state') || '{}'),
  candidates: JSON.parse(localStorage.getItem('skillvision_candidates_data') || '[]'),
}))
const links = Object.entries(ls.linkMap).filter(([, v]) => v)
check('opening linked to backend company+campaign', links.length > 0, JSON.stringify(links[0]))
const campaignId = links[0]?.[1]?.campaignId
const newLocal = ls.candidates.filter((c) => c.backendCandidateId && c.name === 'Nuovo candidato (da CV)')
check('local candidate mirrored with backendCandidateId', newLocal.length > 0)
const localEntry = ls.state.companies
  ?.find((c) => c.name === 'Acme Corp')
  ?.jobOpenings.flatMap((o) => o.pipeline?.prescreened || [])
  .find((p) => p.candidateId === newLocal[0]?.id)
check('prescreened entry exists in Pagina A', !!localEntry)
check('entry carries real backendShortlistId', !!localEntry?.backendShortlistId, localEntry?.status)
check('entry status honest (da_inviare or inviato)', localEntry?.status === 'da_inviare' || localEntry?.status === 'inviato', localEntry?.status)

// 4. Backend truth: ranking row (CV + match) and the actual stored file.
const token = await page.evaluate(() => localStorage.getItem('sv_backend_access_token'))
const auth = { Authorization: `Bearer ${token}` }
const ranking = await (await fetch(`${API}/cv/campaigns/${campaignId}/ranking`, { headers: auth })).json()
const row = ranking.find((r) => r.cv?.candidate?.fullName === 'Nuovo candidato (da CV)')
check('backend CV + match result exist (ranking row)', !!row, row ? `match=${row.matchScorePercent}% ahi=${row.ahiScore} fascia=${row.fascia}` : 'missing')
const backendCandidateId = row?.cv?.candidate?.id
const cvId = row?.cv?.id

if (cvId) {
  const meta = await (await fetch(`${API}/cv/${cvId}`, { headers: auth })).json()
  // download.url already carries the full /api/v1 path (see cv/routes.ts GET /:id).
  const fileRes = await fetch(`http://localhost:4000${meta.download.url}`)
  check('CV file downloadable via signed URL', fileRes.status === 200 && (fileRes.headers.get('content-type') || '').includes('pdf'), `${fileRes.status} ${fileRes.headers.get('content-type')}`)
}

// 5. DB-level linkage check (authoritative).
const { execFileSync } = await import('node:child_process')
function psql(q) {
  // execFileSync (no shell) so the quoted CamelCase identifiers survive intact.
  return execFileSync('psql', ['postgresql://sv_recruiting@localhost:5432/sv_recruiting', '-tAc', q]).toString().trim()
}
const dbCand = psql(`SELECT id FROM "Candidate" WHERE "fullName"='Nuovo candidato (da CV)' ORDER BY "createdAt" DESC LIMIT 1`)
const dbCc = psql(`SELECT id FROM "CampaignCandidate" WHERE "candidateId"='${dbCand}'`)
const dbCv = psql(`SELECT id, status FROM "Cv" WHERE "candidateId"='${dbCand}' ORDER BY "uploadedAt" DESC LIMIT 1`)
const dbMatch = psql(`SELECT id FROM "CvMatchResult" WHERE "cvId"='${dbCv.split('|')[0]}'`)
const dbFile = psql(`SELECT id FROM "StoredFile" WHERE id=(SELECT "fileId" FROM "Cv" WHERE id='${dbCv.split('|')[0]}')`)
check('DB: Candidate row', !!dbCand, dbCand)
check('DB: CampaignCandidate linked', !!dbCc, dbCc)
check('DB: Cv row + status PROCESSED', dbCv.includes('PROCESSED'), dbCv)
check('DB: CvMatchResult row', !!dbMatch, dbMatch)
check('DB: StoredFile row (real bytes on disk)', !!dbFile, dbFile)

// 6. INVIA LINK TEST for the resulting backend-linked candidate: set the
// email via Pagina A (the real PATCH /candidates/:id/email path), then send.
await page.goto(BASE + '/recruiting/pagina-a')
await page.waitForLoadState('networkidle')
await page.waitForTimeout(800)
const email = 'info@skill-vision.it'
const rowLocator = page.locator('div.border-b', { hasText: 'Nuovo candidato (da CV)' }).last()
const emailInput = rowLocator.locator('input[type="email"]').first()
await emailInput.fill(email)
await emailInput.blur()
await page.waitForTimeout(1500)

await rowLocator.locator('button:has-text("Match CV/Profilo")').first().click()
await page.waitForTimeout(600)
const dialog = page.locator('[role="dialog"]')
const dialogText1 = await dialog.innerText()
check('dialog offers real INVIA LINK TEST for pending entry', dialogText1.includes('INVIA LINK TEST'), dialogText1.match(/Da inviare|Test inviato/)?.[0] || '')
await dialog.locator('button:has-text("INVIA LINK TEST")').first().click()
await page.waitForTimeout(8000)
const dialogText2 = await dialog.innerText()
check('INVIA LINK TEST completed without error', !dialogText2.includes('Invio non riuscito'), dialogText2.match(/Da inviare|Test inviato/)?.[0] || '')
check('send-test API returned 2xx', sendTestResponses.some((r) => r.status === 200 || r.status === 201), JSON.stringify(sendTestResponses))

const dbInv = psql(`SELECT "sentStatus" FROM "TestInvitation" WHERE "shortlistId" IN (SELECT id FROM "Shortlist" WHERE "campaignCandidateId"='${dbCc}') ORDER BY "createdAt" DESC LIMIT 1`)
check('DB: TestInvitation sentStatus=SENT', dbInv === 'SENT', dbInv)

// 7. Legacy route usage must be zero anywhere in this session.
check('no request to /modules/recruiting.html', legacyNavHits === 0, `${legacyNavHits} hits`)

await browser.close()
const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)


