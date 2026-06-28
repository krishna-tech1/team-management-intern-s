import prisma from '../../config/prisma';
import { getTeamMemberIds } from './teamlead.helper';

export const getTLAttendance = async (
  userId: number,
  page = 1,
  limit = 20,
  period: 'daily' | 'weekly' | 'monthly' = 'daily'
) => {
  const memberIds = await getTeamMemberIds(userId);
  if (memberIds.length === 0) return { records: [], total: 0, lateArrivals: [], absentEmployees: [] };

  const now = new Date();
  let fromDate: Date;

  if (period === 'weekly') {
    fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 7);
  } else if (period === 'monthly') {
    fromDate = new Date(now);
    fromDate.setDate(1);
    fromDate.setHours(0, 0, 0, 0);
  } else {
    // daily — today
    fromDate = new Date(now);
    fromDate.setHours(0, 0, 0, 0);
  }

  const skip = (page - 1) * limit;
  const where = {
    employeeId: { in: memberIds },
    createdAt: { gte: fromDate },
  };

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.attendance.count({ where }),
  ]);

  const lateArrivals = records
    .filter((r) => r.status === 'LATE')
    .map((r) => ({
      employeeId: r.employeeId,
      name: `${r.employee.firstName} ${r.employee.lastName}`,
      checkInTime: r.checkInTime,
      date: r.createdAt.toISOString().slice(0, 10),
    }));

  // Employees absent in the period
  const presentIds = new Set(records.filter((r) => r.status !== 'ABSENT').map((r) => r.employeeId));
  const absentEmployees = await prisma.employee.findMany({
    where: { id: { in: memberIds.filter((id) => !presentIds.has(id)), isDeleted: false } as any },
    select: { id: true, firstName: true, lastName: true, department: true },
  });

  return { records, total, page, limit, lateArrivals, absentEmployees };
};
