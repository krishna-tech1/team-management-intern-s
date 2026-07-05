/*
  Warnings:

  - You are about to drop the column `teamStrengthId` on the `Employee` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_teamStrengthId_fkey";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "teamStrengthId";
