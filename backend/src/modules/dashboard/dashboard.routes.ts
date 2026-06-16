import { Router } from 'express';
import { getDashboardStats } from './dashboard.controller';
import { requireAuth } from '../../middlewares/authMiddleware';

const router = Router();

// Apply authentication middleware selectively or globally here
router.get('/stats', requireAuth, getDashboardStats);

export default router;
