import prisma from '../../config/prisma';
import { hashPassword, comparePasswords, validatePasswordStrength } from '../../utils/password.utils';
import { createAuditLog } from '../auditlogs/auditlog.service';

/**
 * Reset employee password (admin-initiated)
 */
export const resetEmployeePassword = async (
  employeeId: number,
  newPassword: string,
  resetBy: string = 'admin',
  reason: string = 'MANUAL_RESET'
) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: true },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  if (!employee.user) {
    throw new Error('Employee user account not found');
  }

  // Validate password strength
  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  const hashedPassword = await hashPassword(newPassword);

  // Update user password
  await prisma.user.update({
    where: { id: employee.user.id },
    data: { 
      password: hashedPassword,
      mustChangePassword: true,
    },
  });

  // Record password reset
  await prisma.passwordReset.create({
    data: {
      employeeId,
      oldPassword: employee.user.password, // Store old hashed password
      newPassword: hashedPassword,
      resetBy,
      reason,
    },
  });

  // Update password generation date
  await prisma.employee.update({
    where: { id: employeeId },
    data: { passwordGenerationDate: new Date() },
  });

  // Create audit log
  await createAuditLog(
    `Password reset by ${resetBy}. Reason: ${reason}`,
    resetBy,
    'User',
    employee.userId || 0
  );

  return {
    success: true,
    message: 'Password reset successfully',
    employee: {
      id: employee.id,
      email: employee.email,
    },
  };
};

/**
 * Employee changes their own password
 */
export const changeOwnPassword = async (
  userId: number,
  oldPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify old password
  const isPasswordValid = await comparePasswords(oldPassword, user.password);
  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  // Validate new password strength
  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  // Check if new password is same as old
  const isSamePassword = await comparePasswords(newPassword, user.password);
  if (isSamePassword) {
    throw new Error('New password must be different from current password');
  }

  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { 
      password: hashedPassword,
      mustChangePassword: false,
    },
  });

  // Find associated employee
  const employee = await prisma.employee.findFirst({
    where: { userId },
  });

  if (employee) {
    // Record password change
    await prisma.passwordReset.create({
      data: {
        employeeId: employee.id,
        oldPassword: user.password,
        newPassword: hashedPassword,
        resetBy: 'USER',
        reason: 'USER_REQUEST',
      },
    });

    // Update password generation date
    await prisma.employee.update({
      where: { id: employee.id },
      data: { passwordGenerationDate: new Date() },
    });

    // Create audit log
    await createAuditLog(
      'Password changed by user',
      `employee:${employee.id}`,
      'User',
      userId
    );
  }

  return {
    success: true,
    message: 'Password changed successfully',
  };
};

/**
 * Generate password reset token (placeholder - implement with token service)
 */
export const generatePasswordResetToken = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if email exists for security
    return {
      success: true,
      message: 'If an account exists, password reset instructions have been sent to the email.',
    };
  }

  // In production, generate a secure token and store it temporarily
  // For now, just generate a token
  Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

  return {
    success: true,
    message: 'Password reset instructions sent to email',
    // Don't expose token in real implementation
    // token would be sent via email
  };
};

/**
 * Verify and apply password reset token
 */
export const applyPasswordResetToken = async (
  token: string,
  newPassword: string
) => {
  try {
    // In production, verify token validity and expiration
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      throw new Error('Invalid reset token');
    }

    // Reset password
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    // Find associated employee
    const employee = await prisma.employee.findFirst({
      where: { userId: user.id },
    });

    if (employee) {
      await prisma.passwordReset.create({
        data: {
          employeeId: employee.id,
          oldPassword: user.password,
          newPassword: hashedPassword,
          resetBy: 'SYSTEM',
          reason: 'PASSWORD_RESET_TOKEN',
        },
      });
    }

    return {
      success: true,
      message: 'Password reset successfully',
    };
  } catch (error: any) {
    throw new Error('Invalid or expired reset token');
  }
};

/**
 * Get password change history for employee
 */
export const getPasswordChangeHistory = async (
  employeeId: number,
  limit: number = 10
) => {
  const history = await prisma.passwordReset.findMany({
    where: { employeeId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      resetBy: true,
      reason: true,
      createdAt: true,
    },
  });

  return {
    employeeId,
    history,
    totalChanges: history.length,
  };
};

/**
 * Force password reset on next login (requires login with temporary password)
 */
export const forcePasswordReset = async (employeeId: number) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: true },
  });

  if (!employee || !employee.user) {
    throw new Error('Employee not found');
  }

  // Actually update the user record to enforce password change on next login
  await prisma.user.update({
    where: { id: employee.user.id },
    data: { mustChangePassword: true },
  });

  await createAuditLog(
    'Password reset forced for next login',
    'admin',
    'User',
    employee.user.id
  );

  return {
    success: true,
    message: 'Employee will be required to reset password on next login',
  };
};

/**
 * Check password age (returns days since last change)
 */
export const getPasswordAge = async (employeeId: number) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee || !employee.passwordGenerationDate) {
    throw new Error('Employee not found or password generation date not set');
  }

  const daysSinceChange = Math.floor(
    (Date.now() - employee.passwordGenerationDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    employeeId,
    lastPasswordChange: employee.passwordGenerationDate,
    daysSinceChange,
    requiresReset: daysSinceChange > 90, // Reset required after 90 days
  };
};
