import { Router } from 'express';
import { bulkEnroll, getStudents, promoteClass, enrollBatch, getStudentProfile, getStudentProfilePdf, createStudent, updateStudent, deleteStudent } from './student.controller';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';
import { validate } from '../../middlewares/validate';
import { createStudentSchema, updateStudentSchema, promoteClassSchema, bulkEnrollSchema, enrollBatchSchema } from './student.schema';

const router = Router();
router.post('/bulk-enroll', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), validate(bulkEnrollSchema), bulkEnroll);
router.post('/promote', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), validate(promoteClassSchema), promoteClass);
router.put('/classes/:id/enroll-batch', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), validate(enrollBatchSchema), enrollBatch);
router.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), getStudents);
router.post('/', requireAuth, requireRole(['SUPER_ADMIN']), validate(createStudentSchema), createStudent);
router.get('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), getStudentProfile);
router.get('/:id/download', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), getStudentProfilePdf);
router.put('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), validate(updateStudentSchema), updateStudent);
router.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN']), deleteStudent);
export default router;
