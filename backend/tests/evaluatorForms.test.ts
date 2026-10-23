import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

// L'email "parte" sempre: qui interessa cosa si registra, non l'SMTP.
const sendMail = vi.fn(async (_input: unknown) => ({ ok: true as const }))
vi.mock('../src/lib/mailer.js', () => ({ sendMail: (input: unknown) => sendMail(input) }))
// La sintesi IA: si controlla che cosa arriva al modello, senza chiamarlo.
const askClaude = vi.fn(async (_input: unknown) => '{"rilevanti":"r","convergenze":"c","divergenze":"d","criticita":"k"}')
vi.mock('../src/lib/ai.js', () => ({ askClaude: (input: unknown) => askClaude(input) }))

const { api, authHeader, loginAs, prisma, resetDb, seedFixture } = await import('./helpers.js')

// Area Valutatori: invio delle schede scelte, caricamento delle schede
// restituite come file, quadro per candidato.
describe('Area Valutatori — schede inviate e restituite come file', () => {
  beforeEach(async () => {
    sendMail.mockClear()
    askClaude.mockClear()
    await resetDb()
  })
  afterAll(async () => prisma.$disconnect())

  async function setup() {
    const fx = await seedFixture()
    const token = await loginAs(fx.companyAdmin.email)
    const candidate = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'Mario Rossi' })
    const cc = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(token)).send({ candidateId: candidate.body.id })
    const evaluator = await api.post('/api/v1/evaluators').set(authHeader(token)).send({ fullName: 'Anna Bianchi', email: 'anna@x.com', role: 'MANAGER', companyId: fx.company.id })
    await api.post(`/api/v1/evaluators/campaigns/${fx.campaign.id}/assign`).set(authHeader(token)).send({ evaluatorId: evaluator.body.id })
    return { fx, token, ccId: cc.body.id as string, evaluatorId: evaluator.body.id as string }
  }

  it('invia solo le schede scelte, con risposta al responsabile, e lo registra nel quadro', async () => {
    const { fx, token, evaluatorId } = await setup()
    const res = await api
      .post(`/api/v1/evaluators/campaigns/${fx.campaign.id}/send-forms`)
      .set(authHeader(token))
      .set('Origin', 'https://app.test')
      .send({ evaluatorIds: [evaluatorId], appUrl: 'https://app.test', kinds: ['VALUTAZIONE'] })
    expect(res.status).toBe(200)
    expect(res.body.results[0].ok).toBe(true)

    const mail = sendMail.mock.calls[0][0] as { replyTo?: string; text: string }
    expect(mail.replyTo).toBe(fx.companyAdmin.email)
    expect(mail.text).toContain('Scheda Valutazione Candidato')
    expect(mail.text).not.toContain('Scheda Intervista Strutturata')

    const tracking = await api.get(`/api/v1/evaluators/campaigns/${fx.campaign.id}/form-tracking`).set(authHeader(token))
    expect(tracking.status).toBe(200)
    expect(tracking.body.sends).toHaveLength(1)
    expect(tracking.body.sends[0]).toMatchObject({ evaluatorId, kind: 'VALUTAZIONE' })
  })

  it('senza scelta manda tutte e due le schede, come prima', async () => {
    const { fx, token, evaluatorId } = await setup()
    await api
      .post(`/api/v1/evaluators/campaigns/${fx.campaign.id}/send-forms`)
      .set(authHeader(token))
      .set('Origin', 'https://app.test')
      .send({ evaluatorIds: [evaluatorId], appUrl: 'https://app.test' })
    const tracking = await api.get(`/api/v1/evaluators/campaigns/${fx.campaign.id}/form-tracking`).set(authHeader(token))
    expect(tracking.body.sends.map((s: { kind: string }) => s.kind).sort()).toEqual(['INTERVISTA', 'VALUTAZIONE'])
  })

  it('carica la scheda restituita per candidato, la apre con un link firmato e la toglie', async () => {
    const { fx, token, ccId, evaluatorId } = await setup()
    const up = await api
      .post(`/api/v1/evaluators/campaign-candidates/${ccId}/form-uploads`)
      .set(authHeader(token))
      .field('kind', 'INTERVISTA')
      .field('evaluatorId', evaluatorId)
      .attach('file', Buffer.from('%PDF-1.4 scheda'), { filename: 'intervista rossi.pdf', contentType: 'application/pdf' })
    expect(up.status).toBe(201)
    expect(up.body).toMatchObject({ campaignCandidateId: ccId, evaluatorId, kind: 'INTERVISTA', originalFilename: 'intervista rossi.pdf' })

    const tracking = await api.get(`/api/v1/evaluators/campaigns/${fx.campaign.id}/form-tracking`).set(authHeader(token))
    expect(tracking.body.uploads).toHaveLength(1)

    const meta = await api.get(`/api/v1/evaluators/form-uploads/${up.body.id}`).set(authHeader(token))
    expect(meta.status).toBe(200)
    const file = await api.get(meta.body.download.url)
    expect(file.status).toBe(200)
    expect(file.headers['content-type']).toContain('application/pdf')

    const noToken = await api.get(`/api/v1/evaluators/form-uploads/${up.body.id}/file`)
    expect(noToken.status).toBe(403)

    const del = await api.delete(`/api/v1/evaluators/form-uploads/${up.body.id}`).set(authHeader(token))
    expect(del.status).toBe(204)
    const after = await api.get(`/api/v1/evaluators/campaigns/${fx.campaign.id}/form-tracking`).set(authHeader(token))
    expect(after.body.uploads).toHaveLength(0)
  })

  it('rifiuta formati non ammessi, valutatori non assegnati e altre società', async () => {
    const { fx, token, ccId, evaluatorId } = await setup()
    const exe = await api
      .post(`/api/v1/evaluators/campaign-candidates/${ccId}/form-uploads`)
      .set(authHeader(token))
      .field('kind', 'INTERVISTA')
      .field('evaluatorId', evaluatorId)
      .attach('file', Buffer.from('x'), { filename: 'x.exe', contentType: 'application/x-msdownload' })
    expect(exe.status).toBe(400)

    const stranger = await prisma.evaluator.create({ data: { fullName: 'Non assegnato', email: 'n@x.com', role: 'HR', companyId: fx.company.id } })
    const notAssigned = await api
      .post(`/api/v1/evaluators/campaign-candidates/${ccId}/form-uploads`)
      .set(authHeader(token))
      .field('kind', 'VALUTAZIONE')
      .field('evaluatorId', stranger.id)
      .attach('file', Buffer.from('%PDF'), { filename: 'v.pdf', contentType: 'application/pdf' })
    expect(notAssigned.status).toBe(400)

    const otherToken = await loginAs(fx.otherCompanyRecruiter.email)
    const blockedUpload = await api
      .post(`/api/v1/evaluators/campaign-candidates/${ccId}/form-uploads`)
      .set(authHeader(otherToken))
      .field('kind', 'VALUTAZIONE')
      .field('evaluatorId', evaluatorId)
      .attach('file', Buffer.from('%PDF'), { filename: 'v.pdf', contentType: 'application/pdf' })
    expect(blockedUpload.status).toBe(403)
    const blockedTracking = await api.get(`/api/v1/evaluators/campaigns/${fx.campaign.id}/form-tracking`).set(authHeader(otherToken))
    expect(blockedTracking.status).toBe(403)
  })
  it('la sintesi IA legge anche le schede caricate: PDF come documento, Word come testo', async () => {
    const { token, ccId, evaluatorId } = await setup()
    const empty = await api.post(`/api/v1/evaluators/campaign-candidates/${ccId}/synthesis`).set(authHeader(token))
    expect(empty.status).toBe(400)

    await api
      .post(`/api/v1/evaluators/campaign-candidates/${ccId}/form-uploads`)
      .set(authHeader(token))
      .field('kind', 'INTERVISTA')
      .field('evaluatorId', evaluatorId)
      .attach('file', Buffer.from('%PDF-1.4 scheda'), { filename: 'i.pdf', contentType: 'application/pdf' })
    await api
      .post(`/api/v1/evaluators/campaign-candidates/${ccId}/form-uploads`)
      .set(authHeader(token))
      .field('kind', 'VALUTAZIONE')
      .field('evaluatorId', evaluatorId)
      .attach('file', makeDocx('Punteggio finale 4 su 5'), { filename: 'v.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })

    const res = await api.post(`/api/v1/evaluators/campaign-candidates/${ccId}/synthesis`).set(authHeader(token))
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ evaluationsUsed: 0, filesUsed: 2, filesSkipped: [] })
    const sent = (askClaude.mock.calls[0][0] as { user: Array<{ type: string; text?: string; source?: { media_type: string } }> }).user
    expect(sent.some((b) => b.type === 'document' && b.source?.media_type === 'application/pdf')).toBe(true)
    expect(sent.some((b) => b.type === 'text' && b.text?.includes('Punteggio finale 4 su 5'))).toBe(true)
  })
})

// Un .docx minimo: uno ZIP "stored" con word/document.xml.
function makeDocx(text: string): Buffer {
  const name = Buffer.from('word/document.xml')
  const data = Buffer.from(`<w:document><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`)
  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt32LE(data.length, 18)
  local.writeUInt32LE(data.length, 22)
  local.writeUInt16LE(name.length, 26)
  const central = Buffer.alloc(46)
  central.writeUInt32LE(0x02014b50, 0)
  central.writeUInt32LE(data.length, 20)
  central.writeUInt32LE(data.length, 24)
  central.writeUInt16LE(name.length, 28)
  central.writeUInt32LE(0, 42)
  const cdOffset = 30 + name.length + data.length
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(1, 8)
  eocd.writeUInt16LE(1, 10)
  eocd.writeUInt32LE(46 + name.length, 12)
  eocd.writeUInt32LE(cdOffset, 16)
  return Buffer.concat([local, name, data, central, name, eocd])
}
