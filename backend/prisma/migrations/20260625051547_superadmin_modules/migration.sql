-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "entity" TEXT;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "assignedEmployeeId" INTEGER,
ADD COLUMN     "serviceType" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "employeeId" INTEGER,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "uploadedBy" TEXT,
ALTER COLUMN "documentType" SET DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assignedEmployeeId" INTEGER,
ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Allocation" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "allocatedBy" TEXT NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incentive" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "month" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Incentive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Allocation_clientId_idx" ON "Allocation"("clientId");

-- CreateIndex
CREATE INDEX "Allocation_employeeId_idx" ON "Allocation"("employeeId");

-- CreateIndex
CREATE INDEX "Incentive_employeeId_idx" ON "Incentive"("employeeId");

-- CreateIndex
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");

-- CreateIndex
CREATE INDEX "Document_employeeId_idx" ON "Document"("employeeId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_assignedEmployeeId_fkey" FOREIGN KEY ("assignedEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedEmployeeId_fkey" FOREIGN KEY ("assignedEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incentive" ADD CONSTRAINT "Incentive_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
