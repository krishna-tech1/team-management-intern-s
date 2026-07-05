import { Router } from 'express';
import authRouter from '../modules/auth/auth.routes';
import dashboardRouter from '../modules/dashboard/dashboard.routes';
import employeeRouter from '../modules/employees/employee.routes';
import clientRouter from '../modules/clients/client.routes';
import taskRouter from '../modules/tasks/task.routes';
import allocationRouter from '../modules/allocations/allocation.routes';
import documentRouter from '../modules/documents/document.routes';
import analyticsRouter from '../modules/analytics/analytics.routes';
import auditlogRouter from '../modules/auditlogs/auditlog.routes';
import incentiveRouter from '../modules/incentives/incentive.routes';
import employeeAccessRouter from '../modules/employeeAccess/employeeAccess.routes';
import teamleadRouter from '../modules/teamlead/teamlead.routes';
import employeeMobileRouter from '../modules/employee-mobile/employee.routes';
import uploadRouter from './upload.routes';
import searchRouter from './search.routes';
import settingsRouter from './settings.routes';
import notificationsRouter from './notifications.routes';
import csvRouter from './csv.routes';
import onboardingRouter from '../modules/onboarding/onboarding.routes';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ message: 'GST & MCA Operations Management API' });
});

router.use(authRouter);
router.use(dashboardRouter);
router.use(employeeRouter);
router.use(clientRouter);
router.use(taskRouter);
router.use(allocationRouter);
router.use(documentRouter);
router.use(analyticsRouter);
router.use(auditlogRouter);
router.use(incentiveRouter);
router.use(employeeAccessRouter);
router.use(teamleadRouter);
router.use(employeeMobileRouter);
router.use(uploadRouter);
router.use(searchRouter);
router.use(settingsRouter);
router.use(notificationsRouter);
router.use(csvRouter);
router.use('/onboarding', onboardingRouter);

export default router;

