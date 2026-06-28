import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';
import { errorResponse } from '../utils/response.utils';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string };
}

export const authenticateToken = (
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
    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    next();
  } catch {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
};