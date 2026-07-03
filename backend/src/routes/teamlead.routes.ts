import { Router, Request, Response } from 'express';
import { authenticateToken, requireTeamLeadOrAdmin } from '../middleware/auth.middleware';

// Import all services
import * as attendanceService from '../modules/attendance/attendance.service';
import * as gpsService from '../modules/gps/gps.service';
import * as onboardingService from '../modules/onboarding/onboarding.service';
import * as passwordService from '../modules/password/password.service';
import * as taskAssignmentService from '../modules/taskassignment/taskassignment.service';
import * as metricsService from '../modules/metrics/metrics.service';
import * as scopeActionsService from '../modules/scopeactions/scopeactions.service';
import * as deadlineService from '../modules/upcomingdeadline/upcomingdeadline.service';

const router = Router();

// ─── ATTENDANCE ROUTES ────────────────────────────────────────────────────────

/**
 * POST /api/teamlead/attendance/check-in
 * Record employee check-in with GPS coordinates
 */
router.post('/attendance/check-in', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { latitude, longitude, accuracy, address, selfieUrl } = req.body;

    const result = await attendanceService.checkIn(userId, {
      latitude,
      longitude,
      accuracy,
      address,
      selfieUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Check-in successful',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/teamlead/attendance/check-out
 * Record employee check-out with GPS coordinates and radius validation
 */
router.post('/attendance/check-out', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { latitude, longitude, accuracy, address, selfieUrl } = req.body;

    const result = await attendanceService.checkOut(userId, {
      latitude,
      longitude,
      accuracy,
      address,
      selfieUrl,
    });

    res.status(200).json({
      success: true,
      message: 'Check-out successful',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/teamlead/attendance/history
 * Get employee's attendance history
 */
router.get('/attendance/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await attendanceService.getAttendanceHistory(userId, page, limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/teamlead/attendance/summary
 * Get attendance summary for period
 */
router.get('/attendance/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const period = (req.query.period as 'WEEK' | 'MONTH') || 'WEEK';

    const result = await attendanceService.getAttendanceSummary(userId, period);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─── GPS ROUTES ──────────────────────────────────────────────────────────────

/**
 * GET /api/teamlead/gps/current
 * Get current GPS location
 */
router.get('/gps/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const employee = (req as any).employee;

    const result = await gpsService.getCurrentLocation(employee.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/teamlead/gps/history
 * Get GPS location history
 */
router.get('/gps/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const eventType = req.query.eventType as string;

    const result = await gpsService.getEmployeeGPSHistory(
      employee.id,
      page,
      limit,
      eventType
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/teamlead/gps/heatmap
 * Get GPS heatmap data (location clusters)
 */
router.get('/gps/heatmap', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;
    const dateFrom = new Date(req.query.dateFrom as string);
    const dateTo = new Date(req.query.dateTo as string);

    const result = await gpsService.getGPSHeatmapData(employee.id, dateFrom, dateTo);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─── TASK ASSIGNMENT ROUTES ──────────────────────────────────────────────────

/**
 * GET /api/teamlead/tasks/assigned
 * Get tasks assigned to current user
 */
router.get('/tasks/assigned', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await taskAssignmentService.getEmployeeAssignedTasks(
      employee.id,
      status,
      page,
      limit
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/teamlead/tasks/assign
 * Assign task to employee (admin/team lead only)
 */
router.post(
  '/tasks/assign',
  authenticateToken,
  requireTeamLeadOrAdmin,
  async (req: Request, res: Response) => {
    try {
      const { taskId, employeeId } = req.body;
      const user = (req as any).user;

      const result = await taskAssignmentService.assignTask(
        taskId,
        employeeId,
        user.email
      );

      res.status(201).json({
        success: true,
        message: 'Task assigned successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

/**
 * GET /api/teamlead/tasks/workload
 * Get employee workload
 */
router.get('/tasks/workload', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.query.employeeId as string);

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'employeeId query parameter is required',
      });
    }

    const result = await taskAssignmentService.getEmployeeWorkload(employeeId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/teamlead/tasks/overdue
 * Get overdue tasks for employee
 */
router.get('/tasks/overdue', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;

    const result = await taskAssignmentService.getOverdueTasks(employee.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─── LEADERBOARD & METRICS ROUTES ────────────────────────────────────────────

/**
 * GET /api/teamlead/metrics/leaderboard
 * Get leaderboard rankings
 */
router.get(
  '/metrics/leaderboard',
  authenticateToken,
  requireTeamLeadOrAdmin,
  async (req: Request, res: Response) => {
    try {
      const month = req.query.month as string;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await metricsService.getLeaderboard(month, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

/**
 * POST /api/teamlead/metrics/leaderboard/calculate
 * Recalculate leaderboard (admin only)
 */
router.post(
  '/metrics/leaderboard/calculate',
  authenticateToken,
  requireTeamLeadOrAdmin,
  async (req: Request, res: Response) => {
    try {
      const month = req.body.month;

      const result = await metricsService.calculateLeaderboard(month);

      res.json({
        success: true,
        message: 'Leaderboard recalculated',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

/**
 * GET /api/teamlead/metrics/performance/:employeeId
 * Get performance metrics for employee
 */
router.get(
  '/metrics/performance/:employeeId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const month = req.query.month as string;

      const result = await metricsService.calculatePerformance(employeeId, month);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

/**
 * GET /api/teamlead/metrics/efficiency/:employeeId
 * Get efficiency metrics for employee
 */
router.get(
  '/metrics/efficiency/:employeeId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const month = req.query.month as string;

      const result = await metricsService.calculateEfficiency(employeeId, month);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

/**
 * GET /api/teamlead/metrics/daily-tracking
 * Get daily tracking for employee
 */
router.get('/metrics/daily-tracking', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;
    const days = parseInt(req.query.days as string) || 7;

    const result = await metricsService.getDailyTracking(employee.id, days);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/teamlead/metrics/team-strength/:teamLeadId
 * Get team strength metrics
 */
router.get(
  '/metrics/team-strength/:teamLeadId',
  authenticateToken,
  requireTeamLeadOrAdmin,
  async (req: Request, res: Response) => {
    try {
      const teamLeadId = parseInt(req.params.teamLeadId);
      const month = req.query.month as string;

      const result = await metricsService.calculateTeamStrength(teamLeadId, month);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// ─── SCOPE ACTIONS ROUTES ────────────────────────────────────────────────────

/**
 * GET /api/teamlead/permissions
 * Get my permissions
 */
router.get('/permissions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;

    const result = await scopeActionsService.getEmployeePermissions(employee.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/teamlead/permissions/grant
 * Grant permission to employee (team lead/admin only)
 */
router.post(
  '/permissions/grant',
  authenticateToken,
  requireTeamLeadOrAdmin,
  async (req: Request, res: Response) => {
    try {
      const { employeeId, actionType, resource, scope } = req.body;
      const user = (req as any).user;

      const result = await scopeActionsService.grantScopeAction(
        employeeId,
        actionType,
        resource,
        scope,
        user.email
      );

      res.status(201).json({
        success: true,
        message: 'Permission granted',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// ─── UPCOMING DEADLINES ROUTES ───────────────────────────────────────────────

/**
 * GET /api/teamlead/deadlines/upcoming
 * Get upcoming deadlines for employee
 */
router.get('/deadlines/upcoming', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;
    const daysRange = parseInt(req.query.daysRange as string) || 7;

    const result = await deadlineService.getUpcomingDeadlines(employee.id, daysRange);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/teamlead/deadlines/overdue
 * Get overdue tasks
 */
router.get('/deadlines/overdue', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;

    const result = await deadlineService.getOverdueTasks(employee.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/teamlead/deadlines/stats/:teamLeadId
 * Get team deadline statistics
 */
router.get(
  '/deadlines/stats/:teamLeadId',
  authenticateToken,
  requireTeamLeadOrAdmin,
  async (req: Request, res: Response) => {
    try {
      const teamLeadId = parseInt(req.params.teamLeadId);

      const result = await deadlineService.getTeamDeadlineStats(teamLeadId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

/**
 * POST /api/teamlead/deadlines/send-notifications
 * Send pending deadline notifications (cron endpoint)
 */
router.post('/deadlines/send-notifications', async (req: Request, res: Response) => {
  try {
    // In production, verify this is called from authorized cron service
    const result = await deadlineService.processPendingNotifications();

    res.json({
      success: true,
      message: 'Notifications processed',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
