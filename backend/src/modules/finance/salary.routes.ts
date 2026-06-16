import express from 'express';
import { createSalaryRecord, getSalaryRecords, updateSalaryStatus } from './salary.controller';
import { requireAuth } from '../../middlewares/authMiddleware';

const router = express.Router();

router.use(requireAuth);

router.post('/', createSalaryRecord);
router.get('/', getSalaryRecords);
router.patch('/:id/status', updateSalaryStatus);

export default router;
