-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('SICK', 'CASUAL', 'EARNED', 'OTHER');

-- CreateEnum
CREATE TYPE "TrackingStatus" AS ENUM ('CHECKED_IN', 'CHECKED_OUT', 'LATE', 'OFFLINE');

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "remarks" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "isTeamLead" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TeamLead" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "teamName" TEXT,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamLeadEmployee" (
    "id" SERIAL NOT NULL,
    "teamLeadId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamLeadEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamLead_userId_key" ON "TeamLead"("userId");

-- CreateIndex
CREATE INDEX "TeamLead_userId_idx" ON "TeamLead"("userId");

-- CreateIndex
CREATE INDEX "TeamLeadEmployee_teamLeadId_idx" ON "TeamLeadEmployee"("teamLeadId");

-- CreateIndex
CREATE INDEX "TeamLeadEmployee_employeeId_idx" ON "TeamLeadEmployee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamLeadEmployee_teamLeadId_employeeId_key" ON "TeamLeadEmployee"("teamLeadId", "employeeId");

-- CreateIndex
CREATE INDEX "LeaveRequest_employeeId_idx" ON "LeaveRequest"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- AddForeignKey
ALTER TABLE "TeamLead" ADD CONSTRAINT "TeamLead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeadEmployee" ADD CONSTRAINT "TeamLeadEmployee_teamLeadId_fkey" FOREIGN KEY ("teamLeadId") REFERENCES "TeamLead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeadEmployee" ADD CONSTRAINT "TeamLeadEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
