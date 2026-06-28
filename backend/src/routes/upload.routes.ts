import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { singleUpload } from '../middleware/upload.middleware';
import { uploadImage, deleteImage } from '../services/cloudinary.service';
import { successResponse, errorResponse } from '../utils/response.utils';
import path from 'path';

const router = Router();

const FOLDER_MAP: Record<string, string> = {
  'employees/profile': 'gst-mca/employees/profile',
  'employees/documents': 'gst-mca/employees/documents',
  'admins/profile': 'gst-mca/admins/profile',
  'teamleaders/profile': 'gst-mca/teamleaders/profile',
  'attendance/selfies': 'gst-mca/attendance/selfies',
  'tasks/attachments': 'gst-mca/tasks/attachments',
  'leave/proofs': 'gst-mca/leave/proofs',
  'company/logo': 'gst-mca/company/logo',
};

const allowedDocAndImageTypes = [
  '.jpg', '.jpeg', '.png', '.webp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx'
];

/**
 * POST /api/upload
 * Query parameters:
 *  - type: 'employees/profile' | 'employees/documents' | 'admins/profile' | 'teamleaders/profile' | 'attendance/selfies' | 'tasks/attachments' | 'leave/proofs' | 'company/logo'
 */
router.post(
  '/upload',
  authenticateToken,
  singleUpload('file', allowedDocAndImageTypes, 10 * 1024 * 1024), // 10MB limit
  async (req: AuthRequest, res: Response) => {
    try {
      const type = (req.query.type as string) || 'employees/documents';
      const folder = FOLDER_MAP[type];

      if (!folder) {
        return errorResponse(res, `Invalid upload type. Allowed: ${Object.keys(FOLDER_MAP).join(', ')}`, 400);
      }

      if (!req.file) {
        return errorResponse(res, 'No file was uploaded.', 400);
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      const resourceType = isImage ? 'image' : 'auto';

      const uploadResult = await uploadImage(req.file.buffer, folder, {
        resourceType,
      });

      return successResponse(
        res,
        {
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          fileName: req.file.originalname,
          fileType: isImage ? 'photo' : 'document',
        },
        'File uploaded successfully'
      );
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }
);

/**
 * DELETE /api/upload
 * Body: { publicId: string, isImage: boolean }
 */
router.delete('/upload', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { publicId, isImage } = req.body;
    if (!publicId) {
      return errorResponse(res, 'publicId is required in body', 400);
    }

    const resourceType = isImage ? 'image' : 'auto';
    await deleteImage(publicId, { resourceType });

    return successResponse(res, null, 'File deleted from Cloudinary successfully');
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
});

export default router;
