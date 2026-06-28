import { Request, Response } from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from './employee.service';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from '../../utils/response.utils';

export const getAllEmployeesController = async (
  req: Request,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const department = req.query.department as string;

    const result = await getAllEmployees(page, limit, status, department);
    return paginatedResponse(
      res,
      result.employees,
      result.total,
      result.page,
      result.limit
    );
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const getEmployeeByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const employee = await getEmployeeById(id);
    return successResponse(res, employee, 'Employee fetched');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message === 'Employee not found' ? 404 : 500);
  }
};

export const createEmployeeController = async (
  req: Request,
  res: Response
) => {
  try {
    const employee = await createEmployee(req.body);
    return successResponse(res, employee, 'Employee created successfully', 201);
  } catch (err: any) {
    return errorResponse(res, err.message, err.message === 'Email already exists' ? 409 : 500);
  }
};

export const updateEmployeeController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const employee = await updateEmployee(id, req.body);
    return successResponse(res, employee, 'Employee updated successfully');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message === 'Employee not found' ? 404 : 500);
  }
};

export const deleteEmployeeController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const result = await deleteEmployee(id);
    return successResponse(res, result, 'Employee deactivated successfully');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message === 'Employee not found' ? 404 : 500);
  }
};