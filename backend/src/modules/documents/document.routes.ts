import { Router } from 'express';
import {
  createDocumentController,
  getAllDocumentsController,
  deleteDocumentController,
  verifyDocumentController,
} from './document.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin, requireTeamLeadOrAdmin } from '../../middleware/role.middleware';

const router = Router();

router.post(
  '/admin/documents',
  authenticateToken,
  requireSuperAdmin,
  createDocumentController
);

router.get(
  '/admin/documents',
  authenticateToken,
  requireTeamLeadOrAdmin,
  getAllDocumentsController
);

router.delete(
  '/admin/documents/:id',
  authenticateToken,
  requireSuperAdmin,
  deleteDocumentController
);

router.patch(
  '/admin/documents/:id/verify',
  authenticateToken,
  requireTeamLeadOrAdmin,
  verifyDocumentController
);

export default router;
