-- DropIndex
DROP INDEX "Condition_questionId_answerId_key";

-- AlterTable
ALTER TABLE "Condition" ALTER COLUMN "answerId" DROP NOT NULL;
