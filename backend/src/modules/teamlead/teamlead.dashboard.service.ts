import prisma from '../../config/prisma';
import { getTeamMemberIds } from './teamlead.helper';

export const getTeamLeadDashboard = async (userId: number) => {
  const memberIds = await getTeamMemberIds(userId);

  if (memberIds.length === 0) {
    return {
      teamSize: 0,
      activeEmployees: 0,
      completionRate: 0,
      avgHandlingTime: '0 days',
      incentivePool: 0,
      attentionRequired: [],
      regionalSpread: [],
      leaderboard: [],
    };
  }

  const [
    teamSize,
    activeEmployees,
    totalTasks,
    completedTasks,
    incentiveAgg,
    overdueTasks,
  ] = await Promise.all([
    prisma.employee.count({ where: { id: { in: memberIds }, isDeleted: false } }),
    prisma.employee.count({ where: { id: { in: memberIds }, status: 'ACTIVE', isDeleted: false } }),
    prisma.task.count({ where: { assignedEmployeeId: { in: memberIds }, isDeleted: false } }),
    prisma.task.count({ where: { assignedEmployeeId: { in: memberIds }, status: 'COMPLETED', isDeleted: false } }),
    prisma.incentive.aggregate({
      where: { employeeId: { in: memberIds } },
      _sum: { amount: true },
    }),
    prisma.task.findMany({
      where: {
        assignedEmployeeId: { in: memberIds },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() },
        isDeleted: false,
      },
      select: { id: true, title: true, dueDate: true, assignedEmployee: { select: { firstName: true, lastName: true } } },
      take: 10,
    }),
  ]);

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Average handling time: avg days from startDate to completedAt (approximated via updatedAt - createdAt for COMPLETED tasks)
  const completedTaskData = await prisma.task.findMany({
    where: { assignedEmployeeId: { in: memberIds }, status: 'COMPLETED', isDeleted: false },
    select: { createdAt: true, updatedAt: true },
  });
  let avgDays = 0;
  if (completedTaskData.length > 0) {
    const totalDays = completedTaskData.reduce((sum, t) => {
      const diffMs = t.updatedAt.getTime() - t.createdAt.getTime();
      return sum + diffMs / (1000 * 60 * 60 * 24);
    }, 0);
    avgDays = Math.round(totalDays / completedTaskData.length);
  }

  // Leaderboard: top 5 by completed tasks
  const employees = await prisma.employee.findMany({
    where: { id: { in: memberIds }, isDeleted: false },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      designation: true,
      assignedTasks: {
        where: { isDeleted: false },
        select: { status: true },
      },
    },
  });

  const leaderboard = employees
    .map((e) => {
      const total = e.assignedTasks.length;
      const done = e.assignedTasks.filter((t) => t.status === 'COMPLETED').length;
      return {
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        designation: e.designation,
        completedTasks: done,
        totalTasks: total,
        efficiency: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 5);

  // Regional spread: employees grouped by their client address (approximation)
  const clientAssignments = await prisma.client.findMany({
    where: { assignedEmployeeId: { in: memberIds }, isDeleted: false },
    select: { address: true, companyName: true },
  });

  const regionMap: Record<string, number> = {};
  clientAssignments.forEach((c) => {
    const region = c.address || 'Unknown';
    regionMap[region] = (regionMap[region] || 0) + 1;
  });
  const regionalSpread = Object.entries(regionMap).map(([region, count]) => ({ region, count }));

  return {
    teamSize,
    activeEmployees,
    completionRate,
    avgHandlingTime: `${avgDays} days`,
    incentivePool: incentiveAgg._sum.amount ?? 0,
    attentionRequired: overdueTasks,
    regionalSpread,
    leaderboard,
  };
};
