import prisma from '../../config/prisma';
import { getTeamMemberIds } from './teamlead.helper';

export const getTLNotifications = async (userId: number, page = 1, limit = 20) => {
  const memberIds = await getTeamMemberIds(userId);
  const skip = (page - 1) * limit;

  const where = { employeeId: { in: memberIds } };
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ]);

  return { notifications, total, page, limit };
};

export const createTLNotification = async (
  senderEmail: string,
  data: {
    title: string;
    message: string;
    employeeId?: number;
    type?: string;
    broadcastToTeam?: boolean;
  },
  teamMemberIds: number[]
) => {
  const notifType = (data.type?.toUpperCase() || 'ANNOUNCEMENT') as any;

  if (data.broadcastToTeam) {
    // Send to all team members
    const records = await prisma.notification.createMany({
      data: teamMemberIds.map((empId) => ({
        title: data.title,
        message: data.message,
        type: notifType,
        employeeId: empId,
        createdBy: senderEmail,
        isTeamLead: true,
      })),
    });
    return { sent: records.count };
  }

  if (!data.employeeId) throw new Error('employeeId is required when broadcastToTeam is false');
  if (!teamMemberIds.includes(data.employeeId)) throw new Error('Employee is not in your team');

  return prisma.notification.create({
    data: {
      title: data.title,
      message: data.message,
      type: notifType,
      employeeId: data.employeeId,
      createdBy: senderEmail,
      isTeamLead: true,
    },
  });
};

export const markNotificationRead = async (notifId: number) => {
  const notif = await prisma.notification.findUnique({ where: { id: notifId } });
  if (!notif) throw new Error('Notification not found');
  return prisma.notification.update({ where: { id: notifId }, data: { isRead: true } });
};
