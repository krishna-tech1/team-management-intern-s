import prisma from '../../config/prisma';
import { createAuditLog } from '../auditlogs/auditlog.service';

// Allocate a client to an employee
export const allocateClient = async (
  data: {
    clientId: number;
    employeeId: number;
  },
  allocatedBy: string
) => {
  // Check if client exists
  const client = await prisma.client.findFirst({
    where: { id: data.clientId, isDeleted: false },
  });
  if (!client) throw new Error('Client not found');

  // Check if employee exists
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, isDeleted: false },
  });
  if (!employee) throw new Error('Employee not found');

  // Create allocation log record
  const allocation = await prisma.allocation.create({
    data: {
      clientId: data.clientId,
      employeeId: data.employeeId,
      allocatedBy,
    },
    include: {
      client: true,
      employee: true,
    },
  });

  // Update client's assigned employee
  await prisma.client.update({
    where: { id: data.clientId },
    data: { assignedEmployeeId: data.employeeId },
  });

  // Log to AuditLog
  await createAuditLog(
    `Allocated client ${client.companyName} to employee ${employee.firstName} ${employee.lastName}`,
    allocatedBy,
    'Client',
    data.clientId
  );

  return allocation;
};

// Get all allocations with pagination
export const getAllAllocations = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [allocations, total] = await Promise.all([
    prisma.allocation.findMany({
      skip,
      take: limit,
      include: {
        client: {
          select: { id: true, companyName: true, contactPerson: true, email: true },
        },
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true, department: true },
        },
      },
      orderBy: { allocatedAt: 'desc' },
    }),
    prisma.allocation.count(),
  ]);

  return { allocations, total, page, limit };
};

// Update an allocation record
export const updateAllocation = async (
  id: number,
  data: {
    clientId?: number;
    employeeId?: number;
  },
  allocatedBy: string
) => {
  const existingAllocation = await prisma.allocation.findUnique({
    where: { id },
  });
  if (!existingAllocation) throw new Error('Allocation not found');

  const clientId = data.clientId || existingAllocation.clientId;
  const employeeId = data.employeeId || existingAllocation.employeeId;

  // Verify client exists
  const client = await prisma.client.findFirst({
    where: { id: clientId, isDeleted: false },
  });
  if (!client) throw new Error('Client not found');

  // Verify employee exists
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, isDeleted: false },
  });
  if (!employee) throw new Error('Employee not found');

  const updatedAllocation = await prisma.allocation.update({
    where: { id },
    data: {
      clientId,
      employeeId,
      allocatedBy,
    },
    include: {
      client: true,
      employee: true,
    },
  });

  // Sync client's assignedEmployeeId
  await prisma.client.update({
    where: { id: clientId },
    data: { assignedEmployeeId: employeeId },
  });

  // Log to AuditLog
  await createAuditLog(
    `Updated allocation for client ${client.companyName} to employee ${employee.firstName} ${employee.lastName}`,
    allocatedBy,
    'Client',
    clientId
  );

  return updatedAllocation;
};
