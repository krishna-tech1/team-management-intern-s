import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.utils';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Error:', err);

  if (err.code === 'P2002') {
    return errorResponse(res, 'A record with this value already exists', 409);
  }
  if (err.code === 'P2025') {
    return errorResponse(res, 'Record not found', 404);
  }

  return errorResponse(
    res,
    err.message || 'Internal server error',
    err.statusCode || 500
  );
};