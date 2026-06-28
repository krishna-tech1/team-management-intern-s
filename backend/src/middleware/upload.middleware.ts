import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.utils';
import path from 'path';

const defaultAllowedTypes = ['.jpg', '.jpeg', '.png', '.webp'];
const defaultDocTypes = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];

/**
 * Middleware for single file uploads.
 */
export const singleUpload = (
  fieldName: string,
  allowedExtensions = defaultAllowedTypes,
  maxSize = 5 * 1024 * 1024 // 5 MB
) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
      }
      cb(null, true);
    },
  }).single(fieldName);

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return errorResponse(res, `File exceeds size limit of ${maxSize / (1024 * 1024)}MB.`, 400);
          }
          return errorResponse(res, `Upload error: ${err.message}`, 400);
        }
        return errorResponse(res, err.message, 400);
      }
      next();
    });
  };
};

/**
 * Middleware for fields (multiple fields/files) uploads.
 */
export const fieldsUpload = (
  fields: multer.Field[],
  allowedExtensions = defaultDocTypes,
  maxSize = 10 * 1024 * 1024 // 10 MB
) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return cb(new Error(`Invalid file type for field ${file.fieldname}. Allowed: ${allowedExtensions.join(', ')}`));
      }
      cb(null, true);
    },
  }).fields(fields);

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return errorResponse(res, `File exceeds size limit of ${maxSize / (1024 * 1024)}MB.`, 400);
          }
          return errorResponse(res, `Upload error: ${err.message}`, 400);
        }
        return errorResponse(res, err.message, 400);
      }
      next();
    });
  };
};
