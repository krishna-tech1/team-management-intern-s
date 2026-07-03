import prisma from '../../config/prisma';
import { createAuditLog } from '../auditlogs/auditlog.service';

// Get all tasks with pagination and filters
export const getAllTasks = async (
  page = 1,
  limit = 10,
  status?: string,
  priority?: string,
  clientId?: number,
  assignedEmployeeId?: number,
  filter?: string
) => {
  const skip = (page - 1) * limit;
  const where: any = { isDeleted: false };

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (clientId) where.clientId = clientId;
  if (assignedEmployeeId) where.assignedEmployeeId = assignedEmployeeId;
  if (filter) {
    const normalizedFilter = filter.toUpperCase();
    switch (normalizedFilter) {
      case 'PENDING':
        where.status = 'PENDING';
        break;
      case 'EMPLOYEE_PENDING':
        where.status = 'PENDING';
        where.assignedEmployeeId = { not: null };
        break;
      case 'DOCUMENT_PENDING':
        where.documents = { none: {} };
        break;
      case 'ASSIGNMENT_PENDING':
        where.assignedEmployeeId = null;
        break;
      default:
        break;
    }
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      include: {
        client: {
          select: { id: true, companyName: true, contactPerson: true, email: true },
        },
        assignedEmployee: {
          select: { id: true, firstName: true, lastName: true, email: true, department: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total, page, limit };
};

// Get single task by ID
export const getTaskById = async (id: number) => {
  const task = await prisma.task.findFirst({
    where: { id, isDeleted: false },
    include: {
      client: true,
      assignedEmployee: {
        select: { id: true, firstName: true, lastName: true, email: true, department: true },
      },
      workLogs: {
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
      assignments: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });

  if (!task) throw new Error('Task not found');
  return task;
};

// Create task
export const createTask = async (
  data: {
    title: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
    assignedEmployeeId?: number;
    clientId: number;
  },
  performedBy: string
) => {
  // Verify client exists
  const client = await prisma.client.findFirst({
    where: { id: data.clientId, isDeleted: false },
  });
  if (!client) throw new Error('Client not found');

  // Verify employee exists if provided
  if (data.assignedEmployeeId) {
    const employee = await prisma.employee.findFirst({
      where: { id: data.assignedEmployeeId, isDeleted: false },
    });
    if (!employee) throw new Error('Employee not found');
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: (data.priority as any) || 'MEDIUM',
      status: (data.status as any) || 'PENDING',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      clientId: data.clientId,
      assignedEmployeeId: data.assignedEmployeeId,
      createdBy: performedBy,
    },
  });

  // Sync TaskAssignment join table for backward compatibility
  if (data.assignedEmployeeId) {
    await prisma.taskAssignment.create({
      data: {
        taskId: task.id,
        employeeId: data.assignedEmployeeId,
      },
    });
  }

  // Log to AuditLog
  await createAuditLog('Task created', performedBy, 'Task', task.id);

  return task;
};

// Update task
export const updateTask = async (
  id: number,
  data: {
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
    assignedEmployeeId?: number;
    clientId?: number;
  },
  performedBy: string
) => {
  const task = await prisma.task.findFirst({
    where: { id, isDeleted: false },
  });
  if (!task) throw new Error('Task not found');

  if (data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, isDeleted: false },
    });
    if (!client) throw new Error('Client not found');
  }

  if (data.assignedEmployeeId) {
    const employee = await prisma.employee.findFirst({
      where: { id: data.assignedEmployeeId, isDeleted: false },
    });
    if (!employee) throw new Error('Employee not found');
  }

  const assignmentChanged =
    data.assignedEmployeeId !== undefined &&
    data.assignedEmployeeId !== task.assignedEmployeeId;

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority && { priority: data.priority as any }),
      ...(data.status && { status: data.status as any }),
      ...(data.dueDate !== undefined && {
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }),
      ...(data.clientId && { clientId: data.clientId }),
      ...(data.assignedEmployeeId !== undefined && {
        assignedEmployeeId: data.assignedEmployeeId,
      }),
    },
  });

  // Sync TaskAssignment join table
  if (assignmentChanged) {
    await prisma.taskAssignment.deleteMany({
      where: { taskId: id },
    });

    if (data.assignedEmployeeId) {
      await prisma.taskAssignment.create({
        data: {
          taskId: id,
          employeeId: data.assignedEmployeeId,
        },
      });
    }
  }

  // Log to AuditLog
  await createAuditLog('Task updated', performedBy, 'Task', id);

  return updatedTask;
};

// Soft delete task
export const deleteTask = async (id: number, performedBy: string) => {
  const task = await prisma.task.findFirst({
    where: { id, isDeleted: false },
  });
  if (!task) throw new Error('Task not found');

  await prisma.task.update({
    where: { id },
    data: { isDeleted: true },
  });

  // Log to AuditLog
  await createAuditLog('Task deleted', performedBy, 'Task', id);

  return { message: 'Task deleted successfully' };
};
