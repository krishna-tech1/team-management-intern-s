import prisma from '../../config/prisma';
import { createAuditLog } from '../auditlogs/auditlog.service';

/**
 * Assign task to employee
 */
export const assignTask = async (
  taskId: number,
  employeeId: number,
  assignedBy: string
) => {
  // Verify task exists
  const task = await prisma.task.findUnique({
    where: { id: taskId, isDeleted: false },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  // Verify employee exists
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId, isDeleted: false },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Update task with assigned employee
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: { assignedEmployeeId: employeeId },
  });

  // Create task assignment record
  await prisma.taskAssignment.create({
    data: {
      taskId,
      employeeId,
    },
  });

  // Create audit log
  await createAuditLog(
    `Task assigned to ${employee.firstName} ${employee.lastName}`,
    assignedBy,
    'Task',
    taskId
  );

  return updatedTask;
};

/**
 * Reassign task to different employee
 */
export const reassignTask = async (
  taskId: number,
  newEmployeeId: number,
  reassignedBy: string
) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId, isDeleted: false },
    include: {
      assignedEmployee: true,
    },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  const oldEmployeeId = task.assignedEmployeeId;

  // Assign to new employee
  const updated = await assignTask(taskId, newEmployeeId, reassignedBy);

  // Create audit log noting reassignment
  if (oldEmployeeId) {
    const oldEmployee = await prisma.employee.findUnique({
      where: { id: oldEmployeeId },
    });

    const newEmployee = await prisma.employee.findUnique({
      where: { id: newEmployeeId },
    });

    await createAuditLog(
      `Task reassigned from ${oldEmployee?.firstName} to ${newEmployee?.firstName}`,
      reassignedBy,
      'Task',
      taskId
    );
  }

  return updated;
};

/**
 * Get tasks assigned to employee
 */
export const getEmployeeAssignedTasks = async (
  employeeId: number,
  status?: string,
  page: number = 1,
  limit: number = 10
) => {
  const where: any = {
    assignedEmployeeId: employeeId,
    isDeleted: false,
  };

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        client: {
          select: { id: true, companyName: true },
        },
        assignedEmployee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { dueDate: 'asc' },
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total, page, limit };
};

/**
 * Get all assignments for a task
 */
export const getTaskAssignments = async (taskId: number) => {
  const assignments = await prisma.taskAssignment.findMany({
    where: { taskId },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { assignedAt: 'desc' },
  });

  return assignments;
};

/**
 * Unassign task from employee
 */
export const unassignTask = async (
  taskId: number,
  unassignedBy: string
) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignedEmployee: true },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { assignedEmployeeId: null },
  });

  // Remove assignment records
  await prisma.taskAssignment.deleteMany({
    where: { taskId },
  });

  // Create audit log
  await createAuditLog(
    `Task unassigned from ${task.assignedEmployee?.firstName}`,
    unassignedBy,
    'Task',
    taskId
  );

  return updated;
};

/**
 * Get task assignment history
 */
export const getTaskAssignmentHistory = async (
  taskId: number
) => {
  const assignments = await prisma.taskAssignment.findMany({
    where: { taskId },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { assignedAt: 'asc' },
  });

  return assignments;
};

/**
 * Get workload (task count) by employee
 */
export const getEmployeeWorkload = async (employeeId: number) => {
  const taskCounts = await prisma.task.groupBy({
    by: ['status'],
    where: {
      assignedEmployeeId: employeeId,
      isDeleted: false,
    },
    _count: true,
  });

  const workload = {
    employeeId,
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    onHold: 0,
    overdue: 0,
  };

  taskCounts.forEach((count: any) => {
    const status = count.status as string;
    workload.total += count._count;

    if (status === 'PENDING') workload.pending = count._count;
    else if (status === 'IN_PROGRESS') workload.inProgress = count._count;
    else if (status === 'COMPLETED') workload.completed = count._count;
    else if (status === 'ON_HOLD') workload.onHold = count._count;
    else if (status === 'OVERDUE') workload.overdue = count._count;
  });

  return workload;
};

/**
 * Get team workload (aggregated)
 */
export const getTeamWorkload = async (employeeIds: number[]) => {
  const workloads = await Promise.all(
    employeeIds.map((empId) => getEmployeeWorkload(empId))
  );

  const aggregate = {
    totalTasks: workloads.reduce((sum, w) => sum + w.total, 0),
    totalPending: workloads.reduce((sum, w) => sum + w.pending, 0),
    totalInProgress: workloads.reduce((sum, w) => sum + w.inProgress, 0),
    totalCompleted: workloads.reduce((sum, w) => sum + w.completed, 0),
    averageWorkload: Math.round(
      workloads.reduce((sum, w) => sum + w.total, 0) / workloads.length || 0
    ),
  };

  return {
    teamSize: employeeIds.length,
    aggregate,
    byEmployee: workloads,
  };
};

/**
 * Get overdue tasks for employee
 */
export const getOverdueTasks = async (employeeId: number) => {
  const now = new Date();

  const overdueTasks = await prisma.task.findMany({
    where: {
      assignedEmployeeId: employeeId,
      dueDate: { lt: now },
      status: {
        in: ['PENDING', 'IN_PROGRESS'],
      },
      isDeleted: false,
    },
    include: {
      client: {
        select: { id: true, companyName: true },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  return overdueTasks.map((task) => ({
    ...task,
    daysOverdue: Math.floor(
      (now.getTime() - (task.dueDate?.getTime() || 0)) / (1000 * 60 * 60 * 24)
    ),
  }));
};

/**
 * Auto-assign tasks based on workload balancing
 */
export const autoAssignTasks = async (
  taskIds: number[],
  employeeIds: number[],
  assignedBy: string
) => {
  const results = {
    assigned: [] as any[],
    failed: [] as Array<{ taskId: number; error: string }>,
  };

  for (const taskId of taskIds) {
    try {
      // Get current workload for all employees
      const workloads = await Promise.all(
        employeeIds.map((empId) => getEmployeeWorkload(empId))
      );

      // Assign to employee with least workload
      const leastBusyEmployee = workloads.reduce((prev, current) =>
        prev.total < current.total ? prev : current
      );

      const assigned = await assignTask(
        taskId,
        leastBusyEmployee.employeeId,
        assignedBy
      );

      results.assigned.push(assigned);
    } catch (error: any) {
      results.failed.push({
        taskId,
        error: error.message,
      });
    }
  }

  return results;
};
