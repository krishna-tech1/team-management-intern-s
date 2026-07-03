import { Router } from 'express';
import {
  getAllTasksController,
  getTaskByIdController,
  createTaskController,
  updateTaskController,
  deleteTaskController,
  getCompletedTasksController,
} from './task.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin, requireTeamLeadOrAdmin } from '../../middleware/role.middleware';

const router = Router();

router.get(
  '/admin/tasks',
  authenticateToken,
  requireTeamLeadOrAdmin,
  getAllTasksController
);

router.get(
  '/admin/tasks/completed',
  authenticateToken,
  requireTeamLeadOrAdmin,
  getCompletedTasksController
);

router.get(
  '/admin/tasks/:id',
  authenticateToken,
  requireTeamLeadOrAdmin,
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
