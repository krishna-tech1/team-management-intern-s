import { Request, Response } from 'express';
import { login } from './auth.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, 'Email and password are required', 400);
  }

  try {
    const result = await login(email, password);
    return successResponse(res, result, 'Login successful');
  } catch (err: any) {
    return errorResponse(res, err.message, 401);
  }
};

export const logoutController = (_req: Request, res: Response) => {
  return successResponse(res, null, 'Logged out successfully');
};