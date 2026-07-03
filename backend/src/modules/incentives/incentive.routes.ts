import { Router } from 'express';
import {
  createIncentiveController,
  getAllIncentivesController,
  getIncentiveFreezeController,
  setIncentiveFreezeController,
  updateIncentiveController,
} from './incentive.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin, requireTeamLeadOrAdmin } from '../../middleware/role.middleware';

const router = Router();

router.get(
  '/admin/incentives',
  authenticateToken,
  requireTeamLeadOrAdmin,
  getAllIncentivesController
);

router.post(
  '/admin/incentives',
  authenticateToken,
  requireSuperAdmin,
  createIncentiveController
);

router.put(
  '/admin/incentives/:id',
  authenticateToken,
  requireSuperAdmin,
  updateIncentiveController
);

router.get(
  '/admin/incentives/freeze',
  authenticateToken,
  requireTeamLeadOrAdmin,
  getIncentiveFreezeController
);

router.post(
  '/admin/incentives/freeze',
  authenticateToken,
  requireSuperAdmin,
  setIncentiveFreezeController
);

export default router;
