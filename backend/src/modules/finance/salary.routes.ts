import { Router } from 'express';
import { createSalaryRecord, getSalaryRecords, updateSalaryStatus, getSalarySlipPdf, getSalaryStatementPdf } from './salary.controller';
import { requireAuth } from '../../middlewares/authMiddleware';

const router = Router();

router.use(requireAuth);

router.post('/', createSalaryRecord);
router.get('/', getSalaryRecords);
router.patch('/:id/status', updateSalaryStatus);
router.get('/:id/download', getSalarySlipPdf);
router.get('/statement/:type/:id', getSalaryStatementPdf);

export default router;
