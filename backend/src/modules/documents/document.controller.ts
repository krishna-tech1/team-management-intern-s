import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  createDocument,
  getAllDocuments,
  deleteDocument,
} from './document.service';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from '../../utils/response.utils';

export const createDocumentController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const uploadedBy = req.user?.email || 'System';
    const document = await createDocument(req.body, uploadedBy);
    return successResponse(
      res,
      document,
      'Document uploaded successfully',
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

export const getAllDocumentsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;

    const result = await getAllDocuments(page, limit, clientId, employeeId);
    return paginatedResponse(
      res,
      result.documents,
      result.total,
      result.page,
      result.limit
    );
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const deleteDocumentController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const performedBy = req.user?.email || 'System';
    const result = await deleteDocument(id, performedBy);
    return successResponse(res, result, 'Document deleted successfully');
  } catch (err: any) {
    return errorResponse(
      res,
      err.message,
      err.message === 'Document not found' ? 404 : 500
    );
  }
};
