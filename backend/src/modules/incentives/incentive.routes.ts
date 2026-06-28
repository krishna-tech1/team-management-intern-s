import { Router } from 'express';
import {
  createIncentiveController,
  getAllIncentivesController,
} from './incentive.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin } from '../../middleware/role.middleware';

const router = Router();

router.get(
  '/admin/incentives',
  authenticateToken,
  requireSuperAdmin,
  getAllIncentivesController
);

router.post(
  '/admin/incentives',
  authenticateToken,
  requireSuperAdmin,
  createIncentiveController
);

export default router;
