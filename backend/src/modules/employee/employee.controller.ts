import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  getEmployeeDashboard,
  getEmployeeTasks,
  getEmployeeTaskById,
  updateEmployeeTaskStatus,
  createWorkUpdate,
  getTaskHistory,
  getEmployeePerformance,
  getEmployeeIncentives,
  checkIn,
  checkOut,
  getAttendanceHistory,
  getEmployeeProfile,
  updateEmployeeProfile,
  getEmployeeNotifications,
  markNotificationRead,
  getEmployeeDocuments,
} from './employee.service';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from '../../utils/response.utils';

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export const dashboardController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const data = await getEmployeeDashboard(userId);
    return successResponse(res, data, 'Dashboard fetched successfully');
  } catch (err: any) {
    return errorResponse(res, err.message, err.message.includes('not found') ? 404 : 500);
  }
};

// ─── TASKS ────────────────────────────────────────────────────────────────────

export const getTasksController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await getEmployeeTasks(userId, page, limit, status, priority, search);
    return paginatedResponse(res, result.tasks, result.total, result.page, result.limit);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const getTaskByIdController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const taskId = parseInt(req.params.id);
    const task = await getEmployeeTaskById(userId, taskId);
    return successResponse(res, task, 'Task fetched successfully');
  } catch (err: any) {
    const code = err.message.includes('not found') || err.message.includes('denied') ? 404 : 500;
    return errorResponse(res, err.message, code);
  }
};

export const updateTaskStatusController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const taskId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status) return errorResponse(res, 'status field is required', 400);

    const task = await updateEmployeeTaskStatus(userId, taskId, status);
    return successResponse(res, task, 'Task status updated successfully');
  } catch (err: any) {
    const code = err.message.includes('not found') || err.message.includes('denied')
      ? 404
      : err.message.includes('Invalid status')
      ? 400
      : 500;
    return errorResponse(res, err.message, code);
  }
};

// ─── WORK UPDATE ─────────────────────────────────────────────────────────────

export const createWorkUpdateController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const taskId = parseInt(req.params.id);

    const { title, description, progress, remarks } = req.body;
    if (!title) return errorResponse(res, 'title is required', 400);

    const uploadedFiles = req.files as {
      photos?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    };

    const files = {
      photos: uploadedFiles?.photos ?? [],
      documents: uploadedFiles?.documents ?? [],
    };

    const workUpdate = await createWorkUpdate(userId, taskId, { title, description, progress, remarks }, files);
    return successResponse(res, workUpdate, 'Work update created successfully', 201);
  } catch (err: any) {
    const code = err.message.includes('not found') || err.message.includes('denied') ? 404 : 500;
    return errorResponse(res, err.message, code);
  }
};

// ─── TASK HISTORY ─────────────────────────────────────────────────────────────

export const getTaskHistoryController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const taskId = parseInt(req.params.id);
    const history = await getTaskHistory(userId, taskId);
    return successResponse(res, history, 'Task history fetched successfully');
  } catch (err: any) {
    const code = err.message.includes('not found') || err.message.includes('denied') ? 404 : 500;
    return errorResponse(res, err.message, code);
  }
};

// ─── PERFORMANCE ─────────────────────────────────────────────────────────────

export const getPerformanceController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const data = await getEmployeePerformance(userId);
    return successResponse(res, data, 'Performance fetched successfully');
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── INCENTIVES ───────────────────────────────────────────────────────────────

export const getIncentivesController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const data = await getEmployeeIncentives(userId);
    return successResponse(res, data, 'Incentives fetched successfully');
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export const checkInController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return errorResponse(res, 'latitude and longitude are required', 400);
    }

    const record = await checkIn(userId, parseFloat(latitude), parseFloat(longitude));
    return successResponse(res, record, 'Checked in successfully', 201);
  } catch (err: any) {
    const code = err.message.includes('Already') ? 400 : 500;
    return errorResponse(res, err.message, code);
  }
};

export const checkOutController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return errorResponse(res, 'latitude and longitude are required', 400);
    }

    const record = await checkOut(userId, parseFloat(latitude), parseFloat(longitude));
    return successResponse(res, record, 'Checked out successfully');
  } catch (err: any) {
    const code =
      err.message.includes('Cannot') || err.message.includes('Already') ? 400 : 500;
    return errorResponse(res, err.message, code);
  }
};

export const getAttendanceController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const filter = (req.query.filter as 'today' | 'weekly' | 'monthly') || 'monthly';
    const data = await getAttendanceHistory(userId, filter);
    return successResponse(res, data, 'Attendance fetched successfully');
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export const getProfileController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const profile = await getEmployeeProfile(userId);
    return successResponse(res, profile, 'Profile fetched successfully');
  } catch (err: any) {
    const code = err.message.includes('not found') ? 404 : 500;
    return errorResponse(res, err.message, code);
  }
};

export const updateProfileController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const { phone, emergencyContact, address, password } = req.body;

    // Handle profile photo upload if a file was provided
    const profilePhotoFile = req.file;

    const result = await updateEmployeeProfile(userId, {
      phone,
      emergencyContact,
      address,
      password,
      profilePhotoFile,
    });
    return successResponse(res, result, 'Profile updated successfully');
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const getNotificationsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getEmployeeNotifications(userId, page, limit);
    return paginatedResponse(res, result.notifications, result.total, result.page, result.limit);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const markNotificationReadController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const notificationId = parseInt(req.params.id);
    const result = await markNotificationRead(userId, notificationId);
    return successResponse(res, result, 'Notification marked as read');
  } catch (err: any) {
    const code = err.message.includes('not found') ? 404 : 500;
    return errorResponse(res, err.message, code);
  }
};

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────

export const getDocumentsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const result = await getEmployeeDocuments(userId, page, limit, search);
    return paginatedResponse(res, result.documents, result.total, result.page, result.limit);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};
