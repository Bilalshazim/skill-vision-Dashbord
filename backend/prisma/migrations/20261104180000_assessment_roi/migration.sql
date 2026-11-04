-- I dati del motore ROI di una società: bilancio, voci a mano, atteso fissato.
CREATE TABLE "AssessmentRoi" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "attesoLocked" DOUBLE PRECISION,
    "attesoLockedAt" TIMESTAMP(3),
    "attesoCriteria" TEXT,
    "attesoLockedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentRoi_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentRoi_companyId_key" ON "AssessmentRoi"("companyId");

ALTER TABLE "AssessmentRoi" ADD CONSTRAINT "AssessmentRoi_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
