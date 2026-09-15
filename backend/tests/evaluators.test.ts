import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { api, authHeader, loginAs, prisma, resetDb, seedFixture } from './helpers.js'

describe('Evaluators & evaluations', () => {
  beforeEach(resetDb)
  afterAll(async () => prisma.$disconnect())

  it('creates evaluators across all four roles', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.companyAdmin.email)
    for (const role of ['HR', 'MANAGER', 'DIRETTORE_HR', 'ALTRO'] as const) {
      const res = await api.post('/api/v1/evaluators').set(authHeader(token)).send({
        fullName: `Evaluator ${role}`,
        email: `${role.toLowerCase()}@example.com`,
        role,
        altroLabel: role === 'ALTRO' ? 'External consultant' : undefined,
        companyId: fx.company.id,
      })
      expect(res.status).toBe(201)
      expect(res.body.role).toBe(role)
    }
  })

  it('supports assigning a minimum of 3 evaluators to a campaign, reflected in the readiness check', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.companyAdmin.email)
    const notReady = await api.get(`/api/v1/campaigns/${fx.campaign.id}/evaluator-readiness`).set(authHeader(token))
    expect(notReady.body.meetsMinimum).toBe(false)

    const roles = ['HR', 'MANAGER', 'DIRETTORE_HR'] as const
    for (const role of roles) {
      const evaluator = await api.post('/api/v1/evaluators').set(authHeader(token)).send({ fullName: `E ${role}`, email: `${role}@x.com`, role, companyId: fx.company.id })
      const assign = await api.post(`/api/v1/evaluators/campaigns/${fx.campaign.id}/assign`).set(authHeader(token)).send({ evaluatorId: evaluator.body.id })
      expect(assign.status).toBe(201)
    }

    const ready = await api.get(`/api/v1/campaigns/${fx.campaign.id}/evaluator-readiness`).set(authHeader(token))
    expect(ready.body.assignedEvaluators).toBe(3)
    expect(ready.body.meetsMinimum).toBe(true)

    // Phase 35 §1/§2: the admin roster read — survives a reload (unlike
    // the panel's previous session-only local state), shows each
    // evaluator's role, and is rejected for a different company.
    const roster = await api.get(`/api/v1/campaigns/${fx.campaign.id}/evaluators`).set(authHeader(token))
    expect(roster.status).toBe(200)
    expect(roster.body).toHaveLength(3)
    expect(roster.body.map((e: { role: string }) => e.role).sort()).toEqual(['DIRETTORE_HR', 'HR', 'MANAGER'])

    const otherToken = await loginAs(fx.otherCompanyRecruiter.email)
    const blocked = await api.get(`/api/v1/campaigns/${fx.campaign.id}/evaluators`).set(authHeader(otherToken))
    expect(blocked.status).toBe(403)
  })

  it('each evaluator has an independent evaluation for the same candidate — one does not overwrite another', async () => {
    const fx = await seedFixture()
    const adminToken = await loginAs(fx.companyAdmin.email)
    const candidate = await api.post('/api/v1/candidates').set(authHeader(adminToken)).send({ fullName: 'Evaluated Candidate' })
    const cc = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(adminToken)).send({ candidateId: candidate.body.id })

    const hrUser = fx.companyAdmin // reuse an existing User for the "has a login" evaluator path
    const hrEvaluator = await api.post('/api/v1/evaluators').set(authHeader(adminToken)).send({ fullName: 'HR Eval', email: 'hreval@x.com', role: 'HR', companyId: fx.company.id, userId: hrUser.id })
    const mgrEvaluator = await api.post('/api/v1/evaluators').set(authHeader(adminToken)).send({ fullName: 'Manager Eval', email: 'mgreval@x.com', role: 'MANAGER', companyId: fx.company.id })
    // Phase 34 §12/§16: writing an evaluation now requires a real
    // CampaignEvaluatorAssignment row first (see evaluators/routes.ts's
    // requireEvaluatorAssignedToCandidate — a real gap found and fixed in
    // final QA), so both evaluators must be assigned before either can submit.
    await api.post(`/api/v1/evaluators/campaigns/${fx.campaign.id}/assign`).set(authHeader(adminToken)).send({ evaluatorId: hrEvaluator.body.id })
    await api.post(`/api/v1/evaluators/campaigns/${fx.campaign.id}/assign`).set(authHeader(adminToken)).send({ evaluatorId: mgrEvaluator.body.id })

    // HR evaluator has a real login -> writes via the normal Bearer path.
    const hrEval = await api.post('/api/v1/evaluators/evaluations').set(authHeader(adminToken)).send({ campaignCandidateId: cc.body.id, finalScore: 4.5, recommendation: 'PROCEDI' })
    expect(hrEval.status).toBe(201)

    // Manager evaluator has no login (OD-9) -> writes via a scoped token.
    const issued = await api.post(`/api/v1/evaluators/${mgrEvaluator.body.id}/issue-access-token`).set(authHeader(adminToken)).send()
    const mgrEval = await api.post('/api/v1/evaluators/evaluations').set('X-Evaluator-Token', issued.body.token).send({ campaignCandidateId: cc.body.id, finalScore: 2.5, recommendation: 'RISERVA' })
    expect(mgrEval.status).toBe(201)

    const all = await api.get(`/api/v1/evaluators/campaign-candidates/${cc.body.id}/evaluations`).set(authHeader(adminToken))
    expect(all.body).toHaveLength(2)
    const scores = all.body.map((e: { finalScore: number }) => e.finalScore).sort()
    expect(scores).toEqual([2.5, 4.5])
    expect(hrEval.body.evaluatorId).not.toBe(mgrEval.body.evaluatorId)
  })

  it('a submitted evaluation is immutable', async () => {
    const fx = await seedFixture()
    const adminToken = await loginAs(fx.companyAdmin.email)
    const candidate = await api.post('/api/v1/candidates').set(authHeader(adminToken)).send({ fullName: 'Immutable Test Candidate' })
    const cc = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(adminToken)).send({ candidateId: candidate.body.id })
    const evaluator = await api.post('/api/v1/evaluators').set(authHeader(adminToken)).send({ fullName: 'Immutable Evaluator', email: 'imm@x.com', role: 'HR', companyId: fx.company.id, userId: fx.companyAdmin.id })
    await api.post(`/api/v1/evaluators/campaigns/${fx.campaign.id}/assign`).set(authHeader(adminToken)).send({ evaluatorId: evaluator.body.id })

    const draft = await api.post('/api/v1/evaluators/evaluations').set(authHeader(adminToken)).send({ campaignCandidateId: cc.body.id, finalScore: 3 })
    const submitted = await api.post(`/api/v1/evaluators/evaluations/${draft.body.id}/submit`).set(authHeader(adminToken)).send()
    expect(submitted.status).toBe(200)
    expect(submitted.body.status).toBe('SUBMITTED')

    const editAttempt = await api.post('/api/v1/evaluators/evaluations').set(authHeader(adminToken)).send({ campaignCandidateId: cc.body.id, finalScore: 1 })
    expect(editAttempt.status).toBe(409)

    const resubmit = await api.post(`/api/v1/evaluators/evaluations/${draft.body.id}/submit`).set(authHeader(adminToken)).send()
    expect(resubmit.status).toBe(409)
    void evaluator
  })

  describe('Phase 33 §4/§5: GET /evaluators/me + /me/assignments (evaluator-facing read)', () => {
    it('an authenticated evaluator (JWT-linked) sees only their own identity and assigned campaign candidates', async () => {
      const fx = await seedFixture()
      const adminToken = await loginAs(fx.companyAdmin.email)
      const candidate = await api.post('/api/v1/candidates').set(authHeader(adminToken)).send({ fullName: 'Assigned Candidate' })
      const cc = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(adminToken)).send({ candidateId: candidate.body.id })
      const evaluator = await api
        .post('/api/v1/evaluators')
        .set(authHeader(adminToken))
        .send({ fullName: 'Login Eval', email: 'logineval@x.com', role: 'HR', companyId: fx.company.id, userId: fx.companyAdmin.id })
      await api.post(`/api/v1/evaluators/campaigns/${fx.campaign.id}/assign`).set(authHeader(adminToken)).send({ evaluatorId: evaluator.body.id })

      const me = await api.get('/api/v1/evaluators/me').set(authHeader(adminToken))
      expect(me.status).toBe(200)
      expect(me.body.id).toBe(evaluator.body.id)
      expect(me.body.role).toBe('HR')

      const assignments = await api.get('/api/v1/evaluators/me/assignments').set(authHeader(adminToken))
      expect(assignments.status).toBe(200)
      expect(assignments.body).toHaveLength(1)
      expect(assignments.body[0].campaignCandidateId).toBe(cc.body.id)
      expect(assignments.body[0].candidate.fullName).toBe('Assigned Candidate')
      expect(assignments.body[0].myEvaluation).toBeNull()

      // After submitting, the same read reflects it.
      await api.post('/api/v1/evaluators/evaluations').set(authHeader(adminToken)).send({ campaignCandidateId: cc.body.id, finalScore: 4 })
      const after = await api.get('/api/v1/evaluators/me/assignments').set(authHeader(adminToken))
      expect(after.body[0].myEvaluation.finalScore).toBe(4)
    })

    it('an accountless evaluator token sees only their own scoped assignments, not another evaluator\'s', async () => {
      const fx = await seedFixture()
      const adminToken = await loginAs(fx.companyAdmin.email)
      const candidate = await api.post('/api/v1/candidates').set(authHeader(adminToken)).send({ fullName: 'Token Candidate' })
      const cc = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(adminToken)).send({ candidateId: candidate.body.id })

      const evalA = await api.post('/api/v1/evaluators').set(authHeader(adminToken)).send({ fullName: 'Token Eval A', email: 'ta@x.com', role: 'ALTRO', altroLabel: 'Consultant', companyId: fx.company.id })
      const evalB = await api.post('/api/v1/evaluators').set(authHeader(adminToken)).send({ fullName: 'Token Eval B', email: 'tb@x.com', role: 'ALTRO', altroLabel: 'Consultant', companyId: fx.company.id })
      await api.post(`/api/v1/evaluators/campaigns/${fx.campaign.id}/assign`).set(authHeader(adminToken)).send({ evaluatorId: evalA.body.id })
      // evalB is NOT assigned to this campaign.

      const tokenA = (await api.post(`/api/v1/evaluators/${evalA.body.id}/issue-access-token`).set(authHeader(adminToken)).send()).body.token
      const tokenB = (await api.post(`/api/v1/evaluators/${evalB.body.id}/issue-access-token`).set(authHeader(adminToken)).send()).body.token

      const meA = await api.get('/api/v1/evaluators/me').set('X-Evaluator-Token', tokenA)
      expect(meA.status).toBe(200)
      expect(meA.body.id).toBe(evalA.body.id)

      const assignmentsA = await api.get('/api/v1/evaluators/me/assignments').set('X-Evaluator-Token', tokenA)
      expect(assignmentsA.body).toHaveLength(1)
      expect(assignmentsA.body[0].campaignCandidateId).toBe(cc.body.id)

      // B holds a valid token but was never assigned — sees nothing, not an error and not A's data.
      const assignmentsB = await api.get('/api/v1/evaluators/me/assignments').set('X-Evaluator-Token', tokenB)
      expect(assignmentsB.status).toBe(200)
      expect(assignmentsB.body).toHaveLength(0)
    })

    it('rejects a garbage or expired evaluator token, and a request with neither token nor login', async () => {
      const fx = await seedFixture()
      const noAuth = await api.get('/api/v1/evaluators/me/assignments')
      expect(noAuth.status).toBe(401)

      const garbage = await api.get('/api/v1/evaluators/me/assignments').set('X-Evaluator-Token', 'not-a-real-token')
      expect(garbage.status).toBe(401)

      const adminToken = await loginAs(fx.companyAdmin.email)
      const evaluator = await api.post('/api/v1/evaluators').set(authHeader(adminToken)).send({ fullName: 'Expiring Eval', email: 'exp@x.com', role: 'MANAGER', companyId: fx.company.id })
      const issued = await api.post(`/api/v1/evaluators/${evaluator.body.id}/issue-access-token`).set(authHeader(adminToken)).send()
      await prisma.evaluator.update({ where: { id: evaluator.body.id }, data: { accessTokenExpiresAt: new Date('2000-01-01') } })
      const expired = await api.get('/api/v1/evaluators/me/assignments').set('X-Evaluator-Token', issued.body.token)
      expect(expired.status).toBe(401)
    })
  })

  describe('Phase 34 §12/§15/§16: cross-company isolation (real bugs found + fixed in final QA)', () => {
    it('a company admin cannot create, assign, or issue a token for an evaluator under another company', async () => {
      const fx = await seedFixture()
      const token = await loginAs(fx.companyAdmin.email)

      const createOther = await api.post('/api/v1/evaluators').set(authHeader(token)).send({ fullName: 'Cross Co Eval', email: 'crossco@x.com', role: 'HR', companyId: fx.otherCompany.id })
      expect(createOther.status).toBe(403)

      // An evaluator that legitimately belongs to the OTHER company (created via platform admin) still can't be touched.
      const platformToken = await loginAs(fx.platformAdmin.email)
      const otherEval = await api.post('/api/v1/evaluators').set(authHeader(platformToken)).send({ fullName: 'Other Co Eval', email: 'otherco@x.com', role: 'HR', companyId: fx.otherCompany.id })
      expect(otherEval.status).toBe(201)

      const issueOnOther = await api.post(`/api/v1/evaluators/${otherEval.body.id}/issue-access-token`).set(authHeader(token)).send()
      expect(issueOnOther.status).toBe(403)

      const otherCampaign = await prisma.campaign.create({ data: { companyId: fx.otherCompany.id, name: 'Other Co Campaign' } })
      const assignOnOther = await api.post(`/api/v1/evaluators/campaigns/${otherCampaign.id}/assign`).set(authHeader(token)).send({ evaluatorId: otherEval.body.id })
      expect(assignOnOther.status).toBe(403)
    })

    it('an evaluator cannot submit an evaluation for a candidate they were never assigned to', async () => {
      const fx = await seedFixture()
      const adminToken = await loginAs(fx.companyAdmin.email)
      const candidate = await api.post('/api/v1/candidates').set(authHeader(adminToken)).send({ fullName: 'Unassigned Candidate' })
      const cc = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(adminToken)).send({ candidateId: candidate.body.id })

      // Evaluator exists but is NEVER assigned to fx.campaign.
      const evaluator = await api.post('/api/v1/evaluators').set(authHeader(adminToken)).send({ fullName: 'Never Assigned', email: 'never@x.com', role: 'HR', companyId: fx.company.id, userId: fx.recruiter.id })
      const evalToken = await loginAs(fx.recruiter.email)

      const attempt = await api.post('/api/v1/evaluators/evaluations').set(authHeader(evalToken)).send({ campaignCandidateId: cc.body.id, finalScore: 5 })
      expect(attempt.status).toBe(403)
      void evaluator
    })

    it('GET /evaluators/campaign-candidates/:id/evaluations rejects a user from a different company', async () => {
      const fx = await seedFixture()
      const adminToken = await loginAs(fx.companyAdmin.email)
      const candidate = await api.post('/api/v1/candidates').set(authHeader(adminToken)).send({ fullName: 'Cross Read Candidate' })
      const cc = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(adminToken)).send({ candidateId: candidate.body.id })

      const otherToken = await loginAs(fx.otherCompanyRecruiter.email)
      const blocked = await api.get(`/api/v1/evaluators/campaign-candidates/${cc.body.id}/evaluations`).set(authHeader(otherToken))
      expect(blocked.status).toBe(403)
    })
  })

  it('an accountless evaluator token cannot see or write another evaluator\'s evaluation', async () => {
    const fx = await seedFixture()
    const adminToken = await loginAs(fx.companyAdmin.email)
    const candidate = await api.post('/api/v1/candidates').set(authHeader(adminToken)).send({ fullName: 'Cross Access Candidate' })
    const cc = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(adminToken)).send({ candidateId: candidate.body.id })

    const evalA = await api.post('/api/v1/evaluators').set(authHeader(adminToken)).send({ fullName: 'Eval A', email: 'a@x.com', role: 'ALTRO', altroLabel: 'Consultant', companyId: fx.company.id })
    const evalB = await api.post('/api/v1/evaluators').set(authHeader(adminToken)).send({ fullName: 'Eval B', email: 'b@x.com', role: 'ALTRO', altroLabel: 'Consultant', companyId: fx.company.id })
    await api.post(`/api/v1/evaluators/campaigns/${fx.campaign.id}/assign`).set(authHeader(adminToken)).send({ evaluatorId: evalA.body.id })
    const tokenA = (await api.post(`/api/v1/evaluators/${evalA.body.id}/issue-access-token`).set(authHeader(adminToken)).send()).body.token
    const tokenB = (await api.post(`/api/v1/evaluators/${evalB.body.id}/issue-access-token`).set(authHeader(adminToken)).send()).body.token

    const aWrites = await api.post('/api/v1/evaluators/evaluations').set('X-Evaluator-Token', tokenA).send({ campaignCandidateId: cc.body.id, finalScore: 5 })
    const aEvalId = aWrites.body.id

    // B tries to submit A's evaluation by id — rejected, not "not found" leak.
    const bTriesToSubmitAsEval = await api.post(`/api/v1/evaluators/evaluations/${aEvalId}/submit`).set('X-Evaluator-Token', tokenB).send()
    expect(bTriesToSubmitAsEval.status).toBe(403)

    // An invalid/garbage token is unauthorized, not silently ignored.
    const badToken = await api.post('/api/v1/evaluators/evaluations').set('X-Evaluator-Token', 'not-a-real-token').send({ campaignCandidateId: cc.body.id, finalScore: 1 })
    expect(badToken.status).toBe(401)
  })
})
