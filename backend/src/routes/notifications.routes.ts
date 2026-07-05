import { Router } from 'express';
import prisma from '../config/prisma';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireTeamLeadOrAdmin } from '../middleware/role.middleware';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.utils';

const router = Router();

router.get('/admin/notifications', authenticateToken, requireTeamLeadOrAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.notification.count(),
    ]);
    return paginatedResponse(res, notifications, total, page, limit);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
});

router.post('/admin/notifications', authenticateToken, requireTeamLeadOrAdmin, async (req, res) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        title: req.body.title || 'Notification',
        message: req.body.message || '',
        type: req.body.type || 'ANNOUNCEMENT',
        employeeId: req.body.employeeId || null,
        createdBy: (req as any).user?.email || 'System',
        isTeamLead: true,
      },
    });
    return successResponse(res, notification, 'Notification created successfully', 201);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
});

export default router;
