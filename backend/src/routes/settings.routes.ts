import { Router } from 'express';
import prisma from '../config/prisma';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/role.middleware';
import { successResponse, errorResponse } from '../utils/response.utils';

const router = Router();

router.get('/admin/settings', authenticateToken, requireSuperAdmin, async (_req, res) => {
  try {
    const settings = await prisma.incentiveFreeze.findMany({ orderBy: { month: 'desc' } });
    return successResponse(res, { settings }, 'Settings fetched successfully');
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
});

export default router;
