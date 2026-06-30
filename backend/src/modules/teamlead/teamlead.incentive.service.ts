import prisma from '../../config/prisma';
import { getTeamMemberIds } from './teamlead.helper';

export const getTLIncentives = async (userId: number, page = 1, limit = 10) => {
  const memberIds = await getTeamMemberIds(userId);
  const skip = (page - 1) * limit;

  const [incentives, total, poolAgg] = await Promise.all([
    prisma.incentive.findMany({
      where: { employeeId: { in: memberIds } },
      skip,
      take: limit,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.incentive.count({ where: { employeeId: { in: memberIds } } }),
    prisma.incentive.aggregate({
      where: { employeeId: { in: memberIds }, status: 'APPROVED' },
      _sum: { amount: true },
    }),
  ]);

  // Monthly distribution
  const approvedIncentives = await prisma.incentive.findMany({
    where: { employeeId: { in: memberIds }, status: 'APPROVED' },
    select: { amount: true, month: true },
  });
  const monthlyMap: Record<string, number> = {};
  approvedIncentives.forEach((i) => {
    monthlyMap[i.month] = (monthlyMap[i.month] || 0) + i.amount;
  });
  const monthlyDistribution = Object.entries(monthlyMap)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Leaderboard via groupBy
  const grouped = await prisma.incentive.groupBy({
    by: ['employeeId'],
    where: { employeeId: { in: memberIds }, status: 'APPROVED' },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  const empDetails = await prisma.employee.findMany({
    where: { id: { in: grouped.map((g) => g.employeeId) } },
    select: { id: true, firstName: true, lastName: true },
  });

  const leaderboard = grouped.map((g) => {
    const emp = empDetails.find((e) => e.id === g.employeeId);
    return {
      employeeId: g.employeeId,
      name: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
      total: g._sum.amount ?? 0,
    };
  });

  return {
    currentIncentivePool: poolAgg._sum.amount ?? 0,
    incentives,
    total,
    page,
    limit,
    monthlyDistribution,
    leaderboard,
    pendingPayouts: 0, // Future: link to payout status
  };
};

export const calculateTLIncentives = async (userId: number, month: string) => {
  const memberIds = await getTeamMemberIds(userId);
  const created: any[] = [];

  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(month)) throw new Error('Invalid month format. Use YYYY-MM');

  for (const empId of memberIds) {
    const [totalTasks, completedTasks, attendances] = await Promise.all([
      prisma.task.count({ where: { assignedEmployeeId: empId, isDeleted: false } }),
      prisma.task.count({ where: { assignedEmployeeId: empId, status: 'COMPLETED', isDeleted: false } }),
      prisma.attendance.count({ where: { employeeId: empId, status: { in: ['PRESENT', 'LATE'] } } }),
    ]);

    const efficiency = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    // Base: 500 per point efficiency, 10 per attendance day, up to 5000
    const amount = Math.min(Math.round(efficiency * 5 + attendances * 10), 5000);

    if (amount > 0) {
      const record = await prisma.incentive.create({
        data: { employeeId: empId, amount, month },
      });
      created.push(record);
    }
  }

  return { calculated: created.length, records: created };
};

export const updateTLIncentiveStatus = async (
  userId: number,
  incentiveId: number,
  status: string
) => {
  const memberIds = await getTeamMemberIds(userId);

  const incentive = await prisma.incentive.findFirst({
    where: {
      id: incentiveId,
      employeeId: { in: memberIds },
    },
  });
  if (!incentive) throw new Error('Incentive record not found or access denied');

  const updated = await prisma.incentive.update({
    where: { id: incentiveId },
    data: { status },
  });

  return updated;
};
