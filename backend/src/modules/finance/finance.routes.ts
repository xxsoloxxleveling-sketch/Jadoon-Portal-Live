import { Router } from 'express';
import { generateBulkChallans, paymentWebhook, downloadChallanPDF, generateIndividualChallan, getStudentChallans, markAsPaid, deleteChallan } from './finance.controller';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';

const router = Router();

// Financial bulk operations are strictly locked to SUPER_ADMIN
router.post('/bulk-generate', requireAuth, requireRole(['SUPER_ADMIN']), generateBulkChallans);
router.post('/student/generate', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), generateIndividualChallan);

// Validated by external IPs/Signatures in production, mock public here
router.post('/webhook', paymentWebhook);

router.get('/student/:student_id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), getStudentChallans);

router.put('/:id/pay', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), markAsPaid);
router.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN']), deleteChallan);

// Download route (Parents or Teachers)
router.get('/:id/pdf', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'PARENT']), downloadChallanPDF);

export default router;
