import { UserRole } from '@prisma/client';

export const ROLES = {
  SUPER_ADMIN: UserRole.SUPER_ADMIN,
  TEAM_LEAD: UserRole.TEAM_LEAD,
  EMPLOYEE: UserRole.EMPLOYEE,
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];
