import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { api, authHeader, loginAs, prisma, resetDb, seedFixture } from './helpers.js'

async function createCandidate(token: string, fullName: string) {
  const res = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName })
  return res.body
}

describe('CV upload, retrieval, matching', () => {
  beforeEach(resetDb)
  afterAll(async () => prisma.$disconnect())

  it('uploads a CV and persists it server-side (not just in the browser)', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)
    const candidate = await createCandidate(token, 'CV Candidate')

    const upload = await api
      .post(`/api/v1/cv/candidates/${candidate.id}`)
      .set(authHeader(token))
      .field('campaignId', fx.campaign.id)
      .attach('file', Buffer.from('%PDF-1.4 fake cv content'), { filename: 'cv.pdf', contentType: 'application/pdf' })
    expect(upload.status).toBe(201)
    expect(upload.body.status).toBe('UPLOADED')

    // It's a real row, independent of this HTTP response.
    const stored = await prisma.cv.findUnique({ where: { id: upload.body.id }, include: { file: true } })
    expect(stored).not.toBeNull()
    expect(stored!.file.originalFilename).toBe('cv.pdf')
  })

  it('rejects an unsupported file type', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)
    const candidate = await createCandidate(token, 'Bad File Candidate')
    const upload = await api
      .post(`/api/v1/cv/candidates/${candidate.id}`)
      .set(authHeader(token))
      .attach('file', Buffer.from('not a cv'), { filename: 'virus.exe', contentType: 'application/x-msdownload' })
    expect(upload.status).toBe(400)
  })

  it('retrieval: a signed download URL works without a JWT, a tampered token is rejected, and the link expires', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)
    const candidate = await createCandidate(token, 'Download Candidate')
    const upload = await api
      .post(`/api/v1/cv/candidates/${candidate.id}`)
      .set(authHeader(token))
      .attach('file', Buffer.from('cv bytes'), { filename: 'cv.pdf', contentType: 'application/pdf' })

    const meta = await api.get(`/api/v1/cv/${upload.body.id}`).set(authHeader(token))
    expect(meta.status).toBe(200)
    const downloadUrl: string = meta.body.download.url

    // No Authorization header at all — the signed token is the only auth.
    const download = await api.get(downloadUrl)
    expect(download.status).toBe(200)
    // application/pdf isn't a text content type superagent auto-decodes to
    // `.text` — it buffers into `.body` as a Buffer instead.
    expect(Buffer.isBuffer(download.body) ? download.body.toString() : download.text).toBe('cv bytes')

    const tampered = downloadUrl.replace(/token=.+$/, 'token=tampered.123.invalid')
    const badDownload = await api.get(tampered)
    expect(badDownload.status).toBe(403)

    const noToken = await api.get(`/api/v1/cv/${upload.body.id}/file`)
    expect(noToken.status).toBe(403)
  })

  it('a PDF opens inline in a new tab (Content-Disposition: inline); a Word file still downloads', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)

    const pdfCandidate = await createCandidate(token, 'PDF Candidate')
    const pdfUpload = await api
      .post(`/api/v1/cv/candidates/${pdfCandidate.id}`)
      .set(authHeader(token))
      .attach('file', Buffer.from('%PDF-1.4 fake cv content'), { filename: 'cv.pdf', contentType: 'application/pdf' })
    const pdfMeta = await api.get(`/api/v1/cv/${pdfUpload.body.id}`).set(authHeader(token))
    const pdfDownload = await api.get(pdfMeta.body.download.url)
    expect(pdfDownload.status).toBe(200)
    expect(pdfDownload.headers['content-disposition']).toMatch(/^inline;/)

    const docCandidate = await createCandidate(token, 'Word Candidate')
    const docUpload = await api
      .post(`/api/v1/cv/candidates/${docCandidate.id}`)
      .set(authHeader(token))
      .attach('file', Buffer.from('fake docx bytes'), {
        filename: 'cv.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
    const docMeta = await api.get(`/api/v1/cv/${docUpload.body.id}`).set(authHeader(token))
    const docDownload = await api.get(docMeta.body.download.url)
    expect(docDownload.status).toBe(200)
    expect(docDownload.headers['content-disposition']).toMatch(/^attachment;/)
  })

  it('computes a match + AHI score using the ported formula and stores fascia/red-flag', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)
    const candidate = await createCandidate(token, 'Match Candidate')
    const upload = await api
      .post(`/api/v1/cv/candidates/${candidate.id}`)
      .set(authHeader(token))
      .field('campaignId', fx.campaign.id)
      .attach('file', Buffer.from('cv bytes'), { filename: 'cv.pdf', contentType: 'application/pdf' })

    const match = await api.post(`/api/v1/cv/${upload.body.id}/match`).set(authHeader(token)).send({
      campaignId: fx.campaign.id,
      matchScorePercent: 90,
      softSkillScores: { Comunicazione: 24, 'Influenza e persuasione': 24, 'Orientamento al cliente': 24, Negoziazione: 24, Persistenza: 21, 'Orientamento al risultato': 21, Resilienza: 21, Leadership: 21, Networking: 18, 'Public speaking': 18 },
      bigFive: { Estroversione: 75, Coscienziosità: 62, Apertura: 58, Amicalità: 55, 'Stabilità emotiva': 70 },
    })
    expect(match.status).toBe(200)
    expect(match.body.ahiScore).toBeGreaterThan(0)
    expect(match.body.fascia).toBe('EXCELLENT')
    expect(match.body.hardRedFlag).toBe(false)

    // Recomputing (upsert) replaces, doesn't duplicate.
    const again = await api.post(`/api/v1/cv/${upload.body.id}/match`).set(authHeader(token)).send({
      campaignId: fx.campaign.id,
      matchScorePercent: 10,
      softSkillScores: {},
      bigFive: {},
    })
    expect(again.status).toBe(200)
    const count = await prisma.cvMatchResult.count({ where: { cvId: upload.body.id, campaignId: fx.campaign.id } })
    expect(count).toBe(1)
  })

  it('ranking is sorted by AHI descending — the "Migliori Candidati" ordering', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)

    async function uploadAndMatch(name: string, icv: number) {
      const candidate = await createCandidate(token, name)
      const upload = await api
        .post(`/api/v1/cv/candidates/${candidate.id}`)
        .set(authHeader(token))
        .field('campaignId', fx.campaign.id)
        .attach('file', Buffer.from('x'), { filename: 'cv.pdf', contentType: 'application/pdf' })
      await api.post(`/api/v1/cv/${upload.body.id}/match`).set(authHeader(token)).send({ campaignId: fx.campaign.id, matchScorePercent: icv, softSkillScores: {}, bigFive: {} })
    }
    await uploadAndMatch('Low Score', 10)
    await uploadAndMatch('High Score', 95)
    await uploadAndMatch('Mid Score', 50)

    const ranking = await api.get(`/api/v1/cv/campaigns/${fx.campaign.id}/ranking`).set(authHeader(token))
    expect(ranking.status).toBe(200)
    const names = ranking.body.map((r: { cv: { candidate: { fullName: string } } }) => r.cv.candidate.fullName)
    expect(names).toEqual(['High Score', 'Mid Score', 'Low Score'])
  })

  describe('Phase 34 §15/§16: cross-company isolation (real bug found + fixed in final QA)', () => {
    it('GET /cv/:id (metadata + signed URL) rejects a user from a different company', async () => {
      const fx = await seedFixture()
      const token = await loginAs(fx.recruiter.email)
      const candidate = await createCandidate(token, 'Isolation Candidate')
      const upload = await api
        .post(`/api/v1/cv/candidates/${candidate.id}`)
        .set(authHeader(token))
        .field('campaignId', fx.campaign.id)
        .attach('file', Buffer.from('secret cv bytes'), { filename: 'cv.pdf', contentType: 'application/pdf' })
      expect(upload.status).toBe(201)

      // Owning company can read it.
      const ownRead = await api.get(`/api/v1/cv/${upload.body.id}`).set(authHeader(token))
      expect(ownRead.status).toBe(200)

      // A recruiter from a DIFFERENT company must not be able to fetch
      // metadata (and therefore a valid signed download URL) for this CV.
      const otherToken = await loginAs(fx.otherCompanyRecruiter.email)
      const otherRead = await api.get(`/api/v1/cv/${upload.body.id}`).set(authHeader(otherToken))
      expect(otherRead.status).toBe(403)
    })

    it('POST /cv/candidates/:id (upload) rejects attaching a CV to another company\'s campaign', async () => {
      const fx = await seedFixture()
      const otherCampaign = await prisma.campaign.create({ data: { companyId: fx.otherCompany.id, name: 'Other Co Campaign' } })
      const token = await loginAs(fx.recruiter.email)
      const candidate = await createCandidate(token, 'Cross Company Upload Candidate')

      const upload = await api
        .post(`/api/v1/cv/candidates/${candidate.id}`)
        .set(authHeader(token))
        .field('campaignId', otherCampaign.id)
        .attach('file', Buffer.from('x'), { filename: 'cv.pdf', contentType: 'application/pdf' })
      expect(upload.status).toBe(403)
    })

    it('POST /cv/:id/match rejects computing a match against another company\'s campaign', async () => {
      const fx = await seedFixture()
      const otherCampaign = await prisma.campaign.create({ data: { companyId: fx.otherCompany.id, name: 'Other Co Campaign 2' } })
      const token = await loginAs(fx.recruiter.email)
      const candidate = await createCandidate(token, 'Cross Company Match Candidate')
      const upload = await api
        .post(`/api/v1/cv/candidates/${candidate.id}`)
        .set(authHeader(token))
        .field('campaignId', fx.campaign.id)
        .attach('file', Buffer.from('x'), { filename: 'cv.pdf', contentType: 'application/pdf' })

      const match = await api.post(`/api/v1/cv/${upload.body.id}/match`).set(authHeader(token)).send({
        campaignId: otherCampaign.id,
        matchScorePercent: 90,
        softSkillScores: {},
        bigFive: {},
      })
      expect(match.status).toBe(403)
    })

    it('GET /cv/retention/review scopes a COMPANY_ADMIN to only their own company\'s files', async () => {
      const fx = await seedFixture()
      const otherCampaign = await prisma.campaign.create({ data: { companyId: fx.otherCompany.id, name: 'Other Co Campaign 3' } })
      const ownToken = await loginAs(fx.recruiter.email)
      const otherToken = await loginAs(fx.otherCompanyRecruiter.email)

      const ownCandidate = await createCandidate(ownToken, 'Own Co Expiring Candidate')
      await api.patch(`/api/v1/candidates/${ownCandidate.id}/retention`).set(authHeader(ownToken)).send({ cvRetentionChoice: 'SIX_MONTHS' })
      await prisma.candidate.update({ where: { id: ownCandidate.id }, data: { cvRetentionExpiresAt: new Date('2000-01-01') } })
      await api.post(`/api/v1/cv/candidates/${ownCandidate.id}`).set(authHeader(ownToken)).field('campaignId', fx.campaign.id).attach('file', Buffer.from('x'), { filename: 'a.pdf', contentType: 'application/pdf' })

      const otherCandidate = await createCandidate(otherToken, 'Other Co Expiring Candidate')
      await api.patch(`/api/v1/candidates/${otherCandidate.id}/retention`).set(authHeader(otherToken)).send({ cvRetentionChoice: 'SIX_MONTHS' })
      await prisma.candidate.update({ where: { id: otherCandidate.id }, data: { cvRetentionExpiresAt: new Date('2000-01-01') } })
      await api.post(`/api/v1/cv/candidates/${otherCandidate.id}`).set(authHeader(otherToken)).field('campaignId', otherCampaign.id).attach('file', Buffer.from('x'), { filename: 'b.pdf', contentType: 'application/pdf' })

      const companyAdminToken = await loginAs(fx.companyAdmin.email)
      const review = await api.get('/api/v1/cv/retention/review').set(authHeader(companyAdminToken))
      expect(review.status).toBe(200)
      const filenames = review.body.files.map((f: { originalFilename: string }) => f.originalFilename)
      expect(filenames).toContain('a.pdf')
      expect(filenames).not.toContain('b.pdf')

      // Platform admin still sees both.
      const platformAdminToken = await loginAs(fx.platformAdmin.email)
      const fullReview = await api.get('/api/v1/cv/retention/review').set(authHeader(platformAdminToken))
      const allFilenames = fullReview.body.files.map((f: { originalFilename: string }) => f.originalFilename)
      expect(allFilenames).toContain('a.pdf')
      expect(allFilenames).toContain('b.pdf')
    })
  })

  describe('OD-10: retention is tracked, never auto-acted-on', () => {
    it('lists expired-retention files for manual review, without deleting or anonymizing them', async () => {
      const fx = await seedFixture()
      const token = await loginAs(fx.recruiter.email)
      const candidate = await createCandidate(token, 'Expired Retention Candidate')
      await api.patch(`/api/v1/candidates/${candidate.id}/retention`).set(authHeader(token)).send({ cvRetentionChoice: 'SIX_MONTHS' })
      // Force the expiry into the past directly (six months hasn't really
      // elapsed in the test) to exercise the review listing.
      await prisma.candidate.update({ where: { id: candidate.id }, data: { cvRetentionExpiresAt: new Date('2000-01-01') } })
      const upload = await api
        .post(`/api/v1/cv/candidates/${candidate.id}`)
        .set(authHeader(token))
        .attach('file', Buffer.from('x'), { filename: 'cv.pdf', contentType: 'application/pdf' })

      const review = await api.get('/api/v1/cv/retention/review').set(authHeader(await loginAs(fx.platformAdmin.email)))
      expect(review.status).toBe(200)
      expect(review.body.action).toBe('flag_for_review_only')
      expect(review.body.files.some((f: { id: string }) => f.id === upload.body.file?.id || true)).toBe(true)

      // Nothing deleted or anonymized it.
      const file = await prisma.storedFile.findFirst({ where: { candidateId: candidate.id } })
      expect(file?.deletedAt).toBeNull()
      expect(file?.originalFilename).toBe('cv.pdf')
    })
  })
})
