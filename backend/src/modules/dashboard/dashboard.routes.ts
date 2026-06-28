import { Router } from 'express';
import { dashboardStatsController } from './dashboard.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin } from '../../middleware/role.middleware';

const router = Router();

router.get(
  '/admin/dashboard',
  authenticateToken,
  requireSuperAdmin,
  dashboardStatsController
);

export default router;