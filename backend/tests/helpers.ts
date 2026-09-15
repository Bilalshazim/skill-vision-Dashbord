import { PrismaClient } from '@prisma/client'
import request from 'supertest'

import { createApp } from '../src/app.js'
import { hashPassword } from '../src/lib/password.js'

export const prisma = new PrismaClient()
export const app = createApp()
export const api = request(app)

// Truncated in FK-safe order — called from each test file's beforeEach so
// every test starts from a known-empty state rather than depending on
// leftover rows from a previous test (§20: realistic fixtures, not shared
// mutable global state between tests).
export async function resetDb() {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.testResponse.deleteMany(),
    prisma.testInvitation.deleteMany(),
    prisma.shortlist.deleteMany(),
    prisma.evaluation.deleteMany(),
    prisma.campaignEvaluatorAssignment.deleteMany(),
    prisma.evaluator.deleteMany(),
    prisma.interview.deleteMany(),
    prisma.candidateProfile.deleteMany(),
    prisma.cvMatchResult.deleteMany(),
    prisma.cv.deleteMany(),
    prisma.storedFile.deleteMany(),
    prisma.jobProfile.deleteMany(),
    prisma.campaignCandidate.deleteMany(),
    prisma.candidate.deleteMany(),
    prisma.emailTemplate.deleteMany(),
    prisma.senderConfig.deleteMany(),
    prisma.emailServiceConfig.deleteMany(),
    prisma.testProviderConfig.deleteMany(),
    prisma.cip.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
    prisma.company.deleteMany(),
    prisma.sellerCode.deleteMany(),
    prisma.platform.deleteMany(),
  ])
}

export type Fixture = Awaited<ReturnType<typeof seedFixture>>

// Minimal, realistic fixture (§20) — one platform/company/campaign and one
// user per role, reused by most test files instead of every file inventing
// its own tenancy tree.
export async function seedFixture() {
  const platform = await prisma.platform.create({ data: { name: 'Test Platform', status: 'ACTIVE', activatedAt: new Date() } })
  const seller = await prisma.sellerCode.create({ data: { code: 'TS', label: 'Test Seller' } })
  const company = await prisma.company.create({ data: { name: 'Test Co', platformId: platform.id } })
  const otherCompany = await prisma.company.create({ data: { name: 'Other Co' } })
  const campaign = await prisma.campaign.create({ data: { companyId: company.id, name: 'Test Campaign', status: 'ACTIVE' } })

  const platformAdmin = await prisma.user.create({
    data: { email: 'admin@test.local', passwordHash: await hashPassword('pw123456'), fullName: 'Admin', role: 'PLATFORM_ADMIN' },
  })
  const companyAdmin = await prisma.user.create({
    data: { email: 'companyadmin@test.local', passwordHash: await hashPassword('pw123456'), fullName: 'Company Admin', role: 'COMPANY_ADMIN', companyId: company.id },
  })
  const recruiter = await prisma.user.create({
    data: { email: 'recruiter@test.local', passwordHash: await hashPassword('pw123456'), fullName: 'Recruiter', role: 'RECRUITER', companyId: company.id },
  })
  const otherCompanyRecruiter = await prisma.user.create({
    data: { email: 'otherrecruiter@test.local', passwordHash: await hashPassword('pw123456'), fullName: 'Other Recruiter', role: 'RECRUITER', companyId: otherCompany.id },
  })

  const senderConfig = await prisma.senderConfig.create({
    data: { companyId: company.id, senderType: 'COMPANY_HR', displayName: 'Test HR', replyToEmail: 'hr@test.local', createdById: companyAdmin.id },
  })

  return { platform, seller, company, otherCompany, campaign, platformAdmin, companyAdmin, recruiter, otherCompanyRecruiter, senderConfig }
}

export async function loginAs(email: string, password = 'pw123456') {
  const res = await api.post('/api/v1/auth/login').send({ email, password })
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${JSON.stringify(res.body)}`)
  return res.body.accessToken as string
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}
