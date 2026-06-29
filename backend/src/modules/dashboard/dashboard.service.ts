import prisma from '../../config/prisma';

export const getDashboardStats = async () => {
  const [
    totalEmployees,
    activeEmployees,
    totalClients,
    activeClients,
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
  ] = await Promise.all([
    prisma.employee.count({ where: { isDeleted: false } }),
    prisma.employee.count({ where: { status: 'ACTIVE', isDeleted: false } }),
    prisma.client.count({ where: { isDeleted: false } }),
    prisma.client.count({ where: { status: 'ACTIVE', isDeleted: false } }),
    prisma.task.count({ where: { isDeleted: false } }),
    prisma.task.count({ where: { status: 'COMPLETED', isDeleted: false } }),
    prisma.task.count({ where: { status: 'PENDING', isDeleted: false } }),
    prisma.task.count({ where: { status: 'IN_PROGRESS', isDeleted: false } }),
    prisma.task.count({ where: { status: 'OVERDUE', isDeleted: false } }),
  ]);

  const topEmployees = await prisma.employee.findMany({
    where: { isDeleted: false },
    take: 6,
    include: {
      taskAssignments: {
        include: { task: true },
      },
    },
  });

  const topPerformers = topEmployees.map((emp) => {
    const totalAssigned = emp.taskAssignments.length;
    const completed = emp.taskAssignments.filter(
      (a) => a.task.status === 'COMPLETED'
    ).length;
    const efficiency =
      totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

    return {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      employeeCode: emp.employeeCode,
      avatar: emp.profilePhotoUrl || null,
      department: emp.department,
      designation: emp.designation,
      tasksClosed: completed,
      efficiency,
    };
  });

  // Recent activity logs
  const recentLogs = await prisma.auditLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  const recentActivity = recentLogs.map((log) => ({
    id: log.id,
    module: log.module,
    action: log.action,
    performedBy: log.performedBy,
    createdAt: log.createdAt,
  }));

  // Monthly summary metrics for last 6 months
  const monthlySummary: Array<{ month: string; created: number; completed: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = d.toISOString().slice(0, 7); // "YYYY-MM"
    
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const [created, completed] = await Promise.all([
      prisma.task.count({
        where: {
          isDeleted: false,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.task.count({
        where: {
          status: 'COMPLETED',
          isDeleted: false,
          updatedAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
    ]);
    
    monthlySummary.push({
      month: monthStr,
      created,
      completed,
    });
  }

  return {
    employees: totalEmployees,
    activeEmployees,
    clients: totalClients,
    activeClients,
    tasks: totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
    topPerformers,
    recentActivity,
    monthlySummary,
  };
};