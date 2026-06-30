import prisma from '../../config/prisma';
import { getTeamMemberIds } from './teamlead.helper';

export const getTLEmployees = async (
  userId: number,
  page = 1,
  limit = 10,
  search?: string,
  status?: string,
  department?: string
) => {
  const memberIds = await getTeamMemberIds(userId);
  const skip = (page - 1) * limit;

  const where: any = { id: { in: memberIds }, isDeleted: false };
  if (status) where.status = status.toUpperCase();
  if (department) where.department = { contains: department, mode: 'insensitive' };
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { employeeCode: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true, employeeCode: true, firstName: true, lastName: true,
        email: true, phone: true, department: true, designation: true,
        status: true, isActive: true, joiningDate: true,
        taskAssignments: {
          select: {
            task: {
              select: { id: true, title: true, status: true, priority: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.employee.count({ where }),
  ]);

  return { employees, total, page, limit };
};

export const getTLEmployeeById = async (userId: number, employeeId: number) => {
  const memberIds = await getTeamMemberIds(userId);
  if (!memberIds.includes(employeeId)) throw new Error('Employee not in your team');

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, isDeleted: false },
    include: {
      user: { select: { email: true, role: true, isActive: true } },
      assignedTasks: {
        where: { isDeleted: false },
        select: { id: true, title: true, status: true, priority: true, dueDate: true },
        orderBy: { createdAt: 'desc' },
      },
      taskAssignments: {
        include: {
          task: {
            include: { client: true }
          }
        }
      },
      attendances: { orderBy: { createdAt: 'desc' }, take: 30 },
      leaveRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!employee) throw new Error('Employee not found');

  // Performance summary
  const totalTasks = employee.assignedTasks.length;
  const completedTasks = employee.assignedTasks.filter((t) => t.status === 'COMPLETED').length;
  const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const presentDays = employee.attendances.filter((a) => a.status === 'PRESENT').length;
  const attendancePct = employee.attendances.length > 0
    ? Math.round((presentDays / employee.attendances.length) * 100)
    : 0;

  return {
    ...employee,
    performance: { totalTasks, completedTasks, efficiency, attendancePct },
  };
};

export const updateTLEmployee = async (
  userId: number,
  employeeId: number,
  data: { designation?: string; status?: string; remarks?: string }
) => {
  const memberIds = await getTeamMemberIds(userId);
  if (!memberIds.includes(employeeId)) throw new Error('Employee not in your team');

  const employee = await prisma.employee.findFirst({ where: { id: employeeId, isDeleted: false } });
  if (!employee) throw new Error('Employee not found');

  return prisma.employee.update({
    where: { id: employeeId },
    data: {
      ...(data.designation && { designation: data.designation }),
      ...(data.status && { status: data.status.toUpperCase() as any }),
    },
  });
};
