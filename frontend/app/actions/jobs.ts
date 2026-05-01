'use server'
import { createClient } from '@/lib/supabase/server'
import { JobStatus } from '@/types'
import { verifyAdmin, getPlatformConfigInternal } from '@/app/actions/admin'

async function releaseEscrowAndCompleteJob(supabase: any, jobId: string) {
  const { data: job, error: jobError } = await (supabase as any)
    .from('jobs')
    .select('id, customer_id, worker_id, price_amount, fee_amount, status')
    .eq('id', jobId)
    .single()

  if (jobError || !job) throw new Error('Job not found')

  if (!job.worker_id) {
    throw new Error('Job has no worker assigned')
  }

  if (job.status === 'COMPLETED') {
    throw new Error('Job is already completed')
  }

  if (job.status === 'CANCELLED') {
    throw new Error('Cancelled jobs cannot be completed')
  }

  // Use the fee_amount stored on the job (locked in at creation)
  const platformFee = Number(job.fee_amount || 0);

  const { error: escrowError } = await (supabase as any).rpc('release_escrow', {
    p_job_id: jobId,
    p_employee_id: job.worker_id,
    p_amount: job.price_amount,
    p_platform_fee: platformFee,
  })

  if (escrowError) throw escrowError

  const { error: completeError } = await (supabase as any)
    .from('jobs')
    .update({
      status: 'COMPLETED',
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)

  if (completeError) throw completeError

  return job
}

export async function createJob(jobData: {
  title: string
  tasks: string[]
  urgency: 'LOW' | 'NORMAL' | 'HIGH'  // Changed to uppercase to match JobUrgency type
  address: string
  distance: number
  price: number
  platformFee?: number // Optional now, we calculate it server-side
}) {
  console.log('createJob server action called with:', jobData);
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('User not authenticated');
    throw new Error('Unauthorized')
  }

  try {
    console.log('Starting job creation process...');

    // 1. Fetch platform configuration
    const config = await getPlatformConfigInternal();
    const maxActive = parseInt(config['max_active_jobs'] || '4');
    const feePct = parseInt(config['platform_fee_pct'] || '15');

    // 2. Check active jobs limit
    const { count: activeCount, error: countError } = await (supabase as any)
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', user.id)
      .in('status', ['OPEN', 'IN_PROGRESS']);

    if (countError) throw new Error('Failed to verify active job limit');

    if (activeCount !== null && activeCount >= maxActive) {
      throw new Error(`BOOKING_LIMIT_REACHED:${maxActive}`);
    }

    // 3. Check user balance
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('money_balance, full_name')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      throw new Error('Failed to fetch profile')
    }
    
    const jobPrice = Math.round(Number(jobData.price));
    const feeAmount = Math.round(jobPrice * (feePct / 100));
    
    if (profile.money_balance < jobPrice) {
      throw new Error(`Insufficient balance. Required: $${jobPrice.toFixed(2)}, Available: $${profile.money_balance.toFixed(2)}`)
    }

    // 4. Deduct balance
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({ 
        money_balance: profile.money_balance - jobPrice 
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('Balance update error:', updateError)
      throw new Error('Failed to update balance')
    }

    const customerName = (profile as any).full_name;

    // 5. Create the job with locked-in fee data
    const { data, error } = await (supabase as any)
      .from('jobs')
      .insert([
        {
          customer_id: user.id,
          customer_name: customerName,
          urgency: jobData.urgency,
          location_address: jobData.address,
          distance: jobData.distance,
          price_amount: jobPrice,
          fee_pct: feePct,
          fee_amount: feeAmount,
          status: 'OPEN',
          tasks: jobData.tasks,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Create job error:', error)
      // Rollback balance if DB trigger fails (extra safety)
      await (supabase as any).from('profiles').update({ money_balance: profile.money_balance }).eq('id', user.id);
      throw error
    }

    // Notify the customer that the job is listed
    await (supabase as any).from('notifications').insert({
      user_id: user.id,
      type: 'JOB_CREATED',
      payload: { 
        job_id: data.id,
        location_address: jobData.address
      }
    });

    // Notify all admins about the new job
    const { data: admins } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (admins && admins.length > 0) {
      await (supabase as any)
        .from('notifications')
        .insert(admins.map((admin: any) => ({
          user_id: admin.id,
          type: 'JOB_UPDATED',
          payload: {
            job_id: data.id,
            action: 'CREATED',
            customer_name: customerName || 'A customer',
          }
        })))
    }
    
    console.log('Job created successfully with user address:', data)
    return data
  } catch (error) {
    console.error('Job creation failed:', error)
    throw error
  }
}

export async function getCustomerJobs(status?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let query = (supabase as any)
    .from('jobs')
    .select(`
      *,
      customer_profile:profiles!customer_id(id, full_name),
      worker_profile:profiles!worker_id(id, full_name)
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status as any)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function applyForJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Create application
  const { error: applyError } = await (supabase as any).from('job_applications').insert({
    job_id: jobId,
    employee_id: user.id,
    status: 'PENDING'
  });

  if (applyError) {
    if (applyError.code === '23505') throw new Error('You have already applied for this job');
    throw applyError;
  }

  // Get customer_id to notify them
  const { data: job } = await (supabase as any).from('jobs').select('customer_id').eq('id', jobId).single();
  if (job?.customer_id) {
    await (supabase as any).from('notifications').insert({
      user_id: job.customer_id,
      type: 'APPLICATION_RECEIVED',
      payload: {
        job_id: jobId,
        employee_id: user.id
      }
    });
  }
}

export async function getJobApplications(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await (supabase as any)
    .from('job_applications')
    .select('*, employee_profile:profiles!employee_id(id, full_name, rating)')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function handleApplication(applicationId: string, status: 'ACCEPTED' | 'REJECTED') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get application details first
  const { data: app, error: fetchError } = await (supabase as any)
    .from('job_applications')
    .select('*, job:jobs(id, customer_id)')
    .eq('id', applicationId)
    .single();

  if (fetchError || !app) throw new Error('Application not found');
  if (app.job.customer_id !== user.id) throw new Error('Unauthorized');

  if (status === 'REJECTED') {
    const { error } = await (supabase as any)
      .from('job_applications')
      .update({ status: 'REJECTED' })
      .eq('id', applicationId);
    if (error) throw error;

    // Notify applicant
    await (supabase as any).from('notifications').insert({
      user_id: app.employee_id,
      type: 'APPLICATION_REJECTED',
      payload: { job_id: app.job_id }
    });
  } else {
    // ACCEPTED logic
    // 1. Update this application
    const { error: updateAppError } = await (supabase as any)
      .from('job_applications')
      .update({ status: 'ACCEPTED' })
      .eq('id', applicationId);
    if (updateAppError) throw updateAppError;

    // 2. Reject all other pending applications for this job
    await (supabase as any)
      .from('job_applications')
      .update({ status: 'REJECTED' })
      .eq('job_id', app.job_id)
      .eq('status', 'PENDING')
      .neq('id', applicationId);

    // 3. Update the job
    const { data: workerProfile } = await (supabase as any).from('profiles').select('full_name').eq('id', app.employee_id).single();
    const { error: updateJobError } = await (supabase as any)
      .from('jobs')
      .update({
        worker_id: app.employee_id,
        worker_name: workerProfile?.full_name || 'Professional',
        status: 'IN_PROGRESS',
        updated_at: new Date().toISOString()
      })
      .eq('id', app.job_id);
    if (updateJobError) throw updateJobError;

    // 4. Notify everyone
    // Winner
    const { data: jobInfo } = await (supabase as any).from('jobs').select('location_address').eq('id', app.job_id).single();
    
    await (supabase as any).from('notifications').insert({
      user_id: app.employee_id,
      type: 'APPLICATION_ACCEPTED',
      payload: { 
        job_id: app.job_id,
        location_address: jobInfo?.location_address || 'a cleaning job'
      }
    });

    // Get others to notify of rejection
    const { data: others } = await (supabase as any)
      .from('job_applications')
      .select('employee_id')
      .eq('job_id', app.job_id)
      .eq('status', 'REJECTED')
      .neq('id', applicationId);

    if (others && others.length > 0) {
      await (supabase as any).from('notifications').insert(
        others.map((o: any) => ({
          user_id: o.employee_id,
          type: 'APPLICATION_REJECTED',
          payload: { job_id: app.job_id }
        }))
      );
    }
  }
}

export async function updateJobStatus(jobId: string, status: string, proofOfWork?: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const updateData: any = { status: status.toUpperCase() }
  if (proofOfWork) {
    updateData.proof_of_work = proofOfWork
  }

  const { data: jobDataBefore, error: fetchError } = await (supabase as any)
    .from('jobs')
    .select('customer_id, worker_id, status')
    .eq('id', jobId)
    .single()

  if (fetchError || !jobDataBefore) throw new Error('Job not found')

  const { error } = await (supabase as any)
    .from('jobs')
    .update(updateData)
    .eq('id', jobId)
    .or(`customer_id.eq.${user.id},worker_id.eq.${user.id}`)

  if (error) throw error

  // Notify the other party
  const otherUserId = user.id === jobDataBefore.customer_id ? jobDataBefore.worker_id : jobDataBefore.customer_id
  
  if (otherUserId) {
    const isCancelled = status.toUpperCase() === 'CANCELLED';
    await (supabase as any)
      .from('notifications')
      .insert({
        user_id: otherUserId,
        type: isCancelled ? 'JOB_CANCELLED' : 'JOB_UPDATED',
        payload: {
          job_id: jobId,
          old_status: jobDataBefore.status,
          new_status: status.toUpperCase(),
        }
      })
  }
}

export async function approveJobCompletion(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: job } = await (supabase as any)
    .from('jobs')
    .select('id, customer_id').eq('id', jobId).single()
  if (!job || job.customer_id !== user.id) throw new Error('Forbidden')

  await releaseEscrowAndCompleteJob(supabase, jobId)
}

export async function getNearbyJobs(lat: number, lng: number, radiusMeters = 50000) {
  const supabase = await createClient()
  const { data, error } = await (supabase as any).rpc('get_nearby_jobs', {
    lat,
    lng,
    radius_meters: radiusMeters,
  })
  if (error) throw error
  return data
}

export async function getAllOpenJobs() {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('jobs')
    .select(`
      *,
      customer_profile:profiles!customer_id(id, full_name),
      worker_profile:profiles!worker_id(id, full_name)
    `)
    .eq('status', 'OPEN')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getEmployeeJobs(status?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let query = (supabase as any)
    .from('jobs')
    .select(`
      *,
      customer_profile:profiles!customer_id(id, full_name),
      worker_profile:profiles!worker_id(id, full_name)
    `)
    .eq('worker_id', user.id)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status as any)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * ADMIN ACTIONS
 */
export async function getAllJobsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify Admin Role
  const { data: profile } = await (supabase as any).from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') throw new Error('Forbidden')

  const { data, error } = await (supabase as any)
    .from('jobs')
    .select('*, customer:profiles!customer_id(full_name), worker:profiles!worker_id(full_name)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function adminUpdateJobStatus(jobId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await verifyAdmin(supabase, user.id)

  const { data: jobBefore } = await (supabase as any)
    .from('jobs')
    .select('customer_id, worker_id, status')
    .eq('id', jobId)
    .single()

  const updateData: any = { status: status.toUpperCase() }

  const { error } = await (supabase as any)
    .from('jobs')
    .update(updateData)
    .eq('id', jobId)

  if (error) throw error

  // Notify parties
  if (jobBefore) {
    const isCancelled = status.toUpperCase() === 'CANCELLED';
    const notifications = [];
    
    if (jobBefore.customer_id) {
      notifications.push({
        user_id: jobBefore.customer_id,
        type: isCancelled ? 'JOB_CANCELLED' : 'JOB_UPDATED',
        payload: { 
          job_id: jobId, 
          action: 'ADMIN_UPDATE', 
          new_status: status.toUpperCase() 
        }
      });
    }
    
    if (jobBefore.worker_id) {
      notifications.push({
        user_id: jobBefore.worker_id,
        type: isCancelled ? 'JOB_CANCELLED' : 'JOB_UPDATED',
        payload: { 
          job_id: jobId, 
          action: 'ADMIN_UPDATE', 
          new_status: status.toUpperCase() 
        }
      });
    }
    
    if (notifications.length > 0) {
      await (supabase as any).from('notifications').insert(notifications);
    }
  }
}

export async function adminApproveJobCompletion(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await verifyAdmin(supabase, user.id)

  await releaseEscrowAndCompleteJob(supabase, jobId)
}
