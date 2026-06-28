import prisma from '../../config/prisma';

export const getDashboardStats = async () => {
  const [
    totalEmployees,
    totalClients,
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
  ] = await Promise.all([
    prisma.employee.count({ where: { isDeleted: false } }),
    prisma.client.count({ where: { isDeleted: false } }),
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
      department: emp.department,
      designation: emp.designation,
      tasksClosed: completed,
      efficiency,
    };
  });

  return {
    employees: totalEmployees,
    clients: totalClients,
    tasks: totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
    topPerformers,
  };
};