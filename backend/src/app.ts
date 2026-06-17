import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';
import authRoutes from './modules/auth/auth.routes';
import studentRoutes from './modules/students/student.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import academicRoutes from './modules/academic/academic.routes';
import financeRoutes from './modules/finance/finance.routes';
import teacherRoutes from './modules/teachers/teacher.routes';
import employeeRoutes from './modules/employees/employee.routes';
import documentRoutes from './modules/documents/document.routes';
import auditRoutes from './modules/audit/audit.routes';
import salaryRoutes from './modules/finance/salary.routes';
import transactionRoutes from './modules/finance/transaction.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

const app = express();

// --- BACKEND SECURITY CODER PATTERNS ---
app.use(helmet()); 
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'Too many requests originating from this IP, please try again after 15 minutes.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter); // Apply globally to all /api routes

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/transactions', transactionRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err }, `[SECURE_LOG] Error intercepted: ${err.message}`); // Only log message natively to prevent leaking full stack structures
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
module.exports = app;
