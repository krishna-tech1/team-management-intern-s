import prisma from '../../config/prisma';
import { hashPassword, generateDefaultPasswordFromDOB } from '../../utils/passwordUtils';
import { createAuditLog } from '../auditlogs/auditlog.service';

/**
 * Onboard a new employee
 * Generates default password from DOB if not provided
 * Creates both Employee and User records
 */
export const onboardEmployee = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  joiningDate: Date;
  dateOfBirth: Date;
  password?: string;
  employeeCode: string;
}) => {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error(`Email ${data.email} is already in use`);
  }

  // Generate default password from DOB
  const generatedPassword = generateDefaultPasswordFromDOB(data.dateOfBirth);
  const passwordToUse = data.password || generatedPassword;
  const hashedPassword = await hashPassword(passwordToUse);

  // Create user account
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: 'EMPLOYEE',
      isActive: true,
    },
  });

  // Create employee record
  const employee = await prisma.employee.create({
    data: {
      employeeCode: data.employeeCode,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      department: data.department,
      designation: data.designation,
      joiningDate: data.joiningDate,
      dateOfBirth: data.dateOfBirth,
      userId: user.id,
      status: 'ACTIVE',
      passwordGenerationDate: new Date(),
    },
  });

  // Record password generation
  await prisma.passwordReset.create({
    data: {
      employeeId: employee.id,
      oldPassword: hashedPassword, // first time, so old = new
      newPassword: hashedPassword,
      resetBy: 'SYSTEM',
      reason: 'ONBOARDING',
    },
  });

  // Create audit log
  await createAuditLog(
    `Employee onboarded: ${employee.firstName} ${employee.lastName}`,
    'admin',
    'Employee',
    employee.id
  );

  return {
    employee: {
      id: employee.id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      department: employee.department,
      designation: employee.designation,
      joiningDate: employee.joiningDate,
      status: employee.status,
    },
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    credentials: {
      email: data.email,
      // Only return password in onboarding response, then never again
      tempPassword: generatedPassword,
      passwordExpiresDays: 30, // employees must change password within 30 days
      note: 'Password generated from date of birth (DDMMYY format). Please change on first login.',
    },
  };
};

/**
 * Get onboarding status of an employee
 */
export const getOnboardingStatus = async (employeeId: number) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      user: {
        select: { id: true, email: true, role: true, isActive: true },
      },
    },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Check if user has set their own password (should have a password reset record with reason != 'ONBOARDING')
  const passwordResetHistory = await prisma.passwordReset.findMany({
    where: { employeeId },
    orderBy: { createdAt: 'desc' },
  });

  const userChangedPassword = passwordResetHistory.some((pr) => pr.reason !== 'ONBOARDING');

  return {
    employee: {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      joiningDate: employee.joiningDate,
      status: employee.status,
    },
    onboarding: {
      accountCreated: !!employee.user,
      passwordSet: userChangedPassword,
      profileComplete: !!employee.phone && !!employee.department,
      firstLoginCompleted: userChangedPassword,
      completedPercentage: this.calculateOnboardingPercentage(employee, userChangedPassword),
    },
    passwordHistory: passwordResetHistory.slice(0, 5), // Last 5 password changes
  };
};

/**
 * Calculate onboarding percentage completion
 */
const calculateOnboardingPercentage = (employee: any, passwordChanged: boolean): number => {
  let percentage = 0;

  if (employee.user) percentage += 25; // Account created
  if (passwordChanged) percentage += 25; // Password changed
  if (employee.phone && employee.department) percentage += 25; // Profile completed
  if (employee.status === 'ACTIVE') percentage += 25; // Activated

  return percentage;
};

/**
 * Send onboarding email (placeholder - implement with email service)
 */
export const sendOnboardingEmail = async (
  employeeId: number,
  tempPassword: string,
  loginUrl: string = 'https://localhost:5173/login'
) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Placeholder for email service
  // In production, integrate with SendGrid, AWS SES, etc.
  const emailContent = {
    to: employee.email,
    subject: `Welcome to Compliance Backend - Your Account is Ready`,
    body: `
Hello ${employee.firstName} ${employee.lastName},

Your account has been created successfully!

**Login Credentials:**
- Email: ${employee.email}
- Temporary Password: ${tempPassword}
- Login URL: ${loginUrl}

**Important:** This is a temporary password generated from your date of birth (DDMMYY format).
Please change it on your first login for security.

Welcome to the team!

Best regards,
Admin Team
    `,
  };

  console.log('Email would be sent:', emailContent);

  return {
    success: true,
    message: `Onboarding email queued for ${employee.email}`,
    email: emailContent.to,
  };
};

/**
 * Bulk onboard employees (CSV import)
 */
export const bulkOnboardEmployees = async (
  employees: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    department?: string;
    designation?: string;
    joiningDate: Date;
    dateOfBirth: Date;
    employeeCode: string;
  }>
) => {
  const results = {
    successful: [] as any[],
    failed: [] as Array<{ email: string; error: string }>,
  };

  for (const empData of employees) {
    try {
      const result = await onboardEmployee(empData);
      results.successful.push(result);
    } catch (error: any) {
      results.failed.push({
        email: empData.email,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Complete employee profile setup
 */
export const completeProfileSetup = async (
  employeeId: number,
  data: {
    phone?: string;
    profilePhotoUrl?: string;
    profilePhotoPublicId?: string;
  }
) => {
  const employee = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      phone: data.phone,
      profilePhotoUrl: data.profilePhotoUrl,
      profilePhotoPublicId: data.profilePhotoPublicId,
    },
  });

  await createAuditLog(
    `Employee profile updated`,
    `employee:${employeeId}`,
    'Employee',
    employeeId
  );

  return employee;
};

/**
 * Resend onboarding email
 */
export const resendOnboardingEmail = async (employeeId: number) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  if (!employee.dateOfBirth) {
    throw new Error('Employee does not have date of birth on file');
  }

  const tempPassword = generateDefaultPasswordFromDOB(employee.dateOfBirth);

  return await sendOnboardingEmail(employeeId, tempPassword);
};
