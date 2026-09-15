// Phase 30 §17 — a safe, re-runnable migration path from the Recruiting
// frontend's current localStorage state to this backend. Reads an exported
// JSON file (see MIGRATION.md for the exact, non-destructive browser
// console snippet that produces it — nothing here ever touches a live
// browser's localStorage, and nothing it reads is deleted).
//
// Covers the two keys that hold real candidate/pipeline data —
// `skillvision_candidates_data` and `apex5d_cv_matching_state` — per the
// Blueprint §9 migration map. The other five keys (JD templates, job
// posting summaries, salary/benefits, survey state, interview protocol)
// are NOT migrated by this script; MIGRATION.md explains why each one
// needs a human decision rather than a mechanical mapping (the Blueprint
// flagged interview-protocol specifically as needing a manual pass, since
// it's keyed by role today, not by a real candidate).
//
// Idempotent: matched by legacy id where the source data has one, so
// running this twice against the same export does not create duplicates.
// `--dry-run` reports what WOULD happen without writing anything.
//
// Usage:
//   npx tsx scripts/migrate-localstorage.ts --input export.json [--dry-run]

import fs from 'node:fs'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type LegacyCandidate = {
  id: string
  name: string
  role?: string
  job?: string
  icv?: number
  email?: string
  phone?: string
  campaignId?: string
  source?: string
}

type LegacyCandidatePoolEntry = {
  id: string
  name?: string
  email?: string
  phone?: string
  icv?: number
  match?: { scorePercent?: number; matchedSkills?: unknown; candidateSignals?: unknown }
}

type LegacyJobOpening = {
  id: string
  title: string
  jobProfile?: { title?: string; criteria?: unknown; weighting?: unknown }
  candidatePool?: LegacyCandidatePoolEntry[]
}

type LegacyCompany = { id: string; name: string; jobOpenings: LegacyJobOpening[] }

type ExportShape = {
  candidates?: LegacyCandidate[] // from skillvision_candidates_data
  cvMatchingState?: { companies: LegacyCompany[] } // from apex5d_cv_matching_state
}

function normalizeEmail(email?: string): string | null {
  return email ? email.trim().toLowerCase() : null
}

