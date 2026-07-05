import prisma from '../../config/prisma';
import { createAuditLog } from '../auditlogs/auditlog.service';

/**
 * Grant scope action to employee
 * Scope: OWN (own resources), TEAM (team resources), DEPARTMENT, ALL
 */
export const grantScopeAction = async (
  employeeId: number,
  actionType: string, // CREATE, READ, UPDATE, DELETE, APPROVE, ASSIGN, etc.
  resource: string, // Task, Document, Employee, Attendance, etc.
  scope: string, // OWN, TEAM, DEPARTMENT, ALL
  grantedBy: string,
  expiresAt?: Date,
  resourceId: number = 0
) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  const scopeAction = await prisma.scopeAction.create({
    data: {
      employeeId,
      actionType: actionType as any,
      resource,
      resourceId,
      scope,
      grantedBy,
      expiresAt,
      isActive: true,
    },
  });

  // Create audit log
  await createAuditLog(
    `Granted ${actionType} action on ${resource} with scope: ${scope}`,
    grantedBy,
    'ScopeAction',
    scopeAction.id
  );

  return scopeAction;
};

/**
 * Revoke scope action
 */
export const revokeScopeAction = async (
  scopeActionId: number,
  revokedBy: string
) => {
  const action = await prisma.scopeAction.update({
    where: { id: scopeActionId },
    data: { isActive: false },
  });

  await createAuditLog(
    `Revoked action: ${action.actionType}`,
    revokedBy,
    'ScopeAction',
    scopeActionId
  );

  return action;
};

/**
 * Check if employee has permission for action
 */
export const hasPermission = async (
  employeeId: number,
  actionType: string,
  resource: string,
  resourceOwnerId?: number
): Promise<boolean> => {
  const scopeAction = await prisma.scopeAction.findFirst({
    where: {
      employeeId,
      actionType: actionType as any,
      resource,
      isActive: true,
      OR: [
        { expiresAt: null }, // No expiration
        { expiresAt: { gt: new Date() } }, // Not expired
      ],
    },
  });

  if (!scopeAction) {
    return false;
  }

  // Check scope
  if (scopeAction.scope === 'ALL') {
    return true;
  }

  if (scopeAction.scope === 'OWN') {
    return resourceOwnerId === employeeId;
  }

  if (scopeAction.scope === 'TEAM') {
    // Check if resource owner is in same team
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { teamLeadMemberships: true },
    });

    const resourceOwner = await prisma.employee.findUnique({
      where: { id: resourceOwnerId },
      include: { teamLeadMemberships: true },
    });

    if (!employee || !resourceOwner) return false;

    // Check if they share a team lead
    const employeeTeams = employee.teamLeadMemberships.map((tm) => tm.teamLeadId);
    const resourceTeams = resourceOwner.teamLeadMemberships.map((tm) => tm.teamLeadId);

    return employeeTeams.some((tid) => resourceTeams.includes(tid));
  }

  if (scopeAction.scope === 'DEPARTMENT') {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    const resourceOwner = await prisma.employee.findUnique({
      where: { id: resourceOwnerId },
    });

    return employee?.department === resourceOwner?.department;
  }

  return false;
};

/**
 * Get all active scope actions for employee
 */
export const getEmployeePermissions = async (employeeId: number) => {
  const actions = await prisma.scopeAction.findMany({
    where: {
      employeeId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    employeeId,
    permissions: actions.map((a) => ({
      resource: a.resource,
      actions: a.actionType,
      scope: a.scope,
      expiresAt: a.expiresAt,
    })),
    count: actions.length,
  };
};

/**
 * Bulk grant permissions
 */
export const bulkGrantPermissions = async (
  employeeIds: number[],
  actionType: string,
  resource: string,
  scope: string,
  grantedBy: string
) => {
  const results = {
    successful: [] as any[],
    failed: [] as Array<{ employeeId: number; error: string }>,
  };

  for (const empId of employeeIds) {
    try {
      const permission = await grantScopeAction(
        empId,
        actionType,
        resource,
        scope,
        grantedBy
      );
      results.successful.push(permission);
    } catch (error: any) {
      results.failed.push({
        employeeId: empId,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Auto-expire expired permissions
 */
export const cleanupExpiredPermissions = async () => {
  const result = await prisma.scopeAction.updateMany({
    where: {
      isActive: true,
      expiresAt: { lt: new Date() },
    },
    data: { isActive: false },
  });

  return {
    expiredCount: result.count,
    cleanedAt: new Date(),
  };
};
