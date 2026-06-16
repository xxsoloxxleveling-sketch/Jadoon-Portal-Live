import { Router } from 'express';
import { getNotifications, markAsRead } from './notifications.controller';
import { requireAuth } from '../../middlewares/authMiddleware';

const router = Router();

router.get('/', requireAuth, getNotifications);
router.put('/read', requireAuth, markAsRead);

export default router;
