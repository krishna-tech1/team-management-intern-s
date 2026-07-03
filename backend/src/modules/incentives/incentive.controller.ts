import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { createIncentive, getAllIncentives, getIncentiveFreeze, setIncentiveFreeze, updateIncentive } from './incentive.service';
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

export const getIncentiveFreezeController = async (req: AuthRequest, res: Response) => {
  try {
    const month = req.query.month as string;
    if (!month) return errorResponse(res, 'month query parameter is required (format: YYYY-MM)', 400);
    const data = await getIncentiveFreeze(month);
    return successResponse(res, data, 'Incentive freeze status fetched successfully');
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const setIncentiveFreezeController = async (req: AuthRequest, res: Response) => {
  try {
    const { month, isFrozen } = req.body;
    if (!month) return errorResponse(res, 'month is required (format: YYYY-MM)', 400);
    if (isFrozen === undefined) return errorResponse(res, 'isFrozen is required', 400);
    
    const performedBy = req.user?.email || 'System';
    const data = await setIncentiveFreeze(month, isFrozen, performedBy);
    return successResponse(res, data, `Incentive records for ${month} updated successfully`);
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('Invalid') ? 400 : 500);
  }
};

export const updateIncentiveController = async (req: AuthRequest, res: Response) => {
  try {
    const incentiveId = parseInt(req.params.id);
    const performedBy = req.user?.email || 'System';
    const data = await updateIncentive(incentiveId, req.body, performedBy);
    return successResponse(res, data, 'Incentive updated successfully');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message === 'Incentive not found' ? 404 : 400);
  }
};
