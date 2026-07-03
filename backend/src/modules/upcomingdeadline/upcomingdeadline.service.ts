import prisma from '../../config/prisma';
import { createAuditLog } from '../auditlogs/auditlog.service';

/**
 * Create upcoming deadline reminder
 */
export const createUpcomingDeadline = async (
  taskId: number,
  employeeId: number,
  daysUntilDeadline: number = 3
) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  if (!task.dueDate) {
    throw new Error('Task does not have a due date');
  }

  const deadline = await prisma.upcomingDeadline.create({
    data: {
      taskId,
      employeeId,
      daysUntilDeadline,
      notificationTrigger: daysUntilDeadline <= 0 ? 'OVERDUE' : 'UPCOMING_DEADLINE',
      isActive: true,
    },
  });

  return deadline;
};

/**
 * Get upcoming deadlines for employee
 */
export const getUpcomingDeadlines = async (
  employeeId: number,
  daysRange: number = 7
) => {
  const deadlines = await prisma.upcomingDeadline.findMany({
    where: {
      employeeId,
      isActive: true,
    },
    include: {
      task: {
        include: { client: true },
      },
    },
    orderBy: { task: { dueDate: 'asc' } },
  });

  // Filter by days range and add calculated info
  const upcoming = deadlines.map((d) => {
    const now = new Date();
    const dueDate = new Date(d.task.dueDate!);
    const daysRemaining = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      ...d,
      daysRemaining,
      isOverdue: daysRemaining < 0,
      urgency: daysRemaining <= 1 ? 'CRITICAL' : daysRemaining <= 3 ? 'HIGH' : 'MEDIUM',
    };
  });

  return upcoming.filter(
    (d) => d.daysRemaining >= -1 && d.daysRemaining <= daysRange
  );
};

/**
 * Get all overdue tasks for employee
 */
export const getOverdueTasks = async (employeeId: number) => {
  const now = new Date();

  const overdue = await prisma.upcomingDeadline.findMany({
    where: {
      employeeId,
      isActive: true,
      task: {
        dueDate: { lt: now },
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
    },
    include: {
      task: {
        include: { client: true },
      },
    },
    orderBy: { task: { dueDate: 'asc' } },
  });

  return overdue.map((d) => ({
    ...d,
    daysOverdue: Math.ceil(
      (now.getTime() - new Date(d.task.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
};

/**
 * Send deadline notification
 */
export const sendDeadlineNotification = async (
  upcomingDeadlineId: number,
  employeeId: number
) => {
  const deadline = await prisma.upcomingDeadline.findUnique({
    where: { id: upcomingDeadlineId },
    include: { task: { include: { client: true } } },
  });

  if (!deadline) {
    throw new Error('Deadline not found');
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Create notification
  const notification = await prisma.notification.create({
    data: {
      title: deadline.notificationTrigger === 'OVERDUE'
        ? `OVERDUE: ${deadline.task.title}`
        : `Upcoming deadline: ${deadline.task.title}`,
      message: `Task "${deadline.task.title}" for client ${deadline.task.client?.companyName} is due on ${deadline.task.dueDate?.toDateString()}`,
      type: 'TASK_ASSIGNED', // Could be extended with more types
      employeeId,
      isTeamLead: false,
    },
  });

  // Mark notification as sent
  await prisma.upcomingDeadline.update({
    where: { id: upcomingDeadlineId },
    data: {
      notificationSent: true,
      notificationTime: new Date(),
    },
  });

  // Create audit log
  await createAuditLog(
    `Deadline notification sent for task: ${deadline.task.title}`,
    'system',
    'Notification',
    notification.id
  );

  return notification;
};

/**
 * Process all pending deadline notifications (should run as cron job)
 */
export const processPendingNotifications = async () => {
  const now = new Date();

  // Get all active deadlines that need notification
  const deadlines = await prisma.upcomingDeadline.findMany({
    where: {
      isActive: true,
      notificationSent: false,
      task: {
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // Next 3 days
        },
      },
    },
    include: { task: { include: { client: true } } },
  });

  const results = {
    sent: [] as any[],
    failed: [] as Array<{ deadlineId: number; error: string }>,
  };

  for (const deadline of deadlines) {
    try {
      const notification = await sendDeadlineNotification(
        deadline.id,
        deadline.employeeId
      );
      results.sent.push(notification);
    } catch (error: any) {
      results.failed.push({
        deadlineId: deadline.id,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Update deadline (reschedule)
 */
export const updateDeadline = async (
  taskId: number,
  newDueDate: Date,
  updatedBy: string
) => {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { dueDate: newDueDate },
  });

  // Update all related upcoming deadlines
  const deadlines = await prisma.upcomingDeadline.findMany({
    where: { taskId, isActive: true },
  });

  for (const deadline of deadlines) {
    const daysRemaining = Math.ceil(
      (newDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    await prisma.upcomingDeadline.update({
      where: { id: deadline.id },
      data: {
        daysUntilDeadline: daysRemaining,
        notificationSent: false, // Reset notification flag
        notificationTime: null,
      },
    });
  }

  await createAuditLog(
    `Task deadline updated to ${newDueDate.toDateString()}`,
    updatedBy,
    'Task',
    taskId
  );

  return task;
};

/**
 * Complete deadline (mark as completed)
 */
export const completeDeadline = async (
  upcomingDeadlineId: number,
  completedBy: string
) => {
  const deadline = await prisma.upcomingDeadline.update({
    where: { id: upcomingDeadlineId },
    data: { isActive: false },
  });

  await createAuditLog(
    'Deadline completed/archived',
    completedBy,
    'UpcomingDeadline',
    upcomingDeadlineId
  );

  return deadline;
};

/**
 * Get deadline statistics for team lead
 */
export const getTeamDeadlineStats = async (teamLeadId: number) => {
  const teamMembers = await prisma.teamLeadEmployee.findMany({
    where: { teamLeadId },
    select: { employeeId: true },
  });

  const employeeIds = teamMembers.map((tm) => tm.employeeId);

  if (employeeIds.length === 0) {
    return {
      teamLeadId,
      totalMembers: 0,
      upcomingDeadlines: 0,
      overdueCount: 0,
      criticalCount: 0,
    };
  }

  const now = new Date();

  const upcomingCount = await prisma.upcomingDeadline.count({
    where: {
      employeeId: { in: employeeIds },
      isActive: true,
      task: {
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const overdueCount = await prisma.upcomingDeadline.count({
    where: {
      employeeId: { in: employeeIds },
      isActive: true,
      task: {
        dueDate: { lt: now },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    },
  });

  const criticalCount = await prisma.upcomingDeadline.count({
    where: {
      employeeId: { in: employeeIds },
      isActive: true,
      task: {
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Next 24 hours
        },
      },
    },
  });

  return {
    teamLeadId,
    totalMembers: employeeIds.length,
    upcomingDeadlines: upcomingCount,
    overdueCount,
    criticalCount,
  };
};
