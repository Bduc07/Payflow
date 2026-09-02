/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `Merchant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "profilePicture" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_googleId_key" ON "Merchant"("googleId");
