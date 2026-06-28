import prisma from '../../config/prisma';

// Get system analytics including revenue, task completion, employee performance, and client growth
export const getAnalyticsStats = async () => {
  // 1. Task Completion Rate
  const [totalTasks, completedTasks] = await Promise.all([
    prisma.task.count({ where: { isDeleted: false } }),
    prisma.task.count({ where: { status: 'COMPLETED', isDeleted: false } }),
  ]);
  const taskCompletionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 2. Monthly Revenue (using Invoice table PAID status)
  const invoices = await prisma.invoice.findMany({
    where: { status: 'PAID' },
    select: { amount: true, createdAt: true },
  });

  const revenueMap: { [key: string]: number } = {};
  invoices.forEach((inv) => {
    const month = inv.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
    revenueMap[month] = (revenueMap[month] || 0) + inv.amount;
  });

  // Convert map to array and sort chronologically
  let monthlyRevenue = Object.keys(revenueMap).map((month) => ({
    month,
    revenue: revenueMap[month],
  })).sort((a, b) => a.month.localeCompare(b.month));

  // If empty, provide a clean fallback schema
  if (monthlyRevenue.length === 0) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    monthlyRevenue = [{ month: currentMonth, revenue: 0 }];
  }

  // 3. Employee Performance
  const employees = await prisma.employee.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      designation: true,
      department: true,
      assignedTasks: {
        where: { isDeleted: false },
        select: { status: true },
      },
    },
  });

  const employeePerformance = employees.map((emp) => {
    const total = emp.assignedTasks.length;
    const completed = emp.assignedTasks.filter(
      (t) => t.status === 'COMPLETED'
    ).length;
    const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      designation: emp.designation,
      department: emp.department,
      totalTasks: total,
      completedTasks: completed,
      efficiency,
    };
  });

  // 4. Client Growth
  const clients = await prisma.client.findMany({
    where: { isDeleted: false },
    select: { createdAt: true },
  });

  const growthMap: { [key: string]: number } = {};
  clients.forEach((c) => {
    const month = c.createdAt.toISOString().slice(0, 7);
    growthMap[month] = (growthMap[month] || 0) + 1;
  });

  let clientGrowth = Object.keys(growthMap).map((month) => ({
    month,
    count: growthMap[month],
  })).sort((a, b) => a.month.localeCompare(b.month));

  if (clientGrowth.length === 0) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    clientGrowth = [{ month: currentMonth, count: 0 }];
  }

  return {
    monthlyRevenue,
    taskCompletionRate: {
      totalTasks,
      completedTasks,
      rate: taskCompletionRate,
    },
    employeePerformance,
    clientGrowth,
  };
};
