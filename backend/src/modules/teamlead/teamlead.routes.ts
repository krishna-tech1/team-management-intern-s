import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin, requireTeamLead } from '../../middleware/role.middleware';
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
router.get('/admin/teamlead', ...admin, async (req, res) => {
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

export default router;
