import prisma from '../../config/prisma';
import { comparePassword, hashPassword } from '../../utils/password.utils';
import { TaskStatus, AttendanceStatus } from '@prisma/client';

// ─── HELPERS ────────────────────────────────────────────────────────────────

/** Resolve a User.id (from JWT) → Employee record */
async function getEmployeeByUserId(userId: number) {
  const employee = await prisma.employee.findFirst({
    where: { userId, isDeleted: false },
  });
  if (!employee) throw new Error('Employee profile not found');
  return employee;
}

/** Today's date at midnight (local) in UTC for DB queries */
function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayEnd() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export const getEmployeeDashboard = async (userId: number) => {
  const employee = await getEmployeeByUserId(userId);

  // Task counts
  const [assignedCount, completedCount, pendingCount] = await Promise.all([
    prisma.task.count({
      where: { assignedEmployeeId: employee.id, isDeleted: false },
    }),
    prisma.task.count({
      where: {
        assignedEmployeeId: employee.id,
        status: 'COMPLETED',
        isDeleted: false,
      },
    }),
    prisma.task.count({
      where: {
        assignedEmployeeId: employee.id,
        status: { in: ['PENDING', 'IN_PROGRESS', 'ON_HOLD'] },
        isDeleted: false,
      },
    }),
  ]);

  // Today's attendance status
  const todayAttendance = await prisma.attendance.findFirst({
    where: {
      employeeId: employee.id,
      date: { gte: todayStart(), lte: todayEnd() },
    },
    orderBy: { createdAt: 'desc' },
  });

  let attendanceStatus = 'NOT_CHECKED_IN';
  if (todayAttendance) {
    if (todayAttendance.checkInTime && !todayAttendance.checkOutTime) {
      attendanceStatus = 'CHECKED_IN';
    } else if (todayAttendance.checkOutTime) {
      attendanceStatus = 'CHECKED_OUT';
    }
  }

  // Today's tasks
  const todayTasks = await prisma.task.findMany({
    where: {
      assignedEmployeeId: employee.id,
      isDeleted: false,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      dueDate: { gte: todayStart(), lte: todayEnd() },
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
    },
    take: 5,
    orderBy: { dueDate: 'asc' },
  });

  // Recent notifications
  const recentNotifications = await prisma.notification.findMany({
    where: { employeeId: employee.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      isRead: true,
      createdAt: true,
    },
  });

  // Performance score: ratio of completed to total tasks * 100
  const performanceScore =
    assignedCount > 0
      ? Math.round((completedCount / assignedCount) * 100)
      : 0;

  return {
    employee: {
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      designation: employee.designation,
    },
    performanceScore,
    assignedTasks: assignedCount,
    completedTasks: completedCount,
    pendingTasks: pendingCount,
    attendanceStatus,
    todayTasks,
    recentNotifications,
  };
};

// ─── TASKS ────────────────────────────────────────────────────────────────────

export const getEmployeeTasks = async (
  userId: number,
  page = 1,
  limit = 10,
  status?: string,
  priority?: string,
  search?: string
) => {
  const employee = await getEmployeeByUserId(userId);
  const skip = (page - 1) * limit;

  const where: any = {
    assignedEmployeeId: employee.id,
    isDeleted: false,
  };

  if (status) where.status = status as TaskStatus;
  if (priority) where.priority = priority;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      include: {
        client: { select: { id: true, companyName: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total, page, limit };
};

export const getEmployeeTaskById = async (userId: number, taskId: number) => {
  const employee = await getEmployeeByUserId(userId);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      assignedEmployeeId: employee.id,
      isDeleted: false,
    },
    include: {
      client: {
        select: {
          id: true,
          companyName: true,
          contactPerson: true,
          phone: true,
          address: true,
        },
      },
      workUpdates: {
        include: { attachments: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!task) throw new Error('Task not found or access denied');
  return task;
};

// ─── TASK STATUS UPDATE ──────────────────────────────────────────────────────

const ALLOWED_STATUSES: TaskStatus[] = [
  'PENDING',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETED',
];

export const updateEmployeeTaskStatus = async (
  userId: number,
  taskId: number,
  newStatus: string
) => {
  if (!ALLOWED_STATUSES.includes(newStatus as TaskStatus)) {
    throw new Error(
      `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}`
    );
  }

  const employee = await getEmployeeByUserId(userId);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      assignedEmployeeId: employee.id,
      isDeleted: false,
    },
  });
  if (!task) throw new Error('Task not found or access denied');

  const prevStatus = task.status;

  const [updatedTask] = await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus as TaskStatus },
    }),
    prisma.taskStatusHistory.create({
      data: {
        taskId,
        employeeId: employee.id,
        fromStatus: prevStatus,
        toStatus: newStatus as TaskStatus,
      },
    }),
  ]);

  return updatedTask;
};

