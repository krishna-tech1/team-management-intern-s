import prisma from '../../config/prisma';
import { hashPassword } from '../../utils/password.utils';

// Get all employees with pagination
export const getAllEmployees = async (
  page = 1,
  limit = 10,
  status?: string,
  department?: string
) => {
  const skip = (page - 1) * limit;

  const where: any = { isDeleted: false };
  if (status) where.status = status;
  if (department) where.department = department;

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
        taskAssignments: {
          include: {
            task: {
              select: { id: true, title: true, status: true, priority: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.employee.count({ where }),
  ]);

  return { employees, total, page, limit };
};

// Get single employee by ID
export const getEmployeeById = async (id: number) => {
  const employee = await prisma.employee.findFirst({
    where: { id, isDeleted: false },
    include: {
      user: {
        select: { id: true, email: true, role: true },
      },
      taskAssignments: {
        include: {
          task: {
            include: { client: true },
          },
        },
      },
      attendances: {
        orderBy: { createdAt: 'desc' },
        take: 7,
      },
      notifications: {
        where: { isRead: false },
        take: 5,
      },
    },
  });

  if (!employee) throw new Error('Employee not found');
  return employee;
};

// Create employee + linked user account
export const createEmployee = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  joiningDate: string;
  password: string;
  role?: string;
  employeeCode?: string;
  profilePhotoUrl?: string;
  profilePhotoPublicId?: string;
}) => {
  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) throw new Error('Email already exists');

  const hashed = await hashPassword(data.password);

  // Auto-generate employee code if not provided
  const count = await prisma.employee.count();
  const employeeCode =
    data.employeeCode ||
    `FC-${(data.department || 'EMP').toUpperCase().slice(0, 3)}-${String(count + 1).padStart(4, '0')}`;

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashed,
      role: (data.role as any) || 'EMPLOYEE',
      employee: {
        create: {
          employeeCode,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          department: data.department,
          designation: data.designation,
          joiningDate: new Date(data.joiningDate),
          status: 'ACTIVE',
          profilePhotoUrl: data.profilePhotoUrl,
          profilePhotoPublicId: data.profilePhotoPublicId,
        },
      },
    },
    include: { employee: true },
  });

  return user.employee;
};

// Update employee
export const updateEmployee = async (
  id: number,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    department?: string;
    designation?: string;
    status?: string;
  }
) => {
  const employee = await prisma.employee.findFirst({
    where: { id, isDeleted: false },
  });
  if (!employee) throw new Error('Employee not found');

  return prisma.employee.update({
    where: { id },
    data: {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.phone && { phone: data.phone }),
      ...(data.department && { department: data.department }),
      ...(data.designation && { designation: data.designation }),
      ...(data.status && { status: data.status as any }),
    },
  });
};

// Soft delete employee
export const deleteEmployee = async (id: number) => {
  const employee = await prisma.employee.findFirst({
    where: { id, isDeleted: false },
  });
  if (!employee) throw new Error('Employee not found');

  await prisma.employee.update({
    where: { id },
    data: { isDeleted: true, status: 'INACTIVE' },
  });

  // Also soft delete linked user
  if (employee.userId) {
    await prisma.user.update({
      where: { id: employee.userId },
      data: { isDeleted: true },
    });
  }

  return { message: 'Employee deactivated successfully' };
};