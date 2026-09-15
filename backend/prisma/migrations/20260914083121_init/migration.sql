-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'EVALUATOR', 'READONLY');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');

-- CreateEnum
CREATE TYPE "PlatformStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CipOwnerType" AS ENUM ('PLATFORM', 'COMPANY', 'CAMPAIGN');

-- CreateEnum
CREATE TYPE "CipStatus" AS ENUM ('ACTIVE', 'VOIDED');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('EXPLICIT', 'IMPLICIT', 'DECLINED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CvRetentionChoice" AS ENUM ('TWO_YEARS', 'SIX_MONTHS');

-- CreateEnum
CREATE TYPE "CandidateSource" AS ENUM ('ARCHIVE', 'NEW_APPLICANT', 'MANUAL');

-- CreateEnum
CREATE TYPE "CampaignCandidateStatus" AS ENUM ('IN_POOL', 'SHORTLISTED', 'TEST_DA_INVIARE', 'TEST_INVIATO', 'TEST_HA_RISPOSTO', 'TEST_NON_HA_RISPOSTO', 'INTERVIEW', 'DECISION_WON', 'DECISION_LOST', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CvStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "Fascia" AS ENUM ('EXCELLENT', 'DEVELOPABLE', 'GAP', 'NOT_RECOMMENDED');

-- CreateEnum
CREATE TYPE "ShortlistStatus" AS ENUM ('DA_INVIARE', 'INVIATO', 'HA_RISPOSTO', 'NON_HA_RISPOSTO');

-- CreateEnum
CREATE TYPE "ShortlistSource" AS ENUM ('CV_ELABORATI', 'MANUAL');

-- CreateEnum
CREATE TYPE "SentStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "ReceivedVia" AS ENUM ('WEBHOOK', 'MANUAL');

-- CreateEnum
CREATE TYPE "EvaluatorRole" AS ENUM ('HR', 'MANAGER', 'DIRETTORE_HR', 'ALTRO');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "EvaluationRecommendation" AS ENUM ('PROCEDI', 'RISERVA', 'CONFRONTA', 'NO');

-- CreateEnum
CREATE TYPE "CandidateProfileStatus" AS ENUM ('DRAFT', 'SAVED', 'APPROVED', 'PUBLICATION_READY', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('COMPANY_HR', 'SKILLVISION_ADMIN');

-- CreateEnum
CREATE TYPE "EmailServiceScope" AS ENUM ('GLOBAL', 'PLATFORM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "companyId" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "PlatformStatus" NOT NULL DEFAULT 'PENDING',
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "platformId" TEXT,
    "name" TEXT NOT NULL,
    "vatNumber" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cip" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "year2" INTEGER NOT NULL,
    "sellerCodeId" TEXT NOT NULL,
    "month2" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "ownerType" "CipOwnerType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "CipStatus" NOT NULL DEFAULT 'ACTIVE',
    "generatedById" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voidedAt" TIMESTAMP(3),
    "voidedById" TEXT,
    "voidReason" TEXT,

    CONSTRAINT "Cip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "normalizedEmail" TEXT,
    "phone" TEXT,
    "consentStatus" "ConsentStatus",
    "cvRetentionChoice" "CvRetentionChoice",
    "cvRetentionExpiresAt" TIMESTAMP(3),
    "source" "CandidateSource",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignCandidate" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "roleApplied" TEXT,
    "icvScore" DOUBLE PRECISION,
    "status" "CampaignCandidateStatus" NOT NULL DEFAULT 'IN_POOL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cv" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "campaignId" TEXT,
    "fileId" TEXT NOT NULL,
    "status" "CvStatus" NOT NULL DEFAULT 'UPLOADED',
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobProfile" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT,
    "header" JSONB NOT NULL DEFAULT '{}',
    "sections" JSONB NOT NULL DEFAULT '{}',
    "hardSkillGroups" JSONB NOT NULL DEFAULT '[]',
    "extraRequirements" JSONB NOT NULL DEFAULT '[]',
    "salaryBenefits" JSONB NOT NULL DEFAULT '{}',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CvMatchResult" (
    "id" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "jobProfileId" TEXT,
    "matchScorePercent" DOUBLE PRECISION NOT NULL,
    "matchBreakdown" JSONB NOT NULL DEFAULT '{}',
    "ahiScore" DOUBLE PRECISION,
    "fascia" "Fascia",
    "hardRedFlag" BOOLEAN NOT NULL DEFAULT false,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CvMatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shortlist" (
    "id" TEXT NOT NULL,
    "campaignCandidateId" TEXT NOT NULL,
    "status" "ShortlistStatus" NOT NULL DEFAULT 'DA_INVIARE',
    "selectedFrom" "ShortlistSource" NOT NULL,
    "addedById" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shortlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NonResponseThresholdConfig" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "thresholdDays" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NonResponseThresholdConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestInvitation" (
    "id" TEXT NOT NULL,
    "shortlistId" TEXT NOT NULL,
    "testLink" TEXT NOT NULL,
    "messageTemplateId" TEXT,
    "senderConfigId" TEXT NOT NULL,
    "sentStatus" "SentStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResponse" (
    "id" TEXT NOT NULL,
    "testInvitationId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "rawResult" JSONB,
    "receivedVia" "ReceivedVia" NOT NULL,
    "webhookEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestProviderConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "webhookSecretRef" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "configuredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "campaignCandidateId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "overallScore" DOUBLE PRECISION,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluator" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "EvaluatorRole" NOT NULL,
    "altroLabel" TEXT,
    "companyId" TEXT,
    "accessTokenHash" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignEvaluatorAssignment" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignEvaluatorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "campaignCandidateId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "scores" JSONB NOT NULL DEFAULT '{}',
    "finalScore" DOUBLE PRECISION,
    "recommendation" "EvaluationRecommendation",
    "notes" TEXT,
    "signedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "campaignCandidateId" TEXT NOT NULL,
    "status" "CandidateProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "content" JSONB NOT NULL DEFAULT '{}',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "publicationLink" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SenderConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "replyToEmail" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SenderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "campaignId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailServiceConfig" (
    "id" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "apiEndpointUrl" TEXT NOT NULL,
    "apiKeySecretRef" TEXT NOT NULL,
    "scope" "EmailServiceScope" NOT NULL DEFAULT 'GLOBAL',
    "platformId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailServiceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "candidateId" TEXT,
    "campaignId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "retentionExpiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Company_platformId_idx" ON "Company"("platformId");

-- CreateIndex
CREATE INDEX "Campaign_companyId_idx" ON "Campaign"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerCode_code_key" ON "SellerCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Cip_code_key" ON "Cip"("code");

-- CreateIndex
CREATE INDEX "Cip_ownerType_ownerId_idx" ON "Cip"("ownerType", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Cip_year2_sellerCodeId_month2_sequence_key" ON "Cip"("year2", "sellerCodeId", "month2", "sequence");

-- CreateIndex
CREATE INDEX "Candidate_normalizedEmail_idx" ON "Candidate"("normalizedEmail");

-- CreateIndex
CREATE INDEX "CampaignCandidate_campaignId_status_idx" ON "CampaignCandidate"("campaignId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignCandidate_campaignId_candidateId_key" ON "CampaignCandidate"("campaignId", "candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "Cv_fileId_key" ON "Cv"("fileId");

-- CreateIndex
CREATE INDEX "Cv_candidateId_idx" ON "Cv"("candidateId");

-- CreateIndex
CREATE INDEX "Cv_campaignId_idx" ON "Cv"("campaignId");

-- CreateIndex
CREATE INDEX "JobProfile_campaignId_idx" ON "JobProfile"("campaignId");

-- CreateIndex
CREATE INDEX "CvMatchResult_campaignId_idx" ON "CvMatchResult"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "CvMatchResult_cvId_campaignId_key" ON "CvMatchResult"("cvId", "campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "Shortlist_campaignCandidateId_key" ON "Shortlist"("campaignCandidateId");

-- CreateIndex
CREATE UNIQUE INDEX "NonResponseThresholdConfig_campaignId_key" ON "NonResponseThresholdConfig"("campaignId");

-- CreateIndex
CREATE INDEX "TestInvitation_shortlistId_idx" ON "TestInvitation"("shortlistId");

-- CreateIndex
CREATE UNIQUE INDEX "TestResponse_testInvitationId_key" ON "TestResponse"("testInvitationId");

-- CreateIndex
CREATE UNIQUE INDEX "TestResponse_webhookEventId_key" ON "TestResponse"("webhookEventId");

-- CreateIndex
CREATE INDEX "Interview_campaignCandidateId_idx" ON "Interview"("campaignCandidateId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluator_userId_key" ON "Evaluator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluator_accessTokenHash_key" ON "Evaluator"("accessTokenHash");

-- CreateIndex
CREATE INDEX "Evaluator_companyId_idx" ON "Evaluator"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignEvaluatorAssignment_campaignId_evaluatorId_key" ON "CampaignEvaluatorAssignment"("campaignId", "evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_campaignCandidateId_evaluatorId_key" ON "Evaluation"("campaignCandidateId", "evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_campaignCandidateId_key" ON "CandidateProfile"("campaignCandidateId");

-- CreateIndex
CREATE INDEX "SenderConfig_companyId_idx" ON "SenderConfig"("companyId");

-- CreateIndex
CREATE INDEX "EmailTemplate_companyId_idx" ON "EmailTemplate"("companyId");

-- CreateIndex
CREATE INDEX "EmailTemplate_campaignId_idx" ON "EmailTemplate"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "StoredFile_storageKey_key" ON "StoredFile"("storageKey");

-- CreateIndex
CREATE INDEX "StoredFile_candidateId_idx" ON "StoredFile"("candidateId");

-- CreateIndex
CREATE INDEX "StoredFile_retentionExpiresAt_idx" ON "StoredFile"("retentionExpiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_occurredAt_idx" ON "AuditLog"("occurredAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cip" ADD CONSTRAINT "Cip_sellerCodeId_fkey" FOREIGN KEY ("sellerCodeId") REFERENCES "SellerCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cip" ADD CONSTRAINT "Cip_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cip" ADD CONSTRAINT "Cip_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCandidate" ADD CONSTRAINT "CampaignCandidate_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCandidate" ADD CONSTRAINT "CampaignCandidate_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cv" ADD CONSTRAINT "Cv_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cv" ADD CONSTRAINT "Cv_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cv" ADD CONSTRAINT "Cv_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "StoredFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cv" ADD CONSTRAINT "Cv_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobProfile" ADD CONSTRAINT "JobProfile_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobProfile" ADD CONSTRAINT "JobProfile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvMatchResult" ADD CONSTRAINT "CvMatchResult_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "Cv"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvMatchResult" ADD CONSTRAINT "CvMatchResult_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvMatchResult" ADD CONSTRAINT "CvMatchResult_jobProfileId_fkey" FOREIGN KEY ("jobProfileId") REFERENCES "JobProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlist" ADD CONSTRAINT "Shortlist_campaignCandidateId_fkey" FOREIGN KEY ("campaignCandidateId") REFERENCES "CampaignCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlist" ADD CONSTRAINT "Shortlist_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestInvitation" ADD CONSTRAINT "TestInvitation_shortlistId_fkey" FOREIGN KEY ("shortlistId") REFERENCES "Shortlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestInvitation" ADD CONSTRAINT "TestInvitation_messageTemplateId_fkey" FOREIGN KEY ("messageTemplateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestInvitation" ADD CONSTRAINT "TestInvitation_senderConfigId_fkey" FOREIGN KEY ("senderConfigId") REFERENCES "SenderConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestInvitation" ADD CONSTRAINT "TestInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResponse" ADD CONSTRAINT "TestResponse_testInvitationId_fkey" FOREIGN KEY ("testInvitationId") REFERENCES "TestInvitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestProviderConfig" ADD CONSTRAINT "TestProviderConfig_configuredById_fkey" FOREIGN KEY ("configuredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_campaignCandidateId_fkey" FOREIGN KEY ("campaignCandidateId") REFERENCES "CampaignCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluator" ADD CONSTRAINT "Evaluator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluator" ADD CONSTRAINT "Evaluator_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignEvaluatorAssignment" ADD CONSTRAINT "CampaignEvaluatorAssignment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignEvaluatorAssignment" ADD CONSTRAINT "CampaignEvaluatorAssignment_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "Evaluator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_campaignCandidateId_fkey" FOREIGN KEY ("campaignCandidateId") REFERENCES "CampaignCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "Evaluator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_campaignCandidateId_fkey" FOREIGN KEY ("campaignCandidateId") REFERENCES "CampaignCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderConfig" ADD CONSTRAINT "SenderConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderConfig" ADD CONSTRAINT "SenderConfig_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailServiceConfig" ADD CONSTRAINT "EmailServiceConfig_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailServiceConfig" ADD CONSTRAINT "EmailServiceConfig_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
