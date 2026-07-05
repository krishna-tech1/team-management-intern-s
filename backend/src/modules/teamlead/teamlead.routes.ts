import { Router, Request, Response } from 'express';
import prisma from '../../config/prisma';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin, requireTeamLead, requireTeamLeadOrAdmin } from '../../middleware/role.middleware';

// Service imports for consolidated routes
import * as attendanceServiceModule from '../attendance/attendance.service';
import * as gpsServiceModule from '../gps/gps.service';
import * as taskAssignmentServiceModule from '../taskassignment/taskassignment.service';
import * as metricsServiceModule from '../metrics/metrics.service';
import * as scopeActionsServiceModule from '../scopeactions/scopeactions.service';
import * as deadlineServiceModule from '../upcomingdeadline/upcomingdeadline.service';
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
const admin = [authenticateToken, requireSuperAdmin];

// Admin team lead management
router.get('/admin/teamlead', ...admin, async (_req, res) => {
  try {
    const teamLeads = await prisma.teamLead.findMany({
      include: {
        user: { select: { email: true, role: true } },
        teamMembers: { include: { employee: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: teamLeads, message: 'Team leads fetched successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/admin/teamlead/assign', ...admin, async (req, res) => {
  try {
    const { employeeId, teamLeadId } = req.body;
    if (!employeeId || !teamLeadId) {
      return res.status(400).json({ success: false, error: { message: 'employeeId and teamLeadId are required' } });
    }

    const employee = await prisma.employee.findFirst({ where: { id: Number(employeeId), isDeleted: false } });
    if (!employee) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });

    const teamLead = await prisma.teamLead.findUnique({ where: { id: Number(teamLeadId) } });
    if (!teamLead) return res.status(404).json({ success: false, error: { message: 'Team lead not found' } });

    await prisma.teamLeadEmployee.upsert({
      where: {
        teamLeadId_employeeId: { teamLeadId: Number(teamLeadId), employeeId: Number(employeeId) },
      },
      create: { teamLeadId: Number(teamLeadId), employeeId: Number(employeeId) },
      update: {},
    });

    return res.status(201).json({ success: true, data: { employeeId, teamLeadId }, message: 'Team lead assigned successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.put('/admin/teamlead/:id', ...admin, async (req, res) => {
  try {
    const teamLeadId = Number(req.params.id);
    const teamLead = await prisma.teamLead.findUnique({ where: { id: teamLeadId } });
    if (!teamLead) return res.status(404).json({ success: false, error: { message: 'Team lead not found' } });

    const updated = await prisma.teamLead.update({
      where: { id: teamLeadId },
      data: {
        teamName: req.body.teamName || teamLead.teamName,
        department: req.body.department || teamLead.department,
      },
    });

    return res.status(200).json({ success: true, data: updated, message: 'Team lead updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/admin/teamlead/:id', ...admin, async (req, res) => {
  try {
    const teamLead = await prisma.teamLead.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        user: { select: { email: true, role: true } },
        teamMembers: { include: { employee: { select: { id: true, firstName: true, lastName: true, email: true, department: true } } } },
      },
    });
    if (!teamLead) return res.status(404).json({ success: false, error: { message: 'Team lead not found' } });
    return res.status(200).json({ success: true, data: teamLead, message: 'Team lead fetched successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

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

// ─── CONSOLIDATED ROUTES (from routes/teamlead.routes.ts) ───────────────────
// These were previously in src/routes/teamlead.routes.ts mounted at /teamlead prefix.
// Now consolidated here with full paths to preserve API compatibility.

// ─── ATTENDANCE (Employee self-service) ─────────────────────────────────────

router.post('/teamlead/attendance/check-in', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { latitude, longitude, accuracy, address, selfieUrl } = req.body;
    const result = await attendanceServiceModule.checkIn(userId, {
      latitude, longitude, accuracy, address, selfieUrl,
    });
    res.status(201).json({ success: true, message: 'Check-in successful', data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/teamlead/attendance/check-out', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { latitude, longitude, accuracy, address, selfieUrl } = req.body;
    const result = await attendanceServiceModule.checkOut(userId, {
      latitude, longitude, accuracy, address, selfieUrl,
    });
    res.status(200).json({ success: true, message: 'Check-out successful', data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/teamlead/attendance/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await attendanceServiceModule.getAttendanceHistory(userId, page, limit);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/teamlead/attendance/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const period = (req.query.period as 'WEEK' | 'MONTH') || 'WEEK';
    const result = await attendanceServiceModule.getAttendanceSummary(userId, period);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─── GPS ────────────────────────────────────────────────────────────────────

router.get('/teamlead/gps/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;
    const result = await gpsServiceModule.getCurrentLocation(employee.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/teamlead/gps/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const eventType = req.query.eventType as string;
    const result = await gpsServiceModule.getEmployeeGPSHistory(employee.id, page, limit, eventType);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/teamlead/gps/heatmap', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;
    const dateFrom = new Date(req.query.dateFrom as string);
    const dateTo = new Date(req.query.dateTo as string);
    const result = await gpsServiceModule.getGPSHeatmapData(employee.id, dateFrom, dateTo);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─── TASK ASSIGNMENT ────────────────────────────────────────────────────────

router.get('/teamlead/tasks/assigned', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await taskAssignmentServiceModule.getEmployeeAssignedTasks(employee.id, status, page, limit);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/teamlead/tasks/assign', authenticateToken, requireTeamLeadOrAdmin, async (req: Request, res: Response) => {
  try {
    const { taskId, employeeId } = req.body;
    const user = (req as any).user;
    const result = await taskAssignmentServiceModule.assignTask(taskId, employeeId, user.email);
    res.status(201).json({ success: true, message: 'Task assigned successfully', data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/teamlead/tasks/workload', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.query.employeeId as string);
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'employeeId query parameter is required' });
    }
    const result = await taskAssignmentServiceModule.getEmployeeWorkload(employeeId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/teamlead/tasks/overdue', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;
    const result = await taskAssignmentServiceModule.getOverdueTasks(employee.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─── LEADERBOARD & METRICS ─────────────────────────────────────────────────

router.get('/teamlead/metrics/leaderboard', authenticateToken, requireTeamLeadOrAdmin, async (req: Request, res: Response) => {
  try {
    const month = req.query.month as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await metricsServiceModule.getLeaderboard(month, limit);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/teamlead/metrics/leaderboard/calculate', authenticateToken, requireTeamLeadOrAdmin, async (req: Request, res: Response) => {
  try {
    const month = req.body.month;
    const result = await metricsServiceModule.calculateLeaderboard(month);
    res.json({ success: true, message: 'Leaderboard recalculated', data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/teamlead/metrics/performance/:employeeId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    const month = req.query.month as string;
    const result = await metricsServiceModule.calculatePerformance(employeeId, month);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/teamlead/metrics/efficiency/:employeeId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    const month = req.query.month as string;
    const result = await metricsServiceModule.calculateEfficiency(employeeId, month);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/teamlead/metrics/daily-tracking', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;
    const days = parseInt(req.query.days as string) || 7;
    const result = await metricsServiceModule.getDailyTracking(employee.id, days);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/teamlead/metrics/team-strength/:teamLeadId', authenticateToken, requireTeamLeadOrAdmin, async (req: Request, res: Response) => {
  try {
    const teamLeadId = parseInt(req.params.teamLeadId);
    const month = req.query.month as string;
    const result = await metricsServiceModule.calculateTeamStrength(teamLeadId, month);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─── SCOPE ACTIONS ──────────────────────────────────────────────────────────

router.get('/teamlead/permissions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;
    const result = await scopeActionsServiceModule.getEmployeePermissions(employee.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/teamlead/permissions/grant', authenticateToken, requireTeamLeadOrAdmin, async (req: Request, res: Response) => {
  try {
    const { employeeId, actionType, resource, scope } = req.body;
    const user = (req as any).user;
    const result = await scopeActionsServiceModule.grantScopeAction(employeeId, actionType, resource, scope, user.email);
    res.status(201).json({ success: true, message: 'Permission granted', data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─── UPCOMING DEADLINES ─────────────────────────────────────────────────────

router.get('/teamlead/deadlines/upcoming', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;
    const daysRange = parseInt(req.query.daysRange as string) || 7;
    const result = await deadlineServiceModule.getUpcomingDeadlines(employee.id, daysRange);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/teamlead/deadlines/overdue', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;
    const result = await deadlineServiceModule.getOverdueTasks(employee.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/teamlead/deadlines/stats/:teamLeadId', authenticateToken, requireTeamLeadOrAdmin, async (req: Request, res: Response) => {
  try {
    const teamLeadId = parseInt(req.params.teamLeadId);
    const result = await deadlineServiceModule.getTeamDeadlineStats(teamLeadId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/teamlead/deadlines/send-notifications', async (_req: Request, res: Response) => {
  try {
    const result = await deadlineServiceModule.processPendingNotifications();
    res.json({ success: true, message: 'Notifications processed', data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
