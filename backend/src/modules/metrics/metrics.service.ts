import prisma from '../../config/prisma';

/**
 * Calculate and update leaderboard rankings
 * Based on: completed tasks, work hours, on-time completion rate
 */
export const calculateLeaderboard = async (month?: string) => {
  const targetMonth = month || new Date().toISOString().substring(0, 7); // YYYY-MM

  // Get all active employees
  const employees = await prisma.employee.findMany({
    where: { isDeleted: false, status: 'ACTIVE' },
  });

  const leaderboardData = [];

  for (const emp of employees) {
    // Count completed tasks
    const completedTasks = await prisma.task.count({
      where: {
        assignedEmployeeId: emp.id,
        status: 'COMPLETED',
        isDeleted: false,
      },
    });

    // Calculate average completion time
    const completedTasksHistory = await prisma.taskStatusHistory.findMany({
      where: {
        employeeId: emp.id,
        toStatus: 'COMPLETED',
      },
      include: { task: true },
      take: 10,
    });

    const avgCompletionTime = completedTasksHistory.length > 0
      ? completedTasksHistory.reduce((sum, h) => {
          const startDate = h.task.startDate || h.task.createdAt;
          const days = (h.changedAt.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / completedTasksHistory.length
      : 0;

    // Get total work hours from attendance
    const attendanceRecords = await prisma.attendance.findMany({
      where: { employeeId: emp.id },
    });

    const totalWorkHours = attendanceRecords.reduce((sum, a) => sum + (a.workingHours || 0), 0);

    // Calculate on-time completion (tasks completed before due date)
    const onTimeCompleted = completedTasksHistory.filter((h) => {
      if (!h.task.dueDate) return true;
      return h.changedAt <= h.task.dueDate;
    }).length;

    const completionRate = completedTasksHistory.length > 0
      ? (onTimeCompleted / completedTasksHistory.length) * 100
      : 0;

    // Calculate composite score
    const score =
      completedTasks * 10 +
      totalWorkHours * 0.5 +
      completionRate * 0.1 -
      avgCompletionTime * 0.5;

    leaderboardData.push({
      employeeId: emp.id,
      score: Math.max(0, score), // Ensure non-negative
      completedTasks,
      totalWorkHours,
      completionRate,
    });
  }

  // Sort by score descending
  leaderboardData.sort((a, b) => b.score - a.score);

  // Assign ranks and update database
  const leaderboards = [];

  for (let i = 0; i < leaderboardData.length; i++) {
    const data = leaderboardData[i];

    // Update or create leaderboard entry
    const leaderboard = await prisma.leaderboard.upsert({
      where: { employeeId: data.employeeId },
      update: {
        rank: i + 1,
        score: data.score,
        totalTasksCompleted: data.completedTasks,
        totalWorkHours: data.totalWorkHours,
        averageTaskCompletion: data.completionRate,
        pointsThisMonth: Math.round(data.score),
      },
      create: {
        employeeId: data.employeeId,
        rank: i + 1,
        score: data.score,
        totalTasksCompleted: data.completedTasks,
        totalWorkHours: data.totalWorkHours,
        averageTaskCompletion: data.completionRate,
        pointsThisMonth: Math.round(data.score),
        pointsLastMonth: 0,
      },
    });

    leaderboards.push(leaderboard);
  }

  return {
    month: targetMonth,
    leaderboards,
    generatedAt: new Date(),
  };
};

/**
 * Get leaderboard rankings
 */
export const getLeaderboard = async (_month?: string, limit: number = 10) => {
  const leaderboards = await prisma.leaderboard.findMany({
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          department: true,
        },
      },
    },
    orderBy: { rank: 'asc' },
    take: limit,
  });

  return leaderboards.map((lb) => ({
    rank: lb.rank,
    employee: lb.employee,
    score: lb.score,
    tasksCompleted: lb.totalTasksCompleted,
    workHours: lb.totalWorkHours,
    completionRate: lb.averageTaskCompletion,
    points: lb.pointsThisMonth,
  }));
};

/**
 * Calculate performance metrics for employee
 */
export const calculatePerformance = async (employeeId: number, month?: string) => {
  const targetMonth = month || new Date().toISOString().substring(0, 7);

  // Count tasks by status for this month
  const tasksData = await prisma.task.findMany({
    where: {
      assignedEmployeeId: employeeId,
      isDeleted: false,
      createdAt: {
        gte: new Date(targetMonth),
        lt: new Date(targetMonth + '-32'), // Next month
      },
    },
  });

  const completed = tasksData.filter((t) => t.status === 'COMPLETED').length;
  const overdue = tasksData.filter(
    (t) => t.dueDate && t.dueDate < new Date() && t.status !== 'COMPLETED'
  ).length;
  const pending = tasksData.filter((t) => t.status === 'PENDING').length;

  // Calculate performance rating (0-100)
  const total = tasksData.length || 1;
  const performanceRating = (completed / total) * 100;

  const performance = await prisma.performance.upsert({
    where: {
      employeeId,
    },
    update: {
      tasksCompleted: completed,
      tasksOverdue: overdue,
      tasksPending: pending,
      performanceRating,
      averageCompletionTime: 0,
      month: targetMonth,
    },
    create: {
      employeeId,
      tasksCompleted: completed,
      tasksOverdue: overdue,
      tasksPending: pending,
      performanceRating,
      averageCompletionTime: 0,
      month: targetMonth,
    },
  });

  return performance;
};

/**
 * Calculate efficiency metrics for employee
 */
