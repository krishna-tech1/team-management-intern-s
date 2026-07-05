import { Request, Response } from 'express';
import { getDashboardStats } from './dashboard.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

export const dashboardStatsController = async (
  _req: Request,
  res: Response
) => {
  try {
    const stats = await getDashboardStats();
    return successResponse(res, stats, 'Dashboard stats fetched');
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};