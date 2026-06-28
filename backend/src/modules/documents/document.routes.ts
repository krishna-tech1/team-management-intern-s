import { Router } from 'express';
import {
  createDocumentController,
  getAllDocumentsController,
  deleteDocumentController,
} from './document.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin } from '../../middleware/role.middleware';

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
  requireSuperAdmin,
  getAllDocumentsController
);

router.delete(
  '/admin/documents/:id',
  authenticateToken,
  requireSuperAdmin,
  deleteDocumentController
);

export default router;
