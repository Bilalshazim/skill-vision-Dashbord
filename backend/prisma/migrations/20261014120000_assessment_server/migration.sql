-- Assessment sul server (PROGETTO-ASSESSMENT-SERVER.md §8, decisioni del
-- 2026-10-14). Solo tabelle nuove, più una modifica additiva a
-- TestInvitation: nessun dato di Recruiting cambia. Le righe esistenti
-- hanno tutte shortlistId, quindi il CHECK in fondo passa su di loro.

-- CreateEnum
CREATE TYPE "AssessmentSource" AS ENUM ('RESP', 'PEER', 'AUTO');

-- CreateEnum
CREATE TYPE "EmployeeContractType" AS ENUM ('DIPENDENTE', 'COCOPRO', 'PARTITA_IVA', 'ESTERNO');

-- CreateEnum
CREATE TYPE "EmployeeArchiveReason" AS ENUM ('PENSIONE', 'LICENZIAMENTO', 'PROBATION', 'ALTRO');

-- CreateEnum
CREATE TYPE "AbsenceCategory" AS ENUM ('FERIE', 'PERMESSO', 'FORMAZIONE', 'CONGEDO', 'ALTRO');

-- CreateEnum
CREATE TYPE "EvaluationAssignmentStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AssessmentModulo" AS ENUM ('A', 'B', 'AB');

-- CreateEnum
CREATE TYPE "SurveySenderMode" AS ENUM ('REFERENTE', 'ADMIN');

-- AlterTable
ALTER TABLE "TestInvitation" ADD COLUMN     "employeeId" TEXT,
ALTER COLUMN "shortlistId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "email" TEXT,
    "sesso" TEXT NOT NULL DEFAULT '',
    "area" TEXT NOT NULL DEFAULT '',
    "reparto" TEXT NOT NULL DEFAULT '',
    "ruolo" TEXT NOT NULL DEFAULT '',
    "mansione" TEXT NOT NULL DEFAULT '',
    "tipoProfilo" TEXT NOT NULL DEFAULT 'Employee',
    "tipoContratto" "EmployeeContractType" NOT NULL DEFAULT 'DIPENDENTE',
    "livelloCcnl" TEXT NOT NULL DEFAULT '',
    "ral" DECIMAL(12,2),
    "benefit" TEXT NOT NULL DEFAULT '',
    "feedbackNeeded" BOOLEAN NOT NULL DEFAULT false,
    "developmentPlan" JSONB NOT NULL DEFAULT '{}',
    "softSkillOverrides" JSONB,
    "responsabileClientId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "archiveReason" "EmployeeArchiveReason",
    "archiveNote" TEXT,
    "surveySentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAbsence" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "dal" DATE,
    "al" DATE,
    "category" "AbsenceCategory" NOT NULL DEFAULT 'ALTRO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeAbsence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentPeriod" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSoftScore" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "ottenuto" DOUBLE PRECISION NOT NULL,
    "atteso" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSoftScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeHardSource" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "source" "AssessmentSource" NOT NULL,
    "evaluatedBy" TEXT NOT NULL DEFAULT '',
    "scores" JSONB NOT NULL DEFAULT '{}',
    "notes" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeHardSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftAssessmentSnapshot" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "overallOttenuto" DOUBLE PRECISION NOT NULL,
    "overallAtteso" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoftAssessmentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardAssessmentSnapshot" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "periodClientId" TEXT NOT NULL DEFAULT '',
    "periodLabel" TEXT NOT NULL DEFAULT '',
    "date" TIMESTAMP(3) NOT NULL,
    "source" "AssessmentSource" NOT NULL,
    "apexScore" DOUBLE PRECISION NOT NULL,
    "dims" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HardAssessmentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRoleProfile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillWeights" JSONB,
    "skillExpected" JSONB,
    "equivalenceClass" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRoleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeEvaluationAssignment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "targetEmployeeId" TEXT NOT NULL,
    "source" "AssessmentSource" NOT NULL,
    "evaluatorName" TEXT NOT NULL,
    "evaluatorEmail" TEXT NOT NULL DEFAULT '',
    "accessToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "status" "EvaluationAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeEvaluationAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "modulo" "AssessmentModulo" NOT NULL DEFAULT 'AB',
    "companyName" TEXT NOT NULL DEFAULT '',
    "testsAcquired" INTEGER NOT NULL DEFAULT 0,
    "testsDispatched" INTEGER NOT NULL DEFAULT 0,
    "surveyLink" TEXT NOT NULL DEFAULT '',
    "softSkillTargets" JSONB NOT NULL DEFAULT '{}',
    "surveySenderMode" "SurveySenderMode" NOT NULL DEFAULT 'REFERENTE',
    "adminSenderEmail" TEXT NOT NULL DEFAULT '',
    "actionNotes" JSONB NOT NULL DEFAULT '{}',
    "preTestLetter" TEXT NOT NULL DEFAULT '',
    "surveyEmailSubject" TEXT NOT NULL DEFAULT '',
    "surveyEmailBody" TEXT NOT NULL DEFAULT '',
    "evaluators" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentCompanyProfile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "locations" JSONB NOT NULL DEFAULT '[]',
    "contacts" JSONB NOT NULL DEFAULT '[]',
    "referente" JSONB NOT NULL DEFAULT '{}',
    "ceo" JSONB NOT NULL DEFAULT '{}',
    "cfo" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentCompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveInterview" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Valutazione5p" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Valutazione5p_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Employee_companyId_idx" ON "Employee"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_companyId_clientId_key" ON "Employee"("companyId", "clientId");

