import { Router } from 'express';
import {
  createIncentiveController,
  getAllIncentivesController,
  getIncentiveFreezeController,
  setIncentiveFreezeController,
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

router.get(
  '/admin/incentives/freeze',
  authenticateToken,
  requireSuperAdmin,
  getIncentiveFreezeController
);

router.post(
  '/admin/incentives/freeze',
  authenticateToken,
  requireSuperAdmin,
  setIncentiveFreezeController
);

export default router;
