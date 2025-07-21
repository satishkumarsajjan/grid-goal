-- AlterTable
ALTER TABLE "FocusSession" ADD COLUMN     "sequenceId" TEXT;

-- CreateIndex
CREATE INDEX "FocusSession_sequenceId_idx" ON "FocusSession"("sequenceId");
