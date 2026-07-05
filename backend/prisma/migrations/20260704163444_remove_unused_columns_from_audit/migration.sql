/*
  Warnings:

  - You are about to drop the column `distanceBetween` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `selfiePublicId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `proofPublicId` on the `LeaveRequest` table. All the data in the column will be lost.
  - You are about to drop the column `proofUrl` on the `LeaveRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "distanceBetween",
DROP COLUMN "selfiePublicId";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "remarks";

-- AlterTable
ALTER TABLE "LeaveRequest" DROP COLUMN "proofPublicId",
DROP COLUMN "proofUrl";
