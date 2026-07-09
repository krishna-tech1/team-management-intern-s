import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';
import { errorResponse } from '../utils/response.utils';
import prisma from '../config/prisma';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string; mustChangePassword?: boolean };
  userId?: number;
  employee?: any;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return errorResponse(res, 'No token provided', 401);
  }

  try {
    const decoded = verifyToken(token);
    req.user = { 
      id: decoded.id, 
      role: decoded.role, 
      email: decoded.email, 
      mustChangePassword: !!decoded.mustChangePassword 
    };
    (req as any).userId = parseInt(decoded.id);

    // Populate employee record dynamically if it exists
    const employee = await prisma.employee.findFirst({
      where: { userId: parseInt(decoded.id), isDeleted: false }
    });
    if (employee) {
      (req as any).employee = employee;
    }

    // Force password change on first login check
    const isAllowedPath = req.path.endsWith('/password/change') || req.path.endsWith('/auth/logout');
    if (req.user.mustChangePassword && !isAllowedPath) {
      return res.status(403).json({
        success: false,
        message: 'Password change required on first login',
        code: 'PASSWORD_CHANGE_REQUIRED'
      });
    }

    next();
  } catch {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
};