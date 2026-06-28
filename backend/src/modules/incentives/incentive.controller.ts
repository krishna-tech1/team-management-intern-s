import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { createIncentive, getAllIncentives } from './incentive.service';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from '../../utils/response.utils';

export const createIncentiveController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const performedBy = req.user?.email || 'System';
    const incentive = await createIncentive(req.body, performedBy);
    return successResponse(
      res,
      incentive,
      'Incentive created successfully',
      201
    );
  } catch (err: any) {
    return errorResponse(
      res,
      err.message,
      err.message === 'Employee not found' ||
        err.message === 'Incentive amount must be positive' ||
        err.message === 'Invalid month format. Please use YYYY-MM (e.g., 2026-06)'
        ? 400
        : 500
    );
  }
};

export const getAllIncentivesController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
    const month = req.query.month as string;

    const result = await getAllIncentives(page, limit, employeeId, month);
    return paginatedResponse(
      res,
      result.incentives,
      result.total,
      result.page,
      result.limit
    );
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};
