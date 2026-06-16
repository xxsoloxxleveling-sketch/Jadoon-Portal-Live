import { Router } from 'express';
import { login, me, createAdmin } from './auth.controller';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';
import { validate } from '../../middlewares/validate';
import { loginSchema, createAdminSchema } from './auth.schema';

const router = Router();
router.post('/login', validate(loginSchema), login);
router.get('/me', requireAuth, me);
router.post('/admin', requireAuth, requireRole(['SUPER_ADMIN']), validate(createAdminSchema), createAdmin);
export default router;
