/*
  Warnings:

  - You are about to drop the column `tokenId` on the `Submission` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[submissionId]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[questionId,answerId,submissionId]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `submissionId` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_tokenId_fkey";

-- DropIndex
DROP INDEX "Submission_questionId_answerId_tokenId_key";

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "tokenId",
ADD COLUMN     "submissionId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "submitted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Submission_submissionId_key" ON "Submission"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_questionId_answerId_submissionId_key" ON "Submission"("questionId", "answerId", "submissionId");
