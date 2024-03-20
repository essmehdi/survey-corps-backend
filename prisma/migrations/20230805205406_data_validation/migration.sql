/*
  Warnings:

  - You are about to alter the column `title` on the `Answer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `fullname` on the `Application` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - You are about to alter the column `email` on the `Application` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(150)`.
  - You are about to alter the column `title` on the `Question` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(150)`.
  - You are about to alter the column `regex` on the `Question` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(300)`.
  - You are about to alter the column `description` on the `Question` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `title` on the `QuestionSection` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(150)`.
  - You are about to alter the column `description` on the `QuestionSection` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `other` on the `Submission` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `email` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(150)`.
  - You are about to alter the column `password` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(250)`.
  - You are about to alter the column `firstname` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `lastname` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.

*/
-- AlterTable
ALTER TABLE "Answer" ALTER COLUMN "title" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "fullname" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(150);

-- AlterTable
ALTER TABLE "Question" ALTER COLUMN "title" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "regex" SET DATA TYPE VARCHAR(300),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "QuestionSection" ALTER COLUMN "title" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "Submission" ALTER COLUMN "other" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(250),
ALTER COLUMN "firstname" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "lastname" SET DATA TYPE VARCHAR(100);
