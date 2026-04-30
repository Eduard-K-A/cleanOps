'use server'
import { createClient } from '@/lib/supabase/server'

export interface ReportData {
  jobId: string
  reason: string
  details?: string
  reportedBy: string
}

export async function submitJobReport(data: ReportData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify the user is involved in the job
  const { data: job, error: jobError } = await (supabase as any)
    .from('jobs')
    .select('customer_id, worker_id, status')
    .eq('id', data.jobId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  const isCustomer = job.customer_id === user.id;
  const isWorker = job.worker_id === user.id;

  if (!isCustomer && !isWorker) {
    throw new Error('You can only report jobs you are involved in')
  }

  // Only allow reports for certain job states
  if (job.status === 'CANCELLED' || job.status === 'COMPLETED') {
    // We might still allow reports for completed jobs to handle disputes after the fact
  }

  // Determine who is being reported
  const reportedId = isCustomer ? job.worker_id : job.customer_id;

  // Create the dispute
  const { error: disputeError } = await (supabase as any)
    .from('disputes')
    .insert([
      {
        job_id: data.jobId,
        reporter_id: user.id,
        reported_id: reportedId,
        reason: data.reason,
        description: data.details || '',
        status: 'OPEN', // OPEN, RESOLVED, DISMISSED
      },
    ])

  if (disputeError) {
    console.error('Dispute submission error:', disputeError)
    throw new Error('Failed to submit dispute')
  }

  // Create notifications for all admins
  const { data: admins } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  if (admins && admins.length > 0) {
    const notifications = admins.map((admin: { id: string }) => ({
      type: 'JOB_REPORTED',
      user_id: admin.id,
      payload: {
        job_id: data.jobId,
        reason: data.reason,
        reporter_id: user.id,
      },
      is_read: false,
    }))

    const { error: notificationError } = await (supabase as any)
      .from('notifications')
      .insert(notifications)

    if (notificationError) {
      console.error('Admin notification error:', notificationError)
    }
  }

  return { success: true }
}

export async function getJobReports(jobId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check if user is admin
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  let query = (supabase as any)
    .from('disputes')
    .select(`
      *,
      job:jobs(id, status, location_address, price_amount, tasks, worker_id, created_at, updated_at),
      reporter:profiles!reporter_id(id, full_name),
      reported:profiles!reported_id(id, full_name)
    `)
    .order('created_at', { ascending: false })

  if (!isAdmin) {
    // Non-admin users can only see their own reports
    query = query.eq('reporter_id', user.id)
  }

  if (jobId) {
    query = query.eq('job_id', jobId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching disputes:', error)
    throw new Error('Failed to fetch disputes')
  }

  return data || []
}

export async function updateReportStatus(reportId: string, status: 'OPEN' | 'RESOLVED' | 'DISMISSED') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify admin role
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Forbidden - Admin access required')
  }

  const { error } = await (supabase as any)
    .from('disputes')
    .update({ 
      status,
      // updated_at is handled by DB ideally, but we can set it if needed (not in schema)
    })
    .eq('id', reportId)

  if (error) {
    console.error('Error updating dispute status:', error)
    throw new Error('Failed to update dispute status')
  }

  return { success: true }
}
