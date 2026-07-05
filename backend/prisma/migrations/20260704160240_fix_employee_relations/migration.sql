-- CreateEnum
CREATE TYPE "ScopeActionType" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'ASSIGN', 'REASSIGN');

-- CreateEnum
CREATE TYPE "NotificationTriggerType" AS ENUM ('TASK_DEADLINE', 'UPCOMING_DEADLINE', 'OVERDUE');

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "distanceBetween" DOUBLE PRECISION,
ADD COLUMN     "locationAccuracy" DOUBLE PRECISION,
ADD COLUMN     "selfiePublicId" TEXT,
ADD COLUMN     "selfieUrl" TEXT,
ADD COLUMN     "workingHours" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicId" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "taskId" INTEGER;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "efficiencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "leaderboardScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "passwordGenerationDate" TIMESTAMP(3),
ADD COLUMN     "performanceRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "profilePhotoPublicId" TEXT,
ADD COLUMN     "profilePhotoUrl" TEXT,
ADD COLUMN     "teamStrengthId" INTEGER;

-- AlterTable
ALTER TABLE "Incentive" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "proofPublicId" TEXT,
ADD COLUMN     "proofUrl" TEXT;

-- AlterTable
ALTER TABLE "TaskWorkAttachment" ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "publicId" TEXT;

-- AlterTable
ALTER TABLE "TaskWorkUpdate" ADD COLUMN     "accuracy" DOUBLE PRECISION,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "TeamLead" ADD COLUMN     "profilePhotoPublicId" TEXT,
ADD COLUMN     "profilePhotoUrl" TEXT;