export const calculateEfficiency = async (employeeId: number, month?: string) => {
  const targetMonth = month || new Date().toISOString().substring(0, 7);

  // Get tasks for this month
  const tasks = await prisma.task.findMany({
    where: {
      assignedEmployeeId: employeeId,
      isDeleted: false,
      createdAt: {
        gte: new Date(targetMonth),
        lt: new Date(targetMonth + '-32'),
      },
    },
  });

  // Count on-time completions
  const onTimeCompleted = tasks.filter(
    (t) => t.status === 'COMPLETED' && (!t.dueDate || t.updatedAt <= t.dueDate)
  ).length;

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  // Get work hours
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: {
        gte: new Date(targetMonth),
        lt: new Date(targetMonth + '-32'),
      },
    },
  });

  const totalWorkHours = attendanceRecords.reduce(
    (sum, a) => sum + (a.workingHours || 0),
    0
  );

  const expectedWorkHours = 22 * 8; // 22 working days * 8 hours/day (typical)

  const efficiencyScore =
    completedCount > 0 ? (onTimeCompleted / completedCount) * 100 : 0;

  const efficiency = await prisma.efficiency.upsert({
    where: { employeeId },
    update: {
      tasksCompletedOnTime: onTimeCompleted,
      totalTasksAssigned: tasks.length,
      efficiencyScore,
      workHoursTracked: totalWorkHours,
      workHoursExpected: expectedWorkHours,
      month: targetMonth,
    },
    create: {
      employeeId,
      tasksCompletedOnTime: onTimeCompleted,
      totalTasksAssigned: tasks.length,
      efficiencyScore,
      workHoursTracked: totalWorkHours,
      workHoursExpected: expectedWorkHours,
      month: targetMonth,
    },
  });

  return efficiency;
};

/**
 * Calculate team strength metrics
 */
export const calculateTeamStrength = async (teamLeadId: number, month?: string) => {
  const targetMonth = month || new Date().toISOString().substring(0, 7);

  // Get team members
  const teamMembers = await prisma.teamLeadEmployee.findMany({
    where: { teamLeadId },
    include: { employee: true },
  });

  const employeeIds = teamMembers.map((tm) => tm.employee.id);

  let totalMembers = employeeIds.length;
  let activeMembers = 0;
  let onLeaveMembers = 0;
  let totalPerformance = 0;

  for (const empId of employeeIds) {
    const employee = await prisma.employee.findUnique({
      where: { id: empId },
    });

    if (employee?.status === 'ACTIVE') activeMembers++;
    if (employee?.status === 'ON_LEAVE') onLeaveMembers++;

    const performance = await calculatePerformance(empId, targetMonth);
    totalPerformance += performance.performanceRating;
  }

  const averagePerformance = totalMembers > 0 ? totalPerformance / totalMembers : 0;

  let teamStrength = await prisma.teamStrength.findFirst({
    where: {
      teamLeadId,
      month: targetMonth,
    },
  });

  if (teamStrength) {
    teamStrength = await prisma.teamStrength.update({
      where: { id: teamStrength.id },
      data: {
        totalMembers,
        activeMembers,
        onLeaveMembers,
        averagePerformance,
      },
    });
  } else {
    teamStrength = await prisma.teamStrength.create({
      data: {
        teamLeadId,
        totalMembers,
        activeMembers,
        onLeaveMembers,
        averagePerformance,
        month: targetMonth,
      },
    });
  }

  return teamStrength;
};

/**
 * Update daily tracking values
 */
export const updateDailyTracking = async (employeeId: number, trackingDate?: Date) => {
  const date = trackingDate || new Date();
  date.setHours(0, 0, 0, 0);

  // Count tasks completed today
  const tasksCompleted = await prisma.taskStatusHistory.count({
    where: {
      employeeId,
      changedAt: {
        gte: date,
        lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      },
      toStatus: 'COMPLETED',
    },
  });

  // Count work updates today
  const tasksUpdated = await prisma.taskWorkUpdate.count({
    where: {
      employeeId,
      createdAt: {
        gte: date,
        lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  });

  // Count documents uploaded today
  const documentsUploaded = await prisma.document.count({
    where: {
      employeeId,
      createdAt: {
        gte: date,
        lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  });

  // Get work hours from attendance today
  const attendance = await prisma.attendance.findFirst({
    where: { employeeId, date },
  });

  const workHours = attendance?.workingHours || 0;

  const dailyTracking = await prisma.dailyTracking.upsert({
    where: {
      employeeId_trackingDate: {
        employeeId,
        trackingDate: date,
      },
    },
    update: {
      tasksCompleted,
      workHours,
      documentsUploaded,
      tasksUpdated,
      lastRefreshed: new Date(),
    },
    create: {
      employeeId,
      trackingDate: date,
      tasksCompleted,
      workHours,
      documentsUploaded,
      tasksUpdated,
    },
  });

  return dailyTracking;
};

/**
 * Get daily tracking for employee
 */
export const getDailyTracking = async (
  employeeId: number,
  days: number = 7
) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const trackings = await prisma.dailyTracking.findMany({
    where: {
      employeeId,
      trackingDate: { gte: startDate },
    },
    orderBy: { trackingDate: 'desc' },
  });

  // Refresh all tracking data to ensure current
  const refreshed = await Promise.all(
    trackings.map((t) => updateDailyTracking(employeeId, t.trackingDate))
  );

  return refreshed.sort(
    (a, b) => b.trackingDate.getTime() - a.trackingDate.getTime()
  );
};
