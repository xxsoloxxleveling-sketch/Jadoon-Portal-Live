import { Router } from 'express';
import { uploadDocument, deleteDocument } from './document.controller';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';
import { upload } from '../../config/cloudinary';

const router = Router();

router.post('/upload', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), upload.single('file'), uploadDocument);
router.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteDocument);

export default router;
