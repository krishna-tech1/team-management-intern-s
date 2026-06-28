import { Router } from 'express';
import {
  allocateClientController,
  getAllAllocationsController,
  updateAllocationController,
} from './allocation.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin } from '../../middleware/role.middleware';

const router = Router();

router.post(
  '/admin/allocate-client',
  authenticateToken,
  requireSuperAdmin,
  allocateClientController
);

router.get(
  '/admin/allocations',
  authenticateToken,
  requireSuperAdmin,
  getAllAllocationsController
);

router.put(
  '/admin/allocations/:id',
  authenticateToken,
  requireSuperAdmin,
  updateAllocationController
);

export default router;
