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

  // Verify the user is the customer who owns the job
  const { data: job, error: jobError } = await (supabase as any)
    .from('jobs')
    .select('customer_id, status')
    .eq('id', data.jobId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  if (job.customer_id !== user.id) {
    throw new Error('You can only report jobs that you created')
  }

  // Only allow reports for IN_PROGRESS or PENDING_REVIEW jobs
  if (job.status !== 'IN_PROGRESS' && job.status !== 'PENDING_REVIEW') {
    throw new Error('Can only report jobs that are in progress or pending review')
  }

  // Create the report
  const { error: reportError } = await (supabase as any)
    .from('job_reports')
    .insert([
      {
        job_id: data.jobId,
        reporter_id: user.id,
        reason: data.reason,
        details: data.details || null,
        status: 'PENDING', // PENDING, INVESTIGATING, RESOLVED, DISMISSED
      },
    ])

  if (reportError) {
    console.error('Report submission error:', reportError)
    throw new Error('Failed to submit report')
  }

  // Create a notification for admin
  const { error: notificationError } = await (supabase as any)
    .from('notifications')
    .insert([
      {
        type: 'JOB_REPORTED',
        user_id: 'admin', // Special handling in notification system
        payload: {
          job_id: data.jobId,
          reason: data.reason,
          reporter_id: user.id,
        },
        is_read: false,
      },
    ])

  if (notificationError) {
    console.error('Admin notification error:', notificationError)
    // Don't throw here - the report was still created
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
    .from('job_reports')
    .select(`
      *,
      job:jobs(id, status, location_address),
      reporter:profiles!reporter_id(id, full_name)
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
    console.error('Error fetching reports:', error)
    throw new Error('Failed to fetch reports')
  }

  return data || []
}

export async function updateReportStatus(reportId: string, status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED') {
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
    .from('job_reports')
    .update({ 
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  if (error) {
    console.error('Error updating report status:', error)
    throw new Error('Failed to update report status')
  }

  return { success: true }
}
