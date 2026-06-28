import { Router } from 'express';
import { loginController, logoutController } from './auth.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

router.post('/auth/login', loginController);
router.post('/auth/logout', authenticateToken, logoutController);

export default router;