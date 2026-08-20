/*
  Warnings:

  - You are about to drop the column `avatarFile` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Media_userId_status_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatarFile",
DROP COLUMN "passwordHash",
ADD COLUMN     "password" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Media_userId_status_favorite_idx" ON "Media"("userId", "status", "favorite");