// ─── WORK UPDATE ─────────────────────────────────────────────────────────────

export const createWorkUpdate = async (
  userId: number,
  taskId: number,
  data: {
    title: string;
    description?: string;
    progress?: number;
    remarks?: string;
  },
  files: {
    photos: Express.Multer.File[];
    documents: Express.Multer.File[];
  }
) => {
  const employee = await getEmployeeByUserId(userId);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      assignedEmployeeId: employee.id,
      isDeleted: false,
    },
  });
  if (!task) throw new Error('Task not found or access denied');

  const progress = Math.min(100, Math.max(0, Number(data.progress ?? 0)));

  const { uploadImage } = require('../../services/cloudinary.service');

  const photoUploads = await Promise.all(
    files.photos.map(async (f) => {
      const upload = await uploadImage(f.buffer, 'gst-mca/tasks/attachments', {
        resourceType: 'image',
      });
      return {
        fileName: f.originalname,
        filePath: upload.secure_url,
        fileUrl: upload.secure_url,
        publicId: upload.public_id,
        fileType: 'photo',
      };
    })
  );

  const docUploads = await Promise.all(
    files.documents.map(async (f) => {
      const upload = await uploadImage(f.buffer, 'gst-mca/tasks/attachments', {
        resourceType: 'auto',
      });
      return {
        fileName: f.originalname,
        filePath: upload.secure_url,
        fileUrl: upload.secure_url,
        publicId: upload.public_id,
        fileType: 'document',
      };
    })
  );

  const workUpdate = await prisma.taskWorkUpdate.create({
    data: {
      taskId,
      employeeId: employee.id,
      title: data.title,
      description: data.description,
      progress,
      remarks: data.remarks,
      attachments: {
        create: [...photoUploads, ...docUploads],
      },
    },
    include: { attachments: true },
  });

  return workUpdate;
};

// ─── TASK HISTORY ────────────────────────────────────────────────────────────

