import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from './task.service';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from '../../utils/response.utils';

export const getAllTasksController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
    const assignedEmployeeId = req.query.assignedEmployeeId ? parseInt(req.query.assignedEmployeeId as string) : undefined;

    const result = await getAllTasks(
      page,
      limit,
      status,
      priority,
      clientId,
      assignedEmployeeId
    );
    return paginatedResponse(
      res,
      result.tasks,
      result.total,
      result.page,
      result.limit
    );
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const getTaskByIdController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const task = await getTaskById(id);
    return successResponse(res, task, 'Task fetched successfully');
  } catch (err: any) {
    return errorResponse(
      res,
      err.message,
      err.message === 'Task not found' ? 404 : 500
    );
  }
};

export const createTaskController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const performedBy = req.user?.email || 'System';
    const task = await createTask(req.body, performedBy);
    return successResponse(res, task, 'Task created successfully', 201);
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

export const updateTaskController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const performedBy = req.user?.email || 'System';
    const task = await updateTask(id, req.body, performedBy);
    return successResponse(res, task, 'Task updated successfully');
  } catch (err: any) {
    return errorResponse(
      res,
      err.message,
      err.message === 'Task not found'
        ? 404
        : err.message === 'Client not found' || err.message === 'Employee not found'
        ? 400
        : 500
    );
  }
};

export const deleteTaskController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const performedBy = req.user?.email || 'System';
    const result = await deleteTask(id, performedBy);
    return successResponse(res, result, 'Task deleted successfully');
  } catch (err: any) {
    return errorResponse(
      res,
      err.message,
      err.message === 'Task not found' ? 404 : 500
    );
  }
};
