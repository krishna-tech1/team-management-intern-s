import prisma from '../../config/prisma';
import { createAuditLog } from '../auditlogs/auditlog.service';

// Enable or disable login access for an employee
export const toggleEmployeeAccess = async (
  id: number,
  isActive: boolean,
  performedBy: string
) => {
  // Find employee
  const employee = await prisma.employee.findFirst({
    where: { id, isDeleted: false },
  });
  if (!employee) throw new Error('Employee not found');

  // Update employee isActive status
  const updatedEmployee = await prisma.employee.update({
    where: { id },
    data: { isActive },
  });

  // Update linked user isActive status if userId exists
  if (employee.userId) {
    await prisma.user.update({
      where: { id: employee.userId },
      data: { isActive },
    });
  }

  // Log action to AuditLog
  const statusString = isActive ? 'enabled' : 'disabled';
  await createAuditLog(
    `Employee login access ${statusString} for employee ${employee.firstName} ${employee.lastName}`,
    performedBy,
    'Employee',
    id
  );

  return updatedEmployee;
};