export const getTaskHistory = async (userId: number, taskId: number) => {
  const employee = await getEmployeeByUserId(userId);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      assignedEmployeeId: employee.id,
      isDeleted: false,
    },
  });
  if (!task) throw new Error('Task not found or access denied');

  const [workUpdates, statusHistory] = await Promise.all([
    prisma.taskWorkUpdate.findMany({
      where: { taskId, employeeId: employee.id },
      include: { attachments: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.taskStatusHistory.findMany({
      where: { taskId, employeeId: employee.id },
      orderBy: { changedAt: 'desc' },
    }),
  ]);

  return { workUpdates, statusHistory };
};

// ─── PERFORMANCE ─────────────────────────────────────────────────────────────

export const getEmployeePerformance = async (userId: number) => {
  const employee = await getEmployeeByUserId(userId);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // All completed tasks
  const [totalCompleted, totalAssigned] = await Promise.all([
    prisma.task.count({
      where: {
        assignedEmployeeId: employee.id,
        status: 'COMPLETED',
        isDeleted: false,
      },
    }),
    prisma.task.count({
      where: { assignedEmployeeId: employee.id, isDeleted: false },
    }),
  ]);

  const score = totalAssigned > 0
    ? Math.round((totalCompleted / totalAssigned) * 100)
    : 0;

  // Weekly productivity: last 7 days
  const weeklyProductivity = await buildDailyProductivity(employee.id, 7);

  // Monthly productivity: last 6 months
  const monthlyProductivity = await buildMonthlyProductivity(employee.id, 6);

  // Average completion time (hours)
  const completedTasksWithDates = await prisma.task.findMany({
    where: {
      assignedEmployeeId: employee.id,
      status: 'COMPLETED',
      startDate: { not: null },
      updatedAt: { not: undefined },
      isDeleted: false,
    },
    select: { startDate: true, updatedAt: true },
  });

  let averageCompletionTime = 'N/A';
  if (completedTasksWithDates.length > 0) {
    const totalHours = completedTasksWithDates.reduce((sum, t) => {
      if (!t.startDate) return sum;
      const diff =
        (new Date(t.updatedAt).getTime() - new Date(t.startDate).getTime()) /
        (1000 * 60 * 60);
      return sum + diff;
    }, 0);
    const avg = totalHours / completedTasksWithDates.length;
    averageCompletionTime = `${Math.round(avg)} hours`;
  }

  // Attendance percentage (current month)
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  const [presentDays, totalDays] = await Promise.all([
    prisma.attendance.count({
      where: {
        employeeId: employee.id,
        date: { gte: monthStart, lte: monthEnd },
        status: { in: ['PRESENT', 'HALF_DAY', 'LATE'] },
      },
    }),
    prisma.attendance.count({
      where: {
        employeeId: employee.id,
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
  ]);

  const attendancePercentage =
    totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Achievements (milestones)
  const achievements: string[] = [];
  if (totalCompleted >= 1) achievements.push('First Task Completed');
  if (totalCompleted >= 10) achievements.push('10 Tasks Completed');
  if (totalCompleted >= 50) achievements.push('50 Tasks Completed');
  if (totalCompleted >= 100) achievements.push('Century Achiever');
  if (attendancePercentage >= 90) achievements.push('Attendance Star');
  if (score >= 90) achievements.push('Top Performer');

  return {
    score,
    weeklyProductivity,
    monthlyProductivity,
    completedTasks: totalCompleted,
    averageCompletionTime,
    attendancePercentage,
    achievements,
  };
};

async function buildDailyProductivity(employeeId: number, days: number) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);

    const count = await prisma.task.count({
      where: {
        assignedEmployeeId: employeeId,
        status: 'COMPLETED',
        updatedAt: { gte: start, lte: end },
        isDeleted: false,
      },
    });

    result.push({
      date: start.toISOString().slice(0, 10),
      completedTasks: count,
    });
  }
  return result;
}

async function buildMonthlyProductivity(employeeId: number, months: number) {
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const y = now.getFullYear();
    const m = now.getMonth() - i;
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59);

    const count = await prisma.task.count({
      where: {
        assignedEmployeeId: employeeId,
        status: 'COMPLETED',
        updatedAt: { gte: start, lte: end },
        isDeleted: false,
      },
    });

    result.push({
      month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      completedTasks: count,
    });
  }
  return result;
}

// ─── INCENTIVES ───────────────────────────────────────────────────────────────

