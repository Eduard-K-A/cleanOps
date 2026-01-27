import { getSupabaseAdmin } from '../config/supabase';
import { NotificationType } from '../types';

const supabase = getSupabaseAdmin() as any;

/**
 * Smart dispatch service: Notify nearby employees about high-urgency jobs
 * Runs as a cron job every 30 minutes
 */
export async function dispatchHighUrgencyJobs(): Promise<void> {
  try {
    console.log('[Dispatch Service] Running high-urgency job dispatch...');

    // Find high-urgency jobs that are OPEN and created > 30 minutes ago
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, location_point, urgency, created_at')
      .eq('status', 'OPEN')
      .eq('urgency', 'HIGH')
      .lt('created_at', thirtyMinutesAgo);

    if (jobsError) {
      console.error('[Dispatch Service] Error fetching jobs:', jobsError);
      return;
    }

    if (!jobs || jobs.length === 0) {
      console.log('[Dispatch Service] No high-urgency jobs found');
      return;
    }

    console.log(`[Dispatch Service] Found ${jobs.length} high-urgency job(s)`);

    // For each job, find nearby employees and notify them
    for (const job of jobs) {
      if (!job.location_point) continue;

      try {
        // Get nearby employees (within 10km, rating > 4.5)
        const { data: employees, error: employeesError } = await supabase.rpc(
          'get_nearby_employees',
          {
            job_location: job.location_point,
            max_distance_meters: 10000, // 10km
            min_rating: 4.5,
          }
        );

        if (employeesError) {
          console.error(`[Dispatch Service] Error fetching employees for job ${job.id}:`, employeesError);
          continue;
        }

        if (!employees || employees.length === 0) {
          console.log(`[Dispatch Service] No nearby employees found for job ${job.id}`);
          continue;
        }

        // Create notifications for each employee
        const notifications = employees.map((emp: any) => ({
          user_id: emp.id,
          type: 'DISPATCH_ALERT' as NotificationType,
          payload: {
            job_id: job.id,
            urgency: job.urgency,
            distance_meters: Math.round(emp.distance_meters),
          },
        }));

        const { error: notifyError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifyError) {
          console.error(`[Dispatch Service] Error creating notifications for job ${job.id}:`, notifyError);
        } else {
          console.log(
            `[Dispatch Service] Notified ${notifications.length} employee(s) about job ${job.id}`
          );
        }
      } catch (error) {
        console.error(`[Dispatch Service] Error processing job ${job.id}:`, error);
      }
    }

    console.log('[Dispatch Service] Dispatch completed');
  } catch (error) {
    console.error('[Dispatch Service] Fatal error:', error);
  }
}
