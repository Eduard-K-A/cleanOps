import cron from 'node-cron';
import { dispatchHighUrgencyJobs } from './dispatchService';

/**
 * Initialize cron jobs
 */
export function initializeCronJobs(): void {
  // Run dispatch service every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('[Cron] Running scheduled dispatch service...');
    await dispatchHighUrgencyJobs();
  });

  console.log('[Cron] Cron jobs initialized');
  console.log('  - High-urgency job dispatch: Every 30 minutes');
}
