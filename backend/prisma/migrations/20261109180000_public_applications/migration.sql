-- Parte C (Decisioni del 2026-11-09): candidature dal link pubblico dell'annuncio.
ALTER TABLE "Company" ADD COLUMN "candidatePrivacyController" TEXT;
ALTER TABLE "Company" ADD COLUMN "candidatePrivacyEmail" TEXT;

CREATE TYPE "PublicApplicationStatus" AS ENUM ('PENDING', 'IMPORTED');

CREATE TABLE "PublicApplication" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "jobProfileId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "campaignCandidateId" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "retention" "CvRetentionChoice" NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "status" "PublicApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "importedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PublicApplication_companyId_status_idx" ON "PublicApplication"("companyId", "status");
CREATE INDEX "PublicApplication_campaignId_idx" ON "PublicApplication"("campaignId");

ALTER TABLE "PublicApplication" ADD CONSTRAINT "PublicApplication_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
