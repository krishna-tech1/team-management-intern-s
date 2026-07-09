import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { errorResponse } from '../utils/response.utils';
import { ROLES } from '../constants/roles';

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Access denied. Insufficient permissions.', 403);
    }
    next();
  };
};

export const requireSuperAdmin = requireRole(ROLES.SUPER_ADMIN);
export const requireTeamLead = requireRole(ROLES.TEAM_LEAD);
export const requireTeamLeadOrAdmin = requireRole(ROLES.SUPER_ADMIN, ROLES.TEAM_LEAD);
export const requireEmployee = requireRole(ROLES.EMPLOYEE);

// Kept for backward compatibility but mapped to correct Prisma role enums
export const requireManagerOrAbove = requireRole(ROLES.SUPER_ADMIN, ROLES.TEAM_LEAD);
export const requireAnyRole = requireRole(ROLES.SUPER_ADMIN, ROLES.TEAM_LEAD, ROLES.EMPLOYEE);