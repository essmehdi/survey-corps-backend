-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_answerId_fkey";

-- AlterTable
ALTER TABLE "Submission" ALTER COLUMN "answerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
