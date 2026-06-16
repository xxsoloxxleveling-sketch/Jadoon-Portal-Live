import { Router } from 'express';
import { getAuditLogs } from './audit.controller';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';

const router = Router();

// Immutable audit trails are strictly SUPER_ADMIN
router.get('/', requireAuth, requireRole(['SUPER_ADMIN']), getAuditLogs);

export default router;
