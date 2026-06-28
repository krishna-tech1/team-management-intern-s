-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "siteLocation" TEXT;

-- CreateTable
CREATE TABLE "TaskWorkUpdate" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskWorkUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskWorkAttachment" (
    "id" SERIAL NOT NULL,
    "workUpdateId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskWorkAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskStatusHistory" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "fromStatus" "TaskStatus",
    "toStatus" "TaskStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "TaskStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskWorkUpdate_taskId_idx" ON "TaskWorkUpdate"("taskId");

-- CreateIndex
CREATE INDEX "TaskWorkUpdate_employeeId_idx" ON "TaskWorkUpdate"("employeeId");

-- CreateIndex
CREATE INDEX "TaskWorkAttachment_workUpdateId_idx" ON "TaskWorkAttachment"("workUpdateId");

-- CreateIndex
CREATE INDEX "TaskStatusHistory_taskId_idx" ON "TaskStatusHistory"("taskId");

-- CreateIndex
CREATE INDEX "TaskStatusHistory_employeeId_idx" ON "TaskStatusHistory"("employeeId");

-- AddForeignKey
ALTER TABLE "TaskWorkUpdate" ADD CONSTRAINT "TaskWorkUpdate_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskWorkUpdate" ADD CONSTRAINT "TaskWorkUpdate_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskWorkAttachment" ADD CONSTRAINT "TaskWorkAttachment_workUpdateId_fkey" FOREIGN KEY ("workUpdateId") REFERENCES "TaskWorkUpdate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskStatusHistory" ADD CONSTRAINT "TaskStatusHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskStatusHistory" ADD CONSTRAINT "TaskStatusHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
