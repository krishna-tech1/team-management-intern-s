import prisma from '../../config/prisma';
import { createAuditLog } from '../auditlogs/auditlog.service';

// Create a new employee incentive record
export const createIncentive = async (
  data: {
    employeeId: number;
    amount: number;
    month: string; // Expects "YYYY-MM"
  },
  performedBy: string
) => {
  // Verify employee exists and is not deleted
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, isDeleted: false },
  });
  if (!employee) throw new Error('Employee not found');

  if (data.amount <= 0) {
    throw new Error('Incentive amount must be positive');
  }

  // Validate month format (YYYY-MM)
  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(data.month)) {
    throw new Error('Invalid month format. Please use YYYY-MM (e.g., 2026-06)');
  }

  // Prevent duplicate payouts for the same employee in the same month
  const existing = await prisma.incentive.findFirst({
    where: {
      employeeId: data.employeeId,
      month: data.month,
    },
  });
  if (existing) {
    throw new Error('Incentive already exists for this employee and month');
  }

  const incentive = await prisma.incentive.create({
    data: {
      employeeId: data.employeeId,
      amount: data.amount,
      month: data.month,
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  // Log to AuditLog
  await createAuditLog(
    `Incentive of Rs. ${data.amount} created for employee ${employee.firstName} ${employee.lastName} for ${data.month}`,
    performedBy,
    'Employee',
    data.employeeId
  );

  return incentive;
};

// Retrieve employee incentives with pagination and filtering
export const getAllIncentives = async (
  page = 1,
  limit = 10,
  employeeId?: number,
  month?: string
) => {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (employeeId) where.employeeId = employeeId;
  if (month) where.month = month;

  const [incentives, total] = await Promise.all([
    prisma.incentive.findMany({
      where,
      skip,
      take: limit,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true, department: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.incentive.count({ where }),
  ]);

  return { incentives, total, page, limit };
};

export const getIncentiveFreeze = async (month: string) => {
  const record = await prisma.incentiveFreeze.findUnique({
    where: { month },
  });
  return record || { month, isFrozen: false };
};

export const setIncentiveFreeze = async (month: string, isFrozen: boolean, performedBy: string) => {
  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(month)) {
    throw new Error('Invalid month format. Please use YYYY-MM');
  }

  const record = await prisma.incentiveFreeze.upsert({
    where: { month },
    create: { month, isFrozen },
    update: { isFrozen },
  });

  await createAuditLog(
    `Incentives records for ${month} were ${isFrozen ? 'frozen' : 'unfrozen'}`,
    performedBy,
    'System',
    0
  );

  return record;
};

export const updateIncentive = async (
  incentiveId: number,
  data: { amount?: number; status?: string; month?: string },
  performedBy: string
) => {
  const incentive = await prisma.incentive.findUnique({ where: { id: incentiveId } });
  if (!incentive) throw new Error('Incentive not found');

  if (data.amount !== undefined && data.amount <= 0) {
    throw new Error('Incentive amount must be positive');
  }

  if (data.month !== undefined) {
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(data.month)) {
      throw new Error('Invalid month format. Please use YYYY-MM');
    }
  }

  const updated = await prisma.incentive.update({
    where: { id: incentiveId },
    data: {
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.status && { status: data.status }),
      ...(data.month && { month: data.month }),
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  await createAuditLog(
    `Incentive ${incentiveId} updated by ${performedBy}`,
    performedBy,
    'Incentive',
    incentiveId
  );

  return updated;
};
