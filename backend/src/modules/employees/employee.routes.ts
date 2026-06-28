import { Router } from 'express';
import {
  getAllEmployeesController,
  getEmployeeByIdController,
  createEmployeeController,
  updateEmployeeController,
  deleteEmployeeController,
} from './employee.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin } from '../../middleware/role.middleware';

const router = Router();

router.get(
  '/admin/employees',
  authenticateToken,
  requireSuperAdmin,
  getAllEmployeesController
);

router.get(
  '/admin/employees/:id',
  authenticateToken,
  requireSuperAdmin,
  getEmployeeByIdController
);

router.post(
  '/admin/employees',
  authenticateToken,
  requireSuperAdmin,
  createEmployeeController
);

router.put(
  '/admin/employees/:id',
  authenticateToken,
  requireSuperAdmin,
  updateEmployeeController
);

router.delete(
  '/admin/employees/:id',
  authenticateToken,
  requireSuperAdmin,
  deleteEmployeeController
);

export default router;