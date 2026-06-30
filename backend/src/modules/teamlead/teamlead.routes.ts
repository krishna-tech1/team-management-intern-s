import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireTeamLead } from '../../middleware/role.middleware';
import {
  dashboardController,
  getEmployeesController,
  getEmployeeByIdController,
  updateEmployeeController,
  getClientsController,
  getClientByIdController,
  getTasksController,
  createTaskController,
  updateTaskController,
  deleteTaskController,
  assignTaskController,
  trackingController,
  analyticsController,
  getIncentivesController,
  calculateIncentivesController,
  updateIncentiveController,
  getNotificationsController,
  createNotificationController,
  markReadController,
  getLeavesController,
  getLeaveByIdController,
  approveLeaveController,
  rejectLeaveController,
  attendanceController,
} from './teamlead.controller';

const router = Router();
const tl = [authenticateToken, requireTeamLead]; // shorthand middleware chain

// Dashboard
router.get('/teamlead/dashboard', ...tl, dashboardController);

// Employees
router.get('/teamlead/employees', ...tl, getEmployeesController);
router.get('/teamlead/employees/:id', ...tl, getEmployeeByIdController);
router.put('/teamlead/employees/:id', ...tl, updateEmployeeController);

// Clients
router.get('/teamlead/clients', ...tl, getClientsController);
router.get('/teamlead/clients/:id', ...tl, getClientByIdController);

// Tasks
router.get('/teamlead/tasks', ...tl, getTasksController);
router.post('/teamlead/tasks', ...tl, createTaskController);
router.put('/teamlead/tasks/:id', ...tl, updateTaskController);
router.delete('/teamlead/tasks/:id', ...tl, deleteTaskController);
router.post('/teamlead/tasks/:id/assign', ...tl, assignTaskController);

// Employee Tracking
router.get('/teamlead/tracking', ...tl, trackingController);

// Analytics
router.get('/teamlead/analytics', ...tl, analyticsController);

// Incentives
router.get('/teamlead/incentives', ...tl, getIncentivesController);
router.post('/teamlead/incentives/calculate', ...tl, calculateIncentivesController);
router.put('/teamlead/incentives/:id', ...tl, updateIncentiveController);

// Notifications
router.get('/teamlead/notifications', ...tl, getNotificationsController);
router.post('/teamlead/notifications', ...tl, createNotificationController);
router.patch('/teamlead/notifications/:id/read', ...tl, markReadController);

// Leaves
router.get('/teamlead/leaves', ...tl, getLeavesController);
router.get('/teamlead/leaves/:id', ...tl, getLeaveByIdController);
router.put('/teamlead/leaves/:id/approve', ...tl, approveLeaveController);
router.put('/teamlead/leaves/:id/reject', ...tl, rejectLeaveController);

// Attendance
router.get('/teamlead/attendance', ...tl, attendanceController);

export default router;
