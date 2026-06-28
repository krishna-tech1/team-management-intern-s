import { Response } from 'express';

export const successResponse = (
  res: Response,
  data: any,
  message = 'Success',
  statusCode = 200
) => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 400,
  code?: string
) => {
  return res.status(statusCode).json({
    success: false,
    error: { message, code },
  });
};

export const paginatedResponse = (
  res: Response,
  data: any[],
  total: number,
  page: number,
  limit: number
) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};