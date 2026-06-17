import { Router } from 'express';
import { createTeacher, getAllTeachers, markAttendance, getAttendanceHistory, getAllTeacherAttendance, updateTeacher, deleteTeacher, getTeacherProfilePdf } from './teacher.controller';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';

const router = Router();

router.post('/', requireAuth, requireRole(['SUPER_ADMIN']), createTeacher);
router.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), getAllTeachers);
router.post('/attendance', requireAuth, requireRole(['TEACHER']), markAttendance);
router.get('/attendance/history', requireAuth, requireRole(['TEACHER']), getAttendanceHistory);
router.get('/attendance/all', requireAuth, requireRole(['SUPER_ADMIN']), getAllTeacherAttendance);
router.put('/:id', requireAuth, requireRole(['SUPER_ADMIN']), updateTeacher);
router.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN']), deleteTeacher);
router.get('/:id/download', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), getTeacherProfilePdf);

export default router;
