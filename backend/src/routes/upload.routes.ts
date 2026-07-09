import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { singleUpload } from '../middleware/upload.middleware';
import { uploadImage, deleteImage } from '../services/cloudinary.service';
import { successResponse, errorResponse } from '../utils/response.utils';
import path from 'path';
import prisma from '../config/prisma';

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

      // Save ownership metadata immediately in Document database model
      const employeeId = (req as any).employee?.id || null;
      const docType = type.includes('mca') ? 'MCA' : (type.includes('gst') ? 'GST' : 'OTHER');

      await prisma.document.create({
        data: {
          fileName: req.file.originalname,
          filePath: uploadResult.secure_url,
          fileUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          documentType: docType,
          employeeId: employeeId,
          uploadedById: employeeId,
          uploadedBy: req.user?.email || null,
          fileSize: req.file.size,
        },
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

    const userRole = req.user?.role;
    const userEmail = req.user?.email;
    const userIdVal = parseInt(req.user?.id || '0');

    // 1. If SUPER_ADMIN, allow deletion unconditionally
    if (userRole !== 'SUPER_ADMIN') {
      // 2. Fetch the document using publicId
      const doc = await prisma.document.findFirst({
        where: { publicId },
      });

      let authorized = false;

      if (doc) {
        // If it's a Document record
        if (userRole === 'EMPLOYEE') {
          // Employee can delete if they uploaded it
          const employee = await prisma.employee.findFirst({
            where: { userId: userIdVal, isDeleted: false },
          });
          if (employee && doc.employeeId === employee.id) {
            authorized = true;
          }
        } else if (userRole === 'TEAM_LEAD') {
          // Team Lead can delete if they uploaded it, OR if they are the Team Lead of the owner
          const teamLead = await prisma.teamLead.findFirst({
            where: { userId: userIdVal },
          });
          if (teamLead) {
            if (doc.uploadedBy === userEmail) {
              authorized = true;
            } else if (doc.employeeId) {
              const membership = await prisma.teamLeadEmployee.findFirst({
                where: {
                  teamLeadId: teamLead.id,
                  employeeId: doc.employeeId,
                },
              });
              if (membership) {
                authorized = true;
              }
            }
          }
        }
      } else {
        // If no Document record was found, it might be a profile photo stored on Employee or TeamLead.
        // Let's check if this publicId is the profile photo of the logged in user:
        if (userRole === 'EMPLOYEE') {
          const employee = await prisma.employee.findFirst({
            where: { userId: userIdVal, profilePhotoPublicId: publicId, isDeleted: false },
          });
          if (employee) {
            authorized = true;
          }
        } else if (userRole === 'TEAM_LEAD') {
          const teamLead = await prisma.teamLead.findFirst({
            where: { userId: userIdVal, profilePhotoPublicId: publicId },
          });
          if (teamLead) {
            authorized = true;
          }
        }
      }

      if (!authorized) {
        return errorResponse(res, 'Access denied. You do not own this resource.', 403);
      }
    }

    const resourceType = isImage ? 'image' : 'auto';
    await deleteImage(publicId, { resourceType });

    // Delete the document record from DB if it exists
    await prisma.document.deleteMany({
      where: { publicId },
    });

    return successResponse(res, null, 'File deleted from Cloudinary successfully');
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
});

export default router;
