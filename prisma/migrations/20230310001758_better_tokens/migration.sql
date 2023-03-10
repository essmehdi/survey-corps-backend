/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `RegistrationToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `RegistrationToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RegistrationToken" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationToken_userId_key" ON "RegistrationToken"("userId");

-- AddForeignKey
ALTER TABLE "RegistrationToken" ADD CONSTRAINT "RegistrationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
