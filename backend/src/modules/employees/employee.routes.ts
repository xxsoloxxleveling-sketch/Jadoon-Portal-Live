import { Router } from 'express';
import { getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee, createSalaryRecord, createPerformanceEvaluation } from './employee.controller';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';

const router = Router();

router.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), getEmployees);
router.get('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), getEmployeeById);
router.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), createEmployee);
router.put('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), updateEmployee);
router.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN']), deleteEmployee);

router.post('/salary', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), createSalaryRecord);
router.post('/evaluation', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), createPerformanceEvaluation);

export default router;
