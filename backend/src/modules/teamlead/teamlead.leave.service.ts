import prisma from '../../config/prisma';
import { getTeamMemberIds } from './teamlead.helper';

export const getTLLeaves = async (
  userId: number,
  page = 1,
  limit = 10,
  status?: string
) => {
  const memberIds = await getTeamMemberIds(userId);
  const skip = (page - 1) * limit;

  const where: any = { employeeId: { in: memberIds } };
  if (status) where.status = status.toUpperCase();

  const [leaves, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      skip,
      take: limit,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return { leaves, total, page, limit };
};

export const getTLLeaveById = async (userId: number, leaveId: number) => {
  const memberIds = await getTeamMemberIds(userId);
  const leave = await prisma.leaveRequest.findFirst({
    where: { id: leaveId, employeeId: { in: memberIds } },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, email: true, designation: true } },
    },
  });
  if (!leave) throw new Error('Leave request not found');
  return leave;
};

export const reviewLeave = async (
  userId: number,
  reviewerEmail: string,
  leaveId: number,
  action: 'APPROVED' | 'REJECTED',
  note?: string
) => {
  const memberIds = await getTeamMemberIds(userId);
  const leave = await prisma.leaveRequest.findFirst({
    where: { id: leaveId, employeeId: { in: memberIds } },
  });
  if (!leave) throw new Error('Leave request not found');
  if (leave.status !== 'PENDING') throw new Error('Leave is already reviewed');

  return prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status: action,
      reviewedBy: reviewerEmail,
      reviewNote: note,
      reviewedAt: new Date(),
    },
  });
};
