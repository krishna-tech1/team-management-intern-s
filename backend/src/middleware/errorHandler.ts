import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const message = error instanceof Error ? error.message : 'Internal Server Error';
  const statusCode = error instanceof Error && (error as any).statusCode ? (error as any).statusCode : 500;

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
    },
  });
}