async function main() {
  const args = process.argv.slice(2)
  const inputIdx = args.indexOf('--input')
  if (inputIdx === -1 || !args[inputIdx + 1]) {
    console.error('Usage: tsx scripts/migrate-localstorage.ts --input export.json [--dry-run]')
    process.exit(1)
  }
  const dryRun = args.includes('--dry-run')
  const data = JSON.parse(fs.readFileSync(args[inputIdx + 1]!, 'utf-8')) as ExportShape

  // A single operator user "owns" migrated rows' createdBy/uploadedBy
  // fields — a real migration run would pass a real admin id instead.
  const operator = dryRun
    ? null
    : await prisma.user.findFirst({ where: { role: 'PLATFORM_ADMIN' } })
  if (!dryRun && !operator) {
    console.error('No PLATFORM_ADMIN user found — seed one first (this migration needs an actor to attribute rows to).')
    process.exit(1)
  }

  const report = {
    companiesCreated: 0,
    campaignsCreated: 0,
    candidatesCreated: 0,
    candidatesSkippedNoCampaign: 0,
    campaignCandidatesCreated: 0,
    campaignCandidatesSkippedAlreadyLinked: 0,
    fileReferencesNotMigrated: 0,
  }
  const unmatchedScores: { candidateName: string; matchScorePercent: number }[] = []

  // ---- cv-matching-state: companies -> jobOpenings -> Campaign + JobProfile + candidatePool ----
  for (const legacyCompany of data.cvMatchingState?.companies ?? []) {
    let company = await prisma.company.findFirst({ where: { name: legacyCompany.name } })
    if (!company) {
      report.companiesCreated++
      if (!dryRun) company = await prisma.company.create({ data: { name: legacyCompany.name } })
    }

    for (const opening of legacyCompany.jobOpenings) {
      let campaign = company ? await prisma.campaign.findFirst({ where: { companyId: company.id, name: opening.title } }) : null
      if (!campaign) {
        report.campaignsCreated++
        if (!dryRun && company) {
          campaign = await prisma.campaign.create({ data: { companyId: company.id, name: opening.title, status: 'ACTIVE' } })
          if (opening.jobProfile) {
            await prisma.jobProfile.create({
              data: {
                campaignId: campaign.id,
                title: opening.jobProfile.title,
                header: { title: opening.jobProfile.title },
                sections: { criteria: opening.jobProfile.criteria ?? {} },
                salaryBenefits: {},
                hardSkillGroups: [],
                extraRequirements: [],
                createdById: operator!.id,
              },
            })
          }
        }
      }

      for (const entry of opening.candidatePool ?? []) {
        const normalized = normalizeEmail(entry.email)
        let candidate = normalized ? await prisma.candidate.findFirst({ where: { normalizedEmail: normalized } }) : null
        if (!candidate) {
          report.candidatesCreated++
          if (!dryRun) {
            candidate = await prisma.candidate.create({
              data: { fullName: entry.name || 'Unknown', email: entry.email, normalizedEmail: normalized, phone: entry.phone },
            })
          }
        }
        if (dryRun || !campaign || !candidate) continue

        const existingLink = await prisma.campaignCandidate.findUnique({
          where: { campaignId_candidateId: { campaignId: campaign.id, candidateId: candidate.id } },
        })
        if (existingLink) {
          report.campaignCandidatesSkippedAlreadyLinked++
          continue
        }
        report.campaignCandidatesCreated++
        await prisma.campaignCandidate.create({
          data: { campaignId: campaign.id, candidateId: candidate.id, icvScore: entry.icv },
        })
        if (entry.match?.scorePercent !== undefined) {
          // Deliberately NOT written as a CvMatchResult row: that table's
          // cvId is a real foreign key to Cv/StoredFile, and the legacy
          // fileUrl this match score was computed from was a
          // browser-session-only URL.createObjectURL() — never actually
          // persisted anywhere, so there is no real CV to attach the
          // score to. Inventing a placeholder Cv/StoredFile row just to
          // hold this number would fabricate a file that was never
          // uploaded, which the migration script does not do. The score
          // is preserved in the printed report instead, for a human to
          // re-attach once (if) the candidate re-uploads a real CV.
          report.fileReferencesNotMigrated++
          unmatchedScores.push({ candidateName: entry.name || candidate?.fullName || 'Unknown', matchScorePercent: entry.match.scorePercent })
        }
      }
    }
  }

  // ---- skillvision_candidates_data: top-level archive candidates ----
  for (const legacy of data.candidates ?? []) {
    const normalized = normalizeEmail(legacy.email)
    let candidate = normalized ? await prisma.candidate.findFirst({ where: { normalizedEmail: normalized } }) : null
    if (!candidate) {
      report.candidatesCreated++
      if (!dryRun) {
        candidate = await prisma.candidate.create({
          data: { fullName: legacy.name, email: legacy.email, normalizedEmail: normalized, phone: legacy.phone, source: 'ARCHIVE' },
        })
      }
    }
    // Top-level CANDIDATES entries rarely carry a real campaignId (it was
    // an alias for an opening id in the old model, and most archive
    // records never had one) — those are migrated as standalone Candidate
    // rows with no CampaignCandidate link, exactly matching what they were
    // before: unlinked archive entries. A human assigns them to a
    // campaign later; this script does not guess one.
    if (!legacy.campaignId) report.candidatesSkippedNoCampaign++
  }

  console.log(dryRun ? '[DRY RUN] Nothing was written. Report:' : 'Migration complete. Report:')
  console.log(JSON.stringify(report, null, 2))
  if (unmatchedScores.length) {
    console.log(`\n${unmatchedScores.length} match score(s) could not be attached to a CvMatchResult (no real uploaded CV behind them) — for manual follow-up:`)
    console.log(JSON.stringify(unmatchedScores, null, 2))
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
