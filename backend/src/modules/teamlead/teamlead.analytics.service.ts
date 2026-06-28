import prisma from '../../config/prisma';
import { getTeamMemberIds } from './teamlead.helper';

export const getTLAnalytics = async (userId: number) => {
  const memberIds = await getTeamMemberIds(userId);

  if (memberIds.length === 0) {
    return {
      efficiency: 0,
      taskCompletionTrend: [],
      weeklyData: [],
      monthlyData: [],
      employeeRanking: [],
      topPerformer: null,
      leastPerformer: null,
    };
  }

  // Overall efficiency
  const [totalTasks, completedTasks] = await Promise.all([
    prisma.task.count({ where: { assignedEmployeeId: { in: memberIds }, isDeleted: false } }),
    prisma.task.count({ where: { assignedEmployeeId: { in: memberIds }, status: 'COMPLETED', isDeleted: false } }),
  ]);
  const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Task completion trend — last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const allTasks = await prisma.task.findMany({
    where: { assignedEmployeeId: { in: memberIds }, isDeleted: false, createdAt: { gte: twelveMonthsAgo } },
    select: { status: true, createdAt: true, updatedAt: true },
  });

  const monthlyMap: Record<string, { total: number; completed: number }> = {};
  allTasks.forEach((t) => {
    const month = t.createdAt.toISOString().slice(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { total: 0, completed: 0 };
    monthlyMap[month].total++;
    if (t.status === 'COMPLETED') monthlyMap[month].completed++;
  });

  const taskCompletionTrend = Object.entries(monthlyMap)
    .map(([month, data]) => ({
      month,
      total: data.total,
      completed: data.completed,
      rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Weekly data — last 7 days
  const weeklyMap: Record<string, { total: number; completed: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    weeklyMap[key] = { total: 0, completed: 0 };
  }
  allTasks.forEach((t) => {
    const day = t.createdAt.toISOString().slice(0, 10);
    if (weeklyMap[day]) {
      weeklyMap[day].total++;
      if (t.status === 'COMPLETED') weeklyMap[day].completed++;
    }
  });

  const weeklyData = Object.entries(weeklyMap).map(([date, data]) => ({
    date,
    total: data.total,
    completed: data.completed,
  }));

  // Monthly data same as trend but simplified
  const monthlyData = taskCompletionTrend;

  // Employee ranking by efficiency
  const employees = await prisma.employee.findMany({
    where: { id: { in: memberIds }, isDeleted: false },
    select: {
      id: true, firstName: true, lastName: true, designation: true, department: true,
      assignedTasks: { where: { isDeleted: false }, select: { status: true } },
      incentives: { select: { amount: true } },
    },
  });

  const employeeRanking = employees
    .map((e) => {
      const total = e.assignedTasks.length;
      const done = e.assignedTasks.filter((t) => t.status === 'COMPLETED').length;
      const eff = total > 0 ? Math.round((done / total) * 100) : 0;
      const totalIncentive = e.incentives.reduce((s, i) => s + i.amount, 0);
      return {
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        designation: e.designation,
        department: e.department,
        totalTasks: total,
        completedTasks: done,
        efficiency: eff,
        totalIncentive,
      };
    })
    .sort((a, b) => b.efficiency - a.efficiency);

  const topPerformer = employeeRanking[0] || null;
  const leastPerformer = employeeRanking[employeeRanking.length - 1] || null;

  return {
    efficiency,
    taskCompletionTrend,
    weeklyData,
    monthlyData,
    employeeRanking,
    topPerformer,
    leastPerformer,
  };
};