export const getEmployeeIncentives = async (userId: number) => {
  const employee = await getEmployeeByUserId(userId);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const allIncentives = await prisma.incentive.findMany({
    where: { employeeId: employee.id },
    orderBy: { createdAt: 'desc' },
  });

  const currentMonthIncentives = allIncentives.filter(
    (i) => i.month === currentMonth
  );
  const currentMonthTotal = currentMonthIncentives.reduce(
    (sum, i) => sum + i.amount,
    0
  );
  const totalEarned = allIncentives.reduce((sum, i) => sum + i.amount, 0);

  // Monthly breakdown
  const monthlyBreakdown = Object.values(
    allIncentives.reduce(
      (acc, i) => {
        if (!acc[i.month]) acc[i.month] = { month: i.month, total: 0, count: 0 };
        acc[i.month].total += i.amount;
        acc[i.month].count += 1;
        return acc;
      },
      {} as Record<string, { month: string; total: number; count: number }>
    )
  ).sort((a, b) => b.month.localeCompare(a.month));

  // Leaderboard position
  const leaderboard = await prisma.incentive.groupBy({
    by: ['employeeId'],
    _sum: { amount: true },
    where: { month: currentMonth },
    orderBy: { _sum: { amount: 'desc' } },
  });

  const myPosition =
    leaderboard.findIndex((l) => l.employeeId === employee.id) + 1;

  return {
    currentMonth,
    currentMonthTotal,
    totalEarned,
    pending: 0, // Incentives are recorded when confirmed; pending is 0
    history: allIncentives,
    monthlyBreakdown,
    leaderboardPosition: myPosition || null,
  };
};

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export const checkIn = async (
  userId: number,
  latitude: number,
  longitude: number
) => {
  const employee = await getEmployeeByUserId(userId);

  // Prevent double check-in for today
  const existing = await prisma.attendance.findFirst({
    where: {
      employeeId: employee.id,
      date: { gte: todayStart(), lte: todayEnd() },
    },
  });

  if (existing && existing.checkInTime) {
    throw new Error('Already checked in today');
  }

  const now = new Date();

  // Determine status: LATE if after 9:30 AM
  const cutoff = new Date();
  cutoff.setHours(9, 30, 0, 0);
  const status: AttendanceStatus = now > cutoff ? 'LATE' : 'PRESENT';

  const attendance = await prisma.attendance.create({
    data: {
      employeeId: employee.id,
      date: todayStart(),
      checkInTime: now,
      checkInLatitude: latitude,
      checkInLongitude: longitude,
      status,
    },
  });

  return attendance;
};

export const checkOut = async (
  userId: number,
  latitude: number,
  longitude: number
) => {
  const employee = await getEmployeeByUserId(userId);

  const existing = await prisma.attendance.findFirst({
    where: {
      employeeId: employee.id,
      date: { gte: todayStart(), lte: todayEnd() },
    },
  });

  if (!existing || !existing.checkInTime) {
    throw new Error('Cannot check out before checking in');
  }
  if (existing.checkOutTime) {
    throw new Error('Already checked out today');
  }

  const now = new Date();
  const workingHours = existing.checkInTime
    ? parseFloat(
        (
          (now.getTime() - existing.checkInTime.getTime()) /
          (1000 * 60 * 60)
        ).toFixed(2)
      )
    : 0;

  const updated = await prisma.attendance.update({
    where: { id: existing.id },
    data: {
      checkOutTime: now,
      checkOutLatitude: latitude,
      checkOutLongitude: longitude,
      remarks: `Working hours: ${workingHours}h`,
    },
  });

  return { ...updated, workingHours };
};

