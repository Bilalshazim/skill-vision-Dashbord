-- Persone importate dai test: origine, identificativo del test e dati anagrafici.
ALTER TABLE "Employee" ADD COLUMN "externalSource" TEXT,
ADD COLUMN "externalId" TEXT,
ADD COLUMN "externalUpdatedAt" TIMESTAMP(3),
ADD COLUMN "birthYear" INTEGER,
ADD COLUMN "externalProfile" JSONB;

CREATE UNIQUE INDEX "Employee_companyId_externalSource_externalId_key" ON "Employee"("companyId", "externalSource", "externalId");
