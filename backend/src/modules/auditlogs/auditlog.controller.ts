import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getAllAuditLogs } from './auditlog.service';
import { paginatedResponse, errorResponse } from '../../utils/response.utils';

export const getAllAuditLogsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const performedBy = req.query.performedBy as string;
    const entity = req.query.entity as string;

    const result = await getAllAuditLogs(page, limit, performedBy, entity);
    return paginatedResponse(
      res,
      result.logs,
      result.total,
      result.page,
      result.limit
    );
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};
