-- AlterTable
ALTER TABLE "files" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "files_userId_deletedAt_idx" ON "files"("userId", "deletedAt");
