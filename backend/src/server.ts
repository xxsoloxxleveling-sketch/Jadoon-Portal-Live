import app from './app';
import dotenv from 'dotenv';
import { initCronJobs } from './utils/cron';
import logger from './utils/logger';

dotenv.config();

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  logger.info(`Jadoon Portal API is operational on HTTP port ${PORT}`);
  initCronJobs();
});
