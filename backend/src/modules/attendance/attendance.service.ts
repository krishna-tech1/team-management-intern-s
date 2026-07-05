import prisma from '../../config/prisma';
import { calculateDistance, formatLocationData } from '../../utils/gpsUtils';
import { validateCheckIn, validateCheckOut } from '../../utils/validationUtils';
import { createAuditLog } from '../auditlogs/auditlog.service';

const CHECKOUT_RADIUS_METERS = 200; // 200 meter radius for checkout validation

/**
 * Record employee check-in with GPS coordinates
 */
export const checkIn = async (
  userId: number,
  data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    selfieUrl?: string;
  }
) => {
  // Validate coordinates
  const validation = validateCheckIn({
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: data.accuracy,
  });

  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  // Get employee
  const employee = await prisma.employee.findFirst({
    where: { userId, isDeleted: false },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Check if already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      employeeId: employee.id,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  if (existingAttendance) {
    throw new Error('Already checked in today');
  }

  // Create attendance record
  const now = new Date();
  const attendance = await prisma.attendance.create({
    data: {
      employeeId: employee.id,
      checkInTime: now,
      checkInLatitude: data.latitude,
      checkInLongitude: data.longitude,
      checkInAddress: data.address,
      locationAccuracy: data.accuracy,
      status: 'PRESENT',
      date: today,
      selfieUrl: data.selfieUrl,
    },
  });

  // Record GPS tracking
  await prisma.gPSTracking.create({
    data: {
      employeeId: employee.id,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      accuracy: data.accuracy,
      eventType: 'CHECK_IN',
      eventId: attendance.id,
    },
  });

  // Create audit log
  await createAuditLog(
    `Employee checked in at ${data.address || `${data.latitude}, ${data.longitude}`}`,
    `employee:${employee.id}`,
    'Attendance',
    attendance.id
  );

  return {
    ...attendance,
    locationData: formatLocationData(data.latitude, data.longitude, data.address, data.accuracy),
  };
};

/**
 * Record employee check-out with GPS coordinates and radius validation
 */
export const checkOut = async (
  userId: number,
  data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    selfieUrl?: string;
  }
) => {
  // Get employee
  const employee = await prisma.employee.findFirst({
    where: { userId, isDeleted: false },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Get today's attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await prisma.attendance.findFirst({
    where: {
      employeeId: employee.id,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  if (!existing) {
    throw new Error('No check-in found for today');
  }

  if (existing.checkOutTime) {
    throw new Error('Already checked out today');
  }

  if (!existing.checkInLatitude || !existing.checkInLongitude) {
    throw new Error('Check-in location not recorded. Cannot validate checkout distance.');
  }

  // Validate coordinates
  const validation = validateCheckOut({
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: data.accuracy,
    checkInLatitude: existing.checkInLatitude,
    checkInLongitude: existing.checkInLongitude,
    radiusMeters: CHECKOUT_RADIUS_METERS,
  });

  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  // Calculate distance and working hours
  const distance = calculateDistance(
    existing.checkInLatitude,
    existing.checkInLongitude,
    data.latitude,
    data.longitude
  );

  const now = new Date();
  const workingHours = existing.checkInTime
    ? parseFloat(
        (
          (now.getTime() - existing.checkInTime.getTime()) /
          (1000 * 60 * 60)
        ).toFixed(2)
      )
    : 0;

  // Update attendance record
  const updated = await prisma.attendance.update({
    where: { id: existing.id },
    data: {
      checkOutTime: now,
      checkOutLatitude: data.latitude,
      checkOutLongitude: data.longitude,
      checkOutAddress: data.address,
      workingHours: workingHours,
      remarks: `Working hours: ${workingHours}h`,
      selfieUrl: data.selfieUrl,
    },
  });

  // Record GPS tracking
  await prisma.gPSTracking.create({
    data: {
      employeeId: employee.id,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      accuracy: data.accuracy,
      eventType: 'CHECK_OUT',
      eventId: updated.id,
    },
  });

  // Create audit log
  await createAuditLog(
    `Employee checked out at ${data.address || `${data.latitude}, ${data.longitude}`}. Working hours: ${workingHours}h`,
    `employee:${employee.id}`,
    'Attendance',
    updated.id
  );

  return {
    ...updated,
    workingHours,
    distance,
    locationData: formatLocationData(data.latitude, data.longitude, data.address, data.accuracy),
  };
};

/**
 * Get attendance history for employee
 */
export const getAttendanceHistory = async (
  userId: number,
  page: number = 1,
  limit: number = 10
) => {
  const employee = await prisma.employee.findFirst({
    where: { userId, isDeleted: false },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
      },
      select: {
        id: true,
        date: true,
        status: true,
        checkInTime: true,
        checkOutTime: true,
        checkInLatitude: true,
        checkInLongitude: true,
        checkOutLatitude: true,
        checkOutLongitude: true,
        checkInAddress: true,
        checkOutAddress: true,
        workingHours: true,
        remarks: true,
        locationAccuracy: true,
        createdAt: true,
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.attendance.count({ where: { employeeId: employee.id } }),
  ]);

  return { records, total, page, limit };
};

/**
 * Get attendance summary for employee (week/month)
 */
export const getAttendanceSummary = async (
  userId: number,
  period: 'WEEK' | 'MONTH' = 'WEEK'
) => {
  const employee = await prisma.employee.findFirst({
    where: { userId, isDeleted: false },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  let dateFrom = new Date();
  const now = new Date();

  if (period === 'WEEK') {
    dateFrom.setDate(now.getDate() - 7);
  } else {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  dateFrom.setHours(0, 0, 0, 0);

  const todayEnd = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  };

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

  return {
    period,
    summary,
    records: records.map((r) => ({
      ...r,
      locationData: r.checkInLatitude
        ? formatLocationData(r.checkInLatitude, r.checkInLongitude!, r.checkInAddress ?? undefined)
        : null,
    })),
  };
};

/**
 * Get latest GPS location for employee
 */
export const getLatestGPSLocation = async (userId: number) => {
  const employee = await prisma.employee.findFirst({
    where: { userId, isDeleted: false },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  const latest = await prisma.gPSTracking.findFirst({
    where: { employeeId: employee.id },
    orderBy: { createdAt: 'desc' },
  });

  if (!latest) {
    throw new Error('No location data found');
  }

  return {
    ...latest,
    locationData: formatLocationData(latest.latitude, latest.longitude, latest.address ?? undefined, latest.accuracy ?? undefined),
  };
};

/**
 * Update attendance status (for admin/team lead)
 */
export const updateAttendanceStatus = async (
  attendanceId: number,
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE',
  remarks?: string
) => {
  const attendance = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      status,
      ...(remarks !== undefined && { remarks }),
    },
  });

  await createAuditLog(
    `Attendance status updated to ${status}`,
    'admin',
    'Attendance',
    attendance.id
  );

  return attendance;
};
