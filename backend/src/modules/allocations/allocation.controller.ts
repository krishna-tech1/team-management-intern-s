import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  allocateClient,
  getAllAllocations,
  updateAllocation,
} from './allocation.service';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from '../../utils/response.utils';

export const allocateClientController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const allocatedBy = req.user?.email || 'System';
    const allocation = await allocateClient(req.body, allocatedBy);
    return successResponse(
      res,
      allocation,
      'Client allocated successfully',
      201
    );
  } catch (err: any) {
    return errorResponse(
      res,
      err.message,
      err.message === 'Client not found' || err.message === 'Employee not found'
        ? 400
        : 500
    );
  }
};

export const getAllAllocationsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getAllAllocations(page, limit);
    return paginatedResponse(
      res,
      result.allocations,
      result.total,
      result.page,
      result.limit
    );
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const updateAllocationController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const allocatedBy = req.user?.email || 'System';
    const allocation = await updateAllocation(id, req.body, allocatedBy);
    return successResponse(res, allocation, 'Allocation updated successfully');
  } catch (err: any) {
    return errorResponse(
      res,
      err.message,
      err.message === 'Allocation not found'
        ? 404
        : err.message === 'Client not found' || err.message === 'Employee not found'
        ? 400
        : 500
    );
  }
};
