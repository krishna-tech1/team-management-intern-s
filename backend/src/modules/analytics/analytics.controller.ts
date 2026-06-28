import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getAnalyticsStats } from './analytics.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

export const getAnalyticsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const stats = await getAnalyticsStats();
    return successResponse(res, stats, 'Analytics stats fetched successfully');
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};