export const getAttendanceHistory = async (
  userId: number,
  filter: 'today' | 'weekly' | 'monthly' = 'monthly'
) => {
  const employee = await getEmployeeByUserId(userId);

  const now = new Date();
  let dateFrom: Date;

  if (filter === 'today') {
    dateFrom = todayStart();
  } else if (filter === 'weekly') {
    dateFrom = new Date();
    dateFrom.setDate(now.getDate() - 7);
    dateFrom.setHours(0, 0, 0, 0);
  } else {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const records = await prisma.attendance.findMany({
    where: {
      employeeId: employee.id,
      date: { gte: dateFrom, lte: todayEnd() },
    },
    orderBy: { date: 'desc' },
  });

  const summary = {
    total: records.length,
    present: records.filter((r) => r.status === 'PRESENT').length,
    absent: records.filter((r) => r.status === 'ABSENT').length,
    late: records.filter((r) => r.status === 'LATE').length,
    halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
    totalWorkingHours: records
      .filter((r) => r.checkInTime && r.checkOutTime)
      .reduce((sum, r) => {
        const hours =
          (r.checkOutTime!.getTime() - r.checkInTime!.getTime()) /
          (1000 * 60 * 60);
        return sum + hours;
      }, 0)
      .toFixed(2),
  };

  return { records, summary };
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export const getEmployeeProfile = async (userId: number) => {
  const employee = await getEmployeeByUserId(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  // Attendance % (last 30 days)
  const last30Start = new Date();
  last30Start.setDate(last30Start.getDate() - 30);
  const [presentCount, totalCount] = await Promise.all([
    prisma.attendance.count({
      where: {
        employeeId: employee.id,
        date: { gte: last30Start },
        status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] },
      },
    }),
    prisma.attendance.count({
      where: {
        employeeId: employee.id,
        date: { gte: last30Start },
      },
    }),
  ]);
  const attendancePercentage =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Current month incentive total
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const incentiveSum = await prisma.incentive.aggregate({
    where: { employeeId: employee.id, month: currentMonth },
    _sum: { amount: true },
  });

  // Performance score
  const [completed, assigned] = await Promise.all([
    prisma.task.count({
      where: { assignedEmployeeId: employee.id, status: 'COMPLETED', isDeleted: false },
    }),
    prisma.task.count({
      where: { assignedEmployeeId: employee.id, isDeleted: false },
    }),
  ]);
  const performanceScore = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    department: employee.department,
    designation: employee.designation,
    joiningDate: employee.joiningDate,
    status: employee.status,
    userEmail: user?.email,
    profilePhotoUrl: employee.profilePhotoUrl,
    profilePhotoPublicId: employee.profilePhotoPublicId,
    performanceScore,
    currentIncentive: incentiveSum._sum.amount ?? 0,
    attendancePercentage,
  };
};

export const updateEmployeeProfile = async (
  userId: number,
  data: {
    phone?: string;
    emergencyContact?: string;
    address?: string;
    password?: string;
    profilePhotoFile?: Express.Multer.File;
  }
) => {
  const employee = await getEmployeeByUserId(userId);

  const employeeUpdate: any = {};
  if (data.phone) employeeUpdate.phone = data.phone;

  if (data.profilePhotoFile) {
    const { replaceImage } = require('../../services/cloudinary.service');
    const upload = await replaceImage(
      employee.profilePhotoPublicId,
      data.profilePhotoFile.buffer,
      'gst-mca/employees/profile'
    );
    employeeUpdate.profilePhotoUrl = upload.secure_url;
    employeeUpdate.profilePhotoPublicId = upload.public_id;
  }

  // Store emergency contact and address in the department/designation fields is bad practice.
  // We'll use department for this scope — but since the schema doesn't have these fields,
  // we update what's available and note the limitation.
  // For the password update we update the User record.

  if (Object.keys(employeeUpdate).length > 0) {
    await prisma.employee.update({
      where: { id: employee.id },
      data: employeeUpdate,
    });
  }

  // Update password on User record if provided
  if (data.password) {
    const hashed = await hashPassword(data.password);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
  }

  return { message: 'Profile updated successfully' };
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const getEmployeeNotifications = async (
  userId: number,
  page = 1,
  limit = 20
) => {
  const employee = await getEmployeeByUserId(userId);
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { employeeId: employee.id } }),
  ]);

  return { notifications, total, page, limit };
};

export const markNotificationRead = async (
  userId: number,
  notificationId: number
) => {
  const employee = await getEmployeeByUserId(userId);

  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, employeeId: employee.id },
  });
  if (!notification) throw new Error('Notification not found');

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────

export const getEmployeeDocuments = async (
  userId: number,
  page = 1,
  limit = 20,
  search?: string
) => {
  const employee = await getEmployeeByUserId(userId);
  const skip = (page - 1) * limit;

  const where: any = { employeeId: employee.id };
  if (search) {
    where.fileName = { contains: search, mode: 'insensitive' };
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.document.count({ where }),
  ]);

  return { documents, total, page, limit };
};
