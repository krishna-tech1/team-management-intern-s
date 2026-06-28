import { Router } from 'express';
import { getAllAuditLogsController } from './auditlog.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin } from '../../middleware/role.middleware';

const router = Router();

router.get(
  '/admin/audit-logs',
  authenticateToken,
  requireSuperAdmin,
  getAllAuditLogsController
);

export default router;
