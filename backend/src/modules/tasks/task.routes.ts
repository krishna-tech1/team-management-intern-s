import { Router } from 'express';
import {
  getAllTasksController,
  getTaskByIdController,
  createTaskController,
  updateTaskController,
  deleteTaskController,
} from './task.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin } from '../../middleware/role.middleware';

const router = Router();

router.get(
  '/admin/tasks',
  authenticateToken,
  requireSuperAdmin,
  getAllTasksController
);

router.get(
  '/admin/tasks/:id',
  authenticateToken,
  requireSuperAdmin,
  getTaskByIdController
);

router.post(
  '/admin/tasks',
  authenticateToken,
  requireSuperAdmin,
  createTaskController
);

router.put(
  '/admin/tasks/:id',
  authenticateToken,
  requireSuperAdmin,
  updateTaskController
);

router.delete(
  '/admin/tasks/:id',
  authenticateToken,
  requireSuperAdmin,
  deleteTaskController
);

export default router;
