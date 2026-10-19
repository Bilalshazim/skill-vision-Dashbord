-- CreateEnum
CREATE TYPE "EvaluatorFormKind" AS ENUM ('INTERVISTA', 'VALUTAZIONE');

-- CreateTable
CREATE TABLE "EvaluatorFormSend" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "kind" "EvaluatorFormKind" NOT NULL,
    "sentById" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluatorFormSend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluatorFormUpload" (
    "id" TEXT NOT NULL,
    "campaignCandidateId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "kind" "EvaluatorFormKind" NOT NULL,
    "fileId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EvaluatorFormUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvaluatorFormSend_campaignId_evaluatorId_idx" ON "EvaluatorFormSend"("campaignId", "evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluatorFormUpload_fileId_key" ON "EvaluatorFormUpload"("fileId");

-- CreateIndex
CREATE INDEX "EvaluatorFormUpload_campaignCandidateId_idx" ON "EvaluatorFormUpload"("campaignCandidateId");

-- AddForeignKey
ALTER TABLE "EvaluatorFormSend" ADD CONSTRAINT "EvaluatorFormSend_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluatorFormSend" ADD CONSTRAINT "EvaluatorFormSend_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "Evaluator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluatorFormUpload" ADD CONSTRAINT "EvaluatorFormUpload_campaignCandidateId_fkey" FOREIGN KEY ("campaignCandidateId") REFERENCES "CampaignCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluatorFormUpload" ADD CONSTRAINT "EvaluatorFormUpload_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "Evaluator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluatorFormUpload" ADD CONSTRAINT "EvaluatorFormUpload_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "StoredFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
