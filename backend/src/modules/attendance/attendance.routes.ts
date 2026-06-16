import { Router } from 'express';
import { batchMarkAttendance, getDailySummary, getClassGrid } from './attendance.controller';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';

const router = Router();
router.post('/batch', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), batchMarkAttendance);
router.post('/fast-entry', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), batchMarkAttendance);
router.get('/daily-summary', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), getDailySummary);
router.get('/grid/:class_id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), getClassGrid);
export default router;
