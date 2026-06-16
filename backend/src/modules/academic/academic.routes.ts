import { Router } from 'express';
import { generateReportCard, getClasses, createClass, getDashboardStats } from './academic.controller';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';

const router = Router();
router.post('/report-card', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), generateReportCard);
router.get('/classes', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), getClasses);
router.post('/classes', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), createClass);
router.get('/dashboard-stats', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), getDashboardStats);

export default router;
