/*
  Warnings:

  - You are about to drop the column `estimatedTimeSeconds` on the `Goal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "estimatedTimeSeconds",
ADD COLUMN     "deepEstimateTotalSeconds" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Task_estimatedTimeSeconds_idx" ON "Task"("estimatedTimeSeconds");
