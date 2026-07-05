import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin } from '../../middleware/role.middleware';
import * as onboardingService from './onboarding.service';
import * as passwordService from '../password/password.service';

const router = Router();

// ─── EMPLOYEE ONBOARDING ROUTES ──────────────────────────────────────────────

/**
 * POST /api/onboarding/create
 * Create new employee account (super admin only)
 */
router.post('/create', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      joiningDate,
      dateOfBirth,
      employeeCode,
    } = req.body;

    const result = await onboardingService.onboardEmployee({
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      joiningDate: new Date(joiningDate),
      dateOfBirth: new Date(dateOfBirth),
      employeeCode,
    });

    res.status(201).json({
      success: true,
      message: 'Employee onboarded successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/onboarding/status/:employeeId
 * Get onboarding status
 */
router.get(
  '/status/:employeeId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.employeeId);

      const result = await onboardingService.getOnboardingStatus(employeeId);

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
 * POST /api/onboarding/complete-profile
 * Complete employee profile setup
 */
router.post('/complete-profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employee = (req as any).employee;
    const { phone, profilePhotoUrl, profilePhotoPublicId } = req.body;

    const result = await onboardingService.completeProfileSetup(employee.id, {
      phone,
      profilePhotoUrl,
      profilePhotoPublicId,
    });

    res.json({
      success: true,
      message: 'Profile setup completed',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/onboarding/bulk
 * Bulk onboard employees (super admin only)
 */
router.post('/bulk', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const employees = req.body.employees;

    if (!Array.isArray(employees)) {
      return res.status(400).json({
        success: false,
        message: 'employees must be an array',
      });
    }

    const result = await onboardingService.bulkOnboardEmployees(
      employees.map((e: any) => ({
        ...e,
        joiningDate: new Date(e.joiningDate),
        dateOfBirth: new Date(e.dateOfBirth),
      }))
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─── PASSWORD MANAGEMENT ROUTES ──────────────────────────────────────────────

/**
 * POST /api/password/change
 * Employee changes their own password
 */
router.post('/password/change', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { oldPassword, newPassword } = req.body;

    const result = await passwordService.changeOwnPassword(userId, oldPassword, newPassword);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/password/reset
 * Reset employee password (admin only)
 */
router.post('/password/reset', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { employeeId, newPassword } = req.body;
    const user = (req as any).user;

    const result = await passwordService.resetEmployeePassword(
      employeeId,
      newPassword,
      user.email,
      'ADMIN_RESET'
    );

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/password/history/:employeeId
 * Get password change history (admin only)
 */
router.get(
  '/password/history/:employeeId',
  authenticateToken,
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.employeeId);

      const result = await passwordService.getPasswordChangeHistory(employeeId);

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
 * GET /api/password/age/:employeeId
 * Get password age (days since last change)
 */
router.get(
  '/password/age/:employeeId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.employeeId);

      const result = await passwordService.getPasswordAge(employeeId);

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
 * POST /api/password/forgot
 * Request password reset (forgot password flow)
 */
router.post('/password/forgot', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await passwordService.generatePasswordResetToken(email);

    // Return generic response for security
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    res.json({
      success: true,
      message: 'If an account exists, password reset instructions have been sent to the email.',
    });
  }
});

export default router;
