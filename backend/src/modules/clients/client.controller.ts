import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from './client.service';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from '../../utils/response.utils';

export const getAllClientsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const result = await getAllClients(page, limit, status, search);
    return paginatedResponse(
      res,
      result.clients,
      result.total,
      result.page,
      result.limit
    );
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const getClientByIdController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const client = await getClientById(id);
    return successResponse(res, client, 'Client fetched successfully');
  } catch (err: any) {
    return errorResponse(
      res,
      err.message,
      err.message === 'Client not found' ? 404 : 500
    );
  }
};

export const createClientController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const performedBy = req.user?.email || 'System';
    const client = await createClient(req.body, performedBy);
    return successResponse(res, client, 'Client created successfully', 201);
  } catch (err: any) {
    const isConflict =
      err.message === 'Client email already exists' ||
      err.message === 'GST number already exists' ||
      err.message === 'PAN number already exists';
    const isBadRequest = err.message.includes('Invalid status');
    return errorResponse(
      res,
      err.message,
      isConflict ? 409 : isBadRequest ? 400 : 500
    );
  }
};

export const updateClientController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const performedBy = req.user?.email || 'System';
    const client = await updateClient(id, req.body, performedBy);
    return successResponse(res, client, 'Client updated successfully');
  } catch (err: any) {
    const isConflict =
      err.message === 'Client email already exists' ||
      err.message === 'GST number already exists' ||
      err.message === 'PAN number already exists';
    const isBadRequest = err.message.includes('Invalid status');
    return errorResponse(
      res,
      err.message,
      err.message === 'Client not found'
        ? 404
        : isConflict
        ? 409
        : isBadRequest
        ? 400
        : 500
    );
  }
};

export const deleteClientController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const performedBy = req.user?.email || 'System';
    const result = await deleteClient(id, performedBy);
    return successResponse(res, result, 'Client deleted successfully');
  } catch (err: any) {
    return errorResponse(
      res,
      err.message,
      err.message === 'Client not found' ? 404 : 500
    );
  }
};

