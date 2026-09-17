-- CreateEnum
CREATE TYPE "PlatformModule" AS ENUM ('RECRUITING', 'ASSESSMENT');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "purchasedModules" "PlatformModule"[] DEFAULT ARRAY[]::"PlatformModule"[];

-- CreateTable
CREATE TABLE "AccessCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "module" "PlatformModule" NOT NULL,
    "companyId" TEXT,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessCode_code_key" ON "AccessCode"("code");

-- CreateIndex
CREATE INDEX "AccessCode_companyId_idx" ON "AccessCode"("companyId");

-- AddForeignKey
ALTER TABLE "AccessCode" ADD CONSTRAINT "AccessCode_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
