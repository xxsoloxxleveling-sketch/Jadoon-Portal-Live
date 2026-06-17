import { Router } from 'express';
import { createSalaryRecord, getSalaryRecords, updateSalaryStatus, getSalarySlipPdf } from './salary.controller';
import { requireAuth } from '../../middlewares/authMiddleware';

const router = Router();

router.use(requireAuth);

router.post('/', createSalaryRecord);
router.get('/', getSalaryRecords);
router.patch('/:id/status', updateSalaryStatus);
router.get('/:id/download', getSalarySlipPdf);

export default router;
