import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.utils';

import { getTeamLeadDashboard } from './teamlead.dashboard.service';
import { getTLEmployees, getTLEmployeeById, updateTLEmployee } from './teamlead.employee.service';
import { getTLClients, getTLClientById } from './teamlead.client.service';
import {
  getTLTasks, createTLTask, updateTLTask, deleteTLTask,
} from './teamlead.task.service';
import { assignTask } from '../taskassignment/taskassignment.service';
import { getTLTracking } from './teamlead.tracking.service';
import { getTLAnalytics } from './teamlead.analytics.service';
import { getTLIncentives, calculateTLIncentives, updateTLIncentiveStatus } from './teamlead.incentive.service';
import {
  getTLNotifications, createTLNotification, markNotificationRead,
} from './teamlead.notification.service';
import { getTLLeaves, getTLLeaveById, reviewLeave } from './teamlead.leave.service';
import { getTLAttendance } from './teamlead.attendance.service';
import { getTeamMemberIds } from './teamlead.helper';

const getUserId = (req: AuthRequest): number => parseInt(req.user!.id);
const getEmail = (req: AuthRequest): string => req.user?.email || 'System';

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export const dashboardController = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getTeamLeadDashboard(getUserId(req));
    return successResponse(res, data, 'Dashboard data fetched');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('not found') ? 404 : 500);
  }
};

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────

export const getEmployeesController = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await getTLEmployees(
      getUserId(req), page, limit,
      req.query.search as string,
      req.query.status as string,
      req.query.department as string,
    );
    return paginatedResponse(res, result.employees, result.total, result.page, result.limit);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const getEmployeeByIdController = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getTLEmployeeById(getUserId(req), parseInt(req.params.id));
    return successResponse(res, data, 'Employee fetched');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('not found') || err.message.includes('not in') ? 404 : 500);
  }
};

export const updateEmployeeController = async (req: AuthRequest, res: Response) => {
  try {
    const data = await updateTLEmployee(getUserId(req), parseInt(req.params.id), req.body);
    return successResponse(res, data, 'Employee updated');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('not found') || err.message.includes('not in') ? 404 : 500);
  }
};

// ─── CLIENTS ──────────────────────────────────────────────────────────────────

export const getClientsController = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await getTLClients(
      getUserId(req), page, limit,
      req.query.search as string,
      req.query.status as string,
      req.query.serviceType as string,
    );
    return paginatedResponse(res, result.clients, result.total, result.page, result.limit);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const getClientByIdController = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getTLClientById(getUserId(req), parseInt(req.params.id));
    return successResponse(res, data, 'Client fetched');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('not found') || err.message.includes('not accessible') ? 404 : 500);
  }
};

// ─── TASKS ────────────────────────────────────────────────────────────────────

export const getTasksController = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await getTLTasks(
      getUserId(req), page, limit,
      req.query.search as string,
      req.query.status as string,
      req.query.priority as string,
      req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
      req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined,
    );
    return paginatedResponse(res, result.tasks, result.total, result.page, result.limit);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const createTaskController = async (req: AuthRequest, res: Response) => {
  try {
    const task = await createTLTask(getUserId(req), req.body);
    return successResponse(res, task, 'Task created', 201);
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('not found') || err.message.includes('not in') ? 400 : 500);
  }
};

export const updateTaskController = async (req: AuthRequest, res: Response) => {
  try {
    const task = await updateTLTask(getUserId(req), parseInt(req.params.id), req.body);
    return successResponse(res, task, 'Task updated');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('not found') || err.message.includes('not accessible') ? 404 : 500);
  }
};

export const deleteTaskController = async (req: AuthRequest, res: Response) => {
  try {
    const result = await deleteTLTask(getUserId(req), parseInt(req.params.id));
    return successResponse(res, result, 'Task deleted');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('not found') || err.message.includes('not accessible') ? 404 : 500);
  }
};

export const assignTaskController = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return errorResponse(res, 'employeeId is required', 400);
    const task = await assignTask(parseInt(req.params.id), parseInt(employeeId), getEmail(req));
    return successResponse(res, task, 'Task assigned successfully');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('not found') || err.message.includes('not in') ? 400 : 500);
  }
};

// ─── TRACKING ─────────────────────────────────────────────────────────────────

export const trackingController = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getTLTracking(getUserId(req));
    return successResponse(res, data, 'Tracking data fetched');
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

export const analyticsController = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getTLAnalytics(getUserId(req));
    return successResponse(res, data, 'Analytics fetched');
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── INCENTIVES ───────────────────────────────────────────────────────────────

export const getIncentivesController = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await getTLIncentives(getUserId(req), page, limit);
    return successResponse(res, data, 'Incentives fetched');
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const calculateIncentivesController = async (req: AuthRequest, res: Response) => {
  try {
    const { month } = req.body;
    if (!month) return errorResponse(res, 'month is required (format: YYYY-MM)', 400);
    const data = await calculateTLIncentives(getUserId(req), month);
    return successResponse(res, data, 'Incentives calculated', 201);
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('Invalid') ? 400 : 500);
  }
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const getNotificationsController = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getTLNotifications(getUserId(req), page, limit);
    return paginatedResponse(res, result.notifications, result.total, result.page, result.limit);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const createNotificationController = async (req: AuthRequest, res: Response) => {
  try {
    const memberIds = await getTeamMemberIds(getUserId(req));
    const data = await createTLNotification(getEmail(req), req.body, memberIds);
    return successResponse(res, data, 'Notification sent', 201);
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('not in') ? 400 : 500);
  }
};

export const markReadController = async (req: AuthRequest, res: Response) => {
  try {
    const data = await markNotificationRead(parseInt(req.params.id));
    return successResponse(res, data, 'Notification marked as read');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('not found') ? 404 : 500);
  }
};

// ─── LEAVES ───────────────────────────────────────────────────────────────────

export const getLeavesController = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await getTLLeaves(getUserId(req), page, limit, req.query.status as string);
    return paginatedResponse(res, result.leaves, result.total, result.page, result.limit);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const getLeaveByIdController = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getTLLeaveById(getUserId(req), parseInt(req.params.id));
    return successResponse(res, data, 'Leave fetched');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('not found') ? 404 : 500);
  }
};

export const approveLeaveController = async (req: AuthRequest, res: Response) => {
  try {
    const data = await reviewLeave(getUserId(req), getEmail(req), parseInt(req.params.id), 'APPROVED', req.body.note);
    return successResponse(res, data, 'Leave approved');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('not found') ? 404 : 400);
  }
};

export const rejectLeaveController = async (req: AuthRequest, res: Response) => {
  try {
    const data = await reviewLeave(getUserId(req), getEmail(req), parseInt(req.params.id), 'REJECTED', req.body.note);
    return successResponse(res, data, 'Leave rejected');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('not found') ? 404 : 400);
  }
};

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export const attendanceController = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';
    const data = await getTLAttendance(getUserId(req), page, limit, period);
    return successResponse(res, data, 'Attendance fetched');
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const updateIncentiveController = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) return errorResponse(res, 'status is required', 400);
    const data = await updateTLIncentiveStatus(getUserId(req), parseInt(req.params.id), status);
    return successResponse(res, data, 'Incentive status updated');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('not found') || err.message.includes('denied') ? 404 : 400);
  }
};
