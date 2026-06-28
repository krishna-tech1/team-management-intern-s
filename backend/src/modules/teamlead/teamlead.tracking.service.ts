import prisma from '../../config/prisma';
import { getTeamMemberIds } from './teamlead.helper';

export const getTLTracking = async (userId: number) => {
  const memberIds = await getTeamMemberIds(userId);
  if (memberIds.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const employees = await prisma.employee.findMany({
    where: { id: { in: memberIds }, isDeleted: false },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      designation: true,
      department: true,
      status: true,
      attendances: {
        where: { createdAt: { gte: today, lt: tomorrow } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      assignedTasks: {
        where: { status: 'IN_PROGRESS', isDeleted: false },
        select: { id: true, title: true, priority: true, dueDate: true },
        take: 1,
      },
    },
  });

  // Attendance percentage for each employee (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return Promise.all(
    employees.map(async (emp) => {
      const todayAttendance = emp.attendances[0];
      const currentTask = emp.assignedTasks[0] || null;

      const last30 = await prisma.attendance.findMany({
        where: { employeeId: emp.id, createdAt: { gte: thirtyDaysAgo } },
        select: { status: true },
      });
      const presentDays = last30.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const attendancePct = last30.length > 0 ? Math.round((presentDays / last30.length) * 100) : 0;

      // Determine tracking status
      let trackingStatus: 'CHECKED_IN' | 'CHECKED_OUT' | 'LATE' | 'OFFLINE' = 'OFFLINE';
      if (todayAttendance) {
        if (todayAttendance.status === 'PRESENT') trackingStatus = todayAttendance.checkOutTime ? 'CHECKED_OUT' : 'CHECKED_IN';
        else if (todayAttendance.status === 'LATE') trackingStatus = 'LATE';
        else trackingStatus = 'OFFLINE';
      }

      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        designation: emp.designation,
        department: emp.department,
        employeeStatus: emp.status,
        trackingStatus,
        checkInTime: todayAttendance?.checkInTime || null,
        checkOutTime: todayAttendance?.checkOutTime || null,
        location: todayAttendance
          ? {
              checkInLatitude: todayAttendance.checkInLatitude,
              checkInLongitude: todayAttendance.checkInLongitude,
              checkInAddress: todayAttendance.checkInAddress,
              checkOutLatitude: todayAttendance.checkOutLatitude,
              checkOutLongitude: todayAttendance.checkOutLongitude,
              checkOutAddress: todayAttendance.checkOutAddress,
            }
          : null,
        currentTask,
        attendancePct,
      };
    })
  );
};