-- CreateTable
CREATE TABLE "IncentiveFreeze" (
    "id" SERIAL NOT NULL,
    "month" TEXT NOT NULL,
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncentiveFreeze_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GPSTracking" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "accuracy" DOUBLE PRECISION,
    "eventType" TEXT NOT NULL,
    "eventId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GPSTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "pointsThisMonth" INTEGER NOT NULL,
    "pointsLastMonth" INTEGER NOT NULL,
    "totalTasksCompleted" INTEGER NOT NULL,
    "totalWorkHours" DOUBLE PRECISION NOT NULL,
    "averageTaskCompletion" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Performance" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "tasksOverdue" INTEGER NOT NULL DEFAULT 0,
    "tasksPending" INTEGER NOT NULL DEFAULT 0,
    "averageCompletionTime" DOUBLE PRECISION NOT NULL,
    "performanceRating" DOUBLE PRECISION NOT NULL,
    "month" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Efficiency" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "tasksCompletedOnTime" INTEGER NOT NULL,
    "totalTasksAssigned" INTEGER NOT NULL,
    "efficiencyScore" DOUBLE PRECISION NOT NULL,
    "workHoursTracked" DOUBLE PRECISION NOT NULL,
    "workHoursExpected" DOUBLE PRECISION NOT NULL,
    "month" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Efficiency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScopeAction" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "actionType" "ScopeActionType" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "scope" TEXT NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScopeAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpcomingDeadline" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "daysUntilDeadline" INTEGER NOT NULL,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "notificationTime" TIMESTAMP(3),
    "notificationTrigger" "NotificationTriggerType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpcomingDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "oldPassword" TEXT NOT NULL,
    "newPassword" TEXT NOT NULL,
    "resetBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamStrength" (
    "id" SERIAL NOT NULL,
    "teamLeadId" INTEGER NOT NULL,
    "totalMembers" INTEGER NOT NULL,
    "activeMembers" INTEGER NOT NULL,
    "onLeaveMembers" INTEGER NOT NULL,
    "averagePerformance" DOUBLE PRECISION NOT NULL,
    "month" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamStrength_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyTracking" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "trackingDate" TIMESTAMP(3) NOT NULL,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "workHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "documentsUploaded" INTEGER NOT NULL DEFAULT 0,
    "tasksUpdated" INTEGER NOT NULL DEFAULT 0,
    "lastRefreshed" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncentiveFreeze_month_key" ON "IncentiveFreeze"("month");

-- CreateIndex
CREATE INDEX "GPSTracking_employeeId_idx" ON "GPSTracking"("employeeId");

-- CreateIndex
CREATE INDEX "GPSTracking_eventType_idx" ON "GPSTracking"("eventType");

-- CreateIndex
CREATE INDEX "GPSTracking_createdAt_idx" ON "GPSTracking"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_employeeId_key" ON "Leaderboard"("employeeId");

-- CreateIndex
CREATE INDEX "Leaderboard_rank_idx" ON "Leaderboard"("rank");

-- CreateIndex
CREATE INDEX "Leaderboard_score_idx" ON "Leaderboard"("score");

-- CreateIndex
CREATE UNIQUE INDEX "Performance_employeeId_key" ON "Performance"("employeeId");

-- CreateIndex
CREATE INDEX "Performance_employeeId_idx" ON "Performance"("employeeId");

-- CreateIndex
CREATE INDEX "Performance_month_idx" ON "Performance"("month");

-- CreateIndex
CREATE UNIQUE INDEX "Efficiency_employeeId_key" ON "Efficiency"("employeeId");

-- CreateIndex
CREATE INDEX "Efficiency_employeeId_idx" ON "Efficiency"("employeeId");

-- CreateIndex
CREATE INDEX "Efficiency_efficiencyScore_idx" ON "Efficiency"("efficiencyScore");

-- CreateIndex
CREATE INDEX "ScopeAction_employeeId_idx" ON "ScopeAction"("employeeId");

-- CreateIndex
CREATE INDEX "ScopeAction_actionType_idx" ON "ScopeAction"("actionType");

-- CreateIndex
CREATE INDEX "ScopeAction_resource_idx" ON "ScopeAction"("resource");

-- CreateIndex
CREATE INDEX "UpcomingDeadline_employeeId_idx" ON "UpcomingDeadline"("employeeId");

-- CreateIndex
CREATE INDEX "UpcomingDeadline_taskId_idx" ON "UpcomingDeadline"("taskId");

-- CreateIndex
CREATE INDEX "UpcomingDeadline_daysUntilDeadline_idx" ON "UpcomingDeadline"("daysUntilDeadline");

-- CreateIndex
CREATE INDEX "UpcomingDeadline_notificationSent_idx" ON "UpcomingDeadline"("notificationSent");

-- CreateIndex
CREATE INDEX "PasswordReset_employeeId_idx" ON "PasswordReset"("employeeId");

-- CreateIndex
CREATE INDEX "PasswordReset_createdAt_idx" ON "PasswordReset"("createdAt");

-- CreateIndex
CREATE INDEX "TeamStrength_teamLeadId_idx" ON "TeamStrength"("teamLeadId");

-- CreateIndex
CREATE INDEX "TeamStrength_month_idx" ON "TeamStrength"("month");

-- CreateIndex
CREATE INDEX "DailyTracking_employeeId_idx" ON "DailyTracking"("employeeId");

-- CreateIndex
CREATE INDEX "DailyTracking_trackingDate_idx" ON "DailyTracking"("trackingDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyTracking_employeeId_trackingDate_key" ON "DailyTracking"("employeeId", "trackingDate");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_teamStrengthId_fkey" FOREIGN KEY ("teamStrengthId") REFERENCES "TeamStrength"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GPSTracking" ADD CONSTRAINT "GPSTracking_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Efficiency" ADD CONSTRAINT "Efficiency_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeAction" ADD CONSTRAINT "ScopeAction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpcomingDeadline" ADD CONSTRAINT "UpcomingDeadline_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpcomingDeadline" ADD CONSTRAINT "UpcomingDeadline_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamStrength" ADD CONSTRAINT "TeamStrength_teamLeadId_fkey" FOREIGN KEY ("teamLeadId") REFERENCES "TeamLead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTracking" ADD CONSTRAINT "DailyTracking_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
