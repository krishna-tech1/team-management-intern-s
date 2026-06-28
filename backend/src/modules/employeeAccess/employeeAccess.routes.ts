import { Router } from 'express';
import { toggleEmployeeAccessController } from './employeeAccess.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin } from '../../middleware/role.middleware';

const router = Router();

router.put(
  '/admin/employees/:id/access',
  authenticateToken,
  requireSuperAdmin,
  toggleEmployeeAccessController
);

export default router;
