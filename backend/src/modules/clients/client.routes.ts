import { Router } from 'express';
import {
  getAllClientsController,
  getClientByIdController,
  createClientController,
  updateClientController,
  deleteClientController,
} from './client.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin } from '../../middleware/role.middleware';

const router = Router();

router.get(
  '/admin/clients',
  authenticateToken,
  requireSuperAdmin,
  getAllClientsController
);

router.get(
  '/admin/clients/:id',
  authenticateToken,
  requireSuperAdmin,
  getClientByIdController
);

router.post(
  '/admin/clients',
  authenticateToken,
  requireSuperAdmin,
  createClientController
);

router.put(
  '/admin/clients/:id',
  authenticateToken,
  requireSuperAdmin,
  updateClientController
);

router.delete(
  '/admin/clients/:id',
  authenticateToken,
  requireSuperAdmin,
  deleteClientController
);

export default router;
