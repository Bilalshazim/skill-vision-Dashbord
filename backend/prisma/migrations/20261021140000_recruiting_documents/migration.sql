-- Recruiting sul server (PROGETTO-TUTTO-SUL-SERVER.md, Parti 4–9): i dati che
-- Recruiting teneva nel browser, uno per area. Solo una tabella nuova.
-- CreateTable
CREATE TABLE "RecruitingDocument" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecruitingDocument_scope_key_key" ON "RecruitingDocument"("scope", "key");

