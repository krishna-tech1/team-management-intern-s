import { Router } from 'express';
import { getAnalyticsController } from './analytics.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin } from '../../middleware/role.middleware';

const router = Router();

router.get(
  '/admin/analytics',
  authenticateToken,
  requireSuperAdmin,
  getAnalyticsController
);

export default router;
