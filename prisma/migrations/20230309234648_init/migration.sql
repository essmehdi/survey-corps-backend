-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'GRANTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Privilege" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('FREEFIELD', 'SINGLE_CHOICE', 'MULTIPLE_CHOICES');

-- CreateTable
CREATE TABLE "RegistrationToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "RegistrationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "fullname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "privilege" "Privilege" NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condition" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answerId" INTEGER NOT NULL,
    "nextSectionId" INTEGER NOT NULL,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSection" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "nextSectionId" INTEGER,

    CONSTRAINT "QuestionSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL,
    "type" "QuestionType" NOT NULL,
    "hasOther" BOOLEAN,
    "regex" TEXT,
    "nextQuestionId" INTEGER,
    "sectionId" INTEGER NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "questionId" INTEGER NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answerId" INTEGER,
    "other" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submissionId" TEXT NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "fullname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "tokenId" INTEGER,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationToken_token_key" ON "RegistrationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Condition_answerId_key" ON "Condition"("answerId");

-- CreateIndex
CREATE UNIQUE INDEX "Condition_questionId_answerId_key" ON "Condition"("questionId", "answerId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSection_nextSectionId_key" ON "QuestionSection"("nextSectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Question_nextQuestionId_key" ON "Question"("nextQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_questionId_title_key" ON "Answer"("questionId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_questionId_answerId_submissionId_key" ON "Submission"("questionId", "answerId", "submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Token_token_key" ON "Token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Application_email_key" ON "Application"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Application_tokenId_key" ON "Application"("tokenId");

-- CreateIndex
CREATE INDEX "IDX_session_expire" ON "session"("expire");

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_nextSectionId_fkey" FOREIGN KEY ("nextSectionId") REFERENCES "QuestionSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSection" ADD CONSTRAINT "QuestionSection_nextSectionId_fkey" FOREIGN KEY ("nextSectionId") REFERENCES "QuestionSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_nextQuestionId_fkey" FOREIGN KEY ("nextQuestionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "QuestionSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE SET NULL ON UPDATE CASCADE;
