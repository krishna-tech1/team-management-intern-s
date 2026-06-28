import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { toggleEmployeeAccess } from './employeeAccess.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

export const toggleEmployeeAccessController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return errorResponse(res, 'isActive must be a boolean value', 400);
    }

    const performedBy = req.user?.email || 'System';
    const employee = await toggleEmployeeAccess(id, isActive, performedBy);

    const statusString = isActive ? 'enabled' : 'disabled';
    return successResponse(
      res,
      employee,
      `Employee login access ${statusString} successfully`
    );
  } catch (err: any) {
    return errorResponse(
      res,
      err.message,
      err.message === 'Employee not found' ? 404 : 500
    );
  }
};
