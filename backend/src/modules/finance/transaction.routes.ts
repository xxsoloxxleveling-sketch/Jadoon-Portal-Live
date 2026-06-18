import { Router } from 'express';
import { 
  getTransactions, 
  createTransaction, 
  updateTransaction, 
  deleteTransaction, 
  getTransactionCategories, 
  createTransactionCategory, 
  deleteTransactionCategory, 
  getTransactionInvoicePdf,
  getTransactionsExportPdf
} from './transaction.controller';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';

const router = Router();

// Temporarily leaving them without requireAuth for quick testing if needed,
// but the original requested to have standard functionality.
router.use(requireAuth);

router.get('/', getTransactions);
router.post('/', requireRole(['ADMIN', 'SUPER_ADMIN']), createTransaction);
router.put('/:id', requireRole(['ADMIN', 'SUPER_ADMIN']), updateTransaction);
router.delete('/:id', requireRole(['ADMIN', 'SUPER_ADMIN']), deleteTransaction);

router.get('/categories', getTransactionCategories);
router.post('/categories', requireRole(['ADMIN', 'SUPER_ADMIN']), createTransactionCategory);
router.delete('/categories/:id', requireRole(['ADMIN', 'SUPER_ADMIN']), deleteTransactionCategory);

router.get('/export/pdf', getTransactionsExportPdf);
router.get('/:id/download', getTransactionInvoicePdf);

export default router;