-- CreateIndex
CREATE INDEX "EmployeeAbsence_employeeId_idx" ON "EmployeeAbsence"("employeeId");

-- CreateIndex
CREATE INDEX "AssessmentPeriod_companyId_idx" ON "AssessmentPeriod"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentPeriod_companyId_clientId_key" ON "AssessmentPeriod"("companyId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSoftScore_employeeId_skillId_key" ON "EmployeeSoftScore"("employeeId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeHardSource_employeeId_source_key" ON "EmployeeHardSource"("employeeId", "source");

-- CreateIndex
CREATE INDEX "SoftAssessmentSnapshot_employeeId_date_idx" ON "SoftAssessmentSnapshot"("employeeId", "date");

-- CreateIndex
CREATE INDEX "HardAssessmentSnapshot_employeeId_date_idx" ON "HardAssessmentSnapshot"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "JobRoleProfile_companyId_roleName_key" ON "JobRoleProfile"("companyId", "roleName");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeEvaluationAssignment_accessToken_key" ON "EmployeeEvaluationAssignment"("accessToken");

-- CreateIndex
CREATE INDEX "EmployeeEvaluationAssignment_companyId_idx" ON "EmployeeEvaluationAssignment"("companyId");

-- CreateIndex
CREATE INDEX "EmployeeEvaluationAssignment_targetEmployeeId_idx" ON "EmployeeEvaluationAssignment"("targetEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeEvaluationAssignment_companyId_clientId_key" ON "EmployeeEvaluationAssignment"("companyId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSettings_companyId_key" ON "AssessmentSettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentCompanyProfile_companyId_key" ON "AssessmentCompanyProfile"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutiveInterview_companyId_key" ON "ExecutiveInterview"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Valutazione5p_companyId_key" ON "Valutazione5p"("companyId");

-- CreateIndex
CREATE INDEX "TestInvitation_employeeId_idx" ON "TestInvitation"("employeeId");

-- AddForeignKey
ALTER TABLE "TestInvitation" ADD CONSTRAINT "TestInvitation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAbsence" ADD CONSTRAINT "EmployeeAbsence_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentPeriod" ADD CONSTRAINT "AssessmentPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSoftScore" ADD CONSTRAINT "EmployeeSoftScore_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeHardSource" ADD CONSTRAINT "EmployeeHardSource_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftAssessmentSnapshot" ADD CONSTRAINT "SoftAssessmentSnapshot_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardAssessmentSnapshot" ADD CONSTRAINT "HardAssessmentSnapshot_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRoleProfile" ADD CONSTRAINT "JobRoleProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEvaluationAssignment" ADD CONSTRAINT "EmployeeEvaluationAssignment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEvaluationAssignment" ADD CONSTRAINT "EmployeeEvaluationAssignment_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AssessmentPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEvaluationAssignment" ADD CONSTRAINT "EmployeeEvaluationAssignment_targetEmployeeId_fkey" FOREIGN KEY ("targetEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSettings" ADD CONSTRAINT "AssessmentSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCompanyProfile" ADD CONSTRAINT "AssessmentCompanyProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveInterview" ADD CONSTRAINT "ExecutiveInterview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Valutazione5p" ADD CONSTRAINT "Valutazione5p_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Un invito ha esattamente un destinatario: un candidato in shortlist
-- (Recruiting) oppure un dipendente (Assessment). Prisma non esprime i CHECK.
ALTER TABLE "TestInvitation" ADD CONSTRAINT "TestInvitation_one_recipient"
  CHECK (("shortlistId" IS NULL) <> ("employeeId" IS NULL));
