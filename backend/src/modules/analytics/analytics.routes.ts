import { Router } from 'express';
import { getAnalyticsController } from './analytics.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireTeamLeadOrAdmin } from '../../middleware/role.middleware';

const router = Router();

router.get(
  '/admin/analytics',
  authenticateToken,
  requireTeamLeadOrAdmin,
  getAnalyticsController
);

export default router;
