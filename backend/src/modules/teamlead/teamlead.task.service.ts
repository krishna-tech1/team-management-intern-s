import prisma from '../../config/prisma';
import { getTeamMemberIds } from './teamlead.helper';
import { createAuditLog } from '../auditlogs/auditlog.service';

export const getTLTasks = async (
  userId: number,
  page = 1,
  limit = 10,
  search?: string,
  status?: string,
  priority?: string,
  clientId?: number,
  employeeId?: number
) => {
  const memberIds = await getTeamMemberIds(userId);
  const skip = (page - 1) * limit;

  const where: any = {
    isDeleted: false,
    OR: [
      { assignedEmployeeId: { in: memberIds } },
      { assignedEmployeeId: null },
    ],
  };

  if (status) where.status = status.toUpperCase();
  if (priority) where.priority = priority.toUpperCase();
  if (clientId) where.clientId = clientId;
  if (employeeId) where.assignedEmployeeId = employeeId;
  if (search) {
    where.AND = [
      {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      },
    ];
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      include: {
        client: { select: { id: true, companyName: true } },
        assignedEmployee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total, page, limit };
};

export const createTLTask = async (
  userId: number,
  data: {
    title: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
    assignedEmployeeId?: number;
    clientId: number;
  }
) => {
  const memberIds = await getTeamMemberIds(userId);

  if (data.assignedEmployeeId && !memberIds.includes(data.assignedEmployeeId)) {
    throw new Error('Assigned employee is not in your team');
  }

  const client = await prisma.client.findFirst({ where: { id: data.clientId, isDeleted: false } });
  if (!client) throw new Error('Client not found');

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: (data.priority?.toUpperCase() as any) || 'MEDIUM',
      status: (data.status?.toUpperCase() as any) || 'PENDING',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      clientId: data.clientId,
      assignedEmployeeId: data.assignedEmployeeId,
      createdBy: `teamlead:${userId}`,
    },
  });

  if (data.assignedEmployeeId) {
    await prisma.taskAssignment.create({
      data: { taskId: task.id, employeeId: data.assignedEmployeeId },
    });
  }

  // Log to AuditLog
  await createAuditLog('Task created', `teamlead:${userId}`, 'Task', task.id);

  return task;
};

export const updateTLTask = async (
  userId: number,
  taskId: number,
  data: {
    status?: string;
    priority?: string;
    dueDate?: string;
    assignedEmployeeId?: number;
    title?: string;
    description?: string;
  }
) => {
  const memberIds = await getTeamMemberIds(userId);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      isDeleted: false,
      OR: [{ assignedEmployeeId: { in: memberIds } }, { assignedEmployeeId: null }],
    },
  });
  if (!task) throw new Error('Task not found or not accessible');

  if (data.assignedEmployeeId && !memberIds.includes(data.assignedEmployeeId)) {
    throw new Error('Assigned employee is not in your team');
  }

  const assignmentChanged = data.assignedEmployeeId !== undefined && data.assignedEmployeeId !== task.assignedEmployeeId;

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status && { status: data.status.toUpperCase() as any }),
      ...(data.priority && { priority: data.priority.toUpperCase() as any }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.assignedEmployeeId !== undefined && { assignedEmployeeId: data.assignedEmployeeId }),
    },
  });

  if (assignmentChanged) {
    await prisma.taskAssignment.deleteMany({ where: { taskId } });
    if (data.assignedEmployeeId) {
      await prisma.taskAssignment.create({ data: { taskId, employeeId: data.assignedEmployeeId } });
    }
  }

  // Log to AuditLog
  await createAuditLog('Task updated', `teamlead:${userId}`, 'Task', taskId);

  return updated;
};

export const deleteTLTask = async (userId: number, taskId: number) => {
  const memberIds = await getTeamMemberIds(userId);
  const task = await prisma.task.findFirst({
    where: { id: taskId, isDeleted: false, assignedEmployeeId: { in: memberIds } },
  });
  if (!task) throw new Error('Task not found or not accessible');
  await prisma.task.update({ where: { id: taskId }, data: { isDeleted: true } });
  
  // Log to AuditLog
  await createAuditLog('Task deleted', `teamlead:${userId}`, 'Task', taskId);

  return { message: 'Task deleted successfully' };
};

