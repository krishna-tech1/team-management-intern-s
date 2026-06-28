import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { errorResponse } from '../utils/response.utils';

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

export const requireSuperAdmin = requireRole('SUPER_ADMIN');
export const requireManagerOrAbove = requireRole('SUPER_ADMIN', 'TEAM_MANAGER');
export const requireAnyRole = requireRole('SUPER_ADMIN', 'TEAM_MANAGER', 'EMPLOYEE');
export const requireTeamLead = requireRole('TEAM_LEAD');
export const requireTeamLeadOrAdmin = requireRole('SUPER_ADMIN', 'TEAM_LEAD');
export const requireEmployee = requireRole('EMPLOYEE');