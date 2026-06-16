import cron from 'node-cron';
import prisma from '../config/database';
import logger from './logger';

export const initCronJobs = () => {
  // Midnight Cron Job targeting Late Fee defaults
  // Schedule: At 00:00 every day
  cron.schedule('0 0 * * *', async () => {
    logger.info('[CRON] ⏰ Running Late Fee Automation Engine...');
    try {
      // Fast, atomic database update utilizing PostgreSQL/SQLite internal increment 
      // instead of pulling thousands of records into Node's memory manually
      const result = await prisma.feeChallan.updateMany({
        where: {
          status: 'PENDING',
          // Only check dates technically in the past
          due_date: { lt: new Date() },
          late_fee_applied: false
        },
        data: {
          late_fee_applied: true,
          // Use Prisma mathematical atomic increnent
          amount_due: { increment: 500 } 
        }
      });
      
      if (result.count > 0) {
        logger.info(`[CRON] ✅ Successfully enforced a 500 PKR Late Penalty on ${result.count} overdue challans.`);
      } else {
        logger.info(`[CRON] 🆗 No overdue pending challans detected today.`);
      }
    } catch (error) {
      logger.error({ error }, '[CRON] ❌ Fatal error executing late fee script');
    }
  });

  logger.info('[CRON] Jobs successfully seeded and listening in the Node background pool.');
};
