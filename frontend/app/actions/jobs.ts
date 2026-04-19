'use server'
import { createClient } from '@/lib/supabase/server'
import { JobStatus } from '@/types'

export async function createJob(jobData: {
  title: string
  tasks: string[]
  urgency: 'LOW' | 'NORMAL' | 'HIGH'  // Changed to uppercase to match JobUrgency type
  address: string
  distance: number
  price: number
  platformFee: number
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
    console.log('Using user address:', jobData.address, 'with distance:', jobData.distance);

    // Hold escrow first - check balance
    console.log('Checking user balance...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('money_balance')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      throw new Error('Failed to fetch profile')
    }
    
    // Ensure price is a number and round it to avoid integer syntax errors in DB
    const jobPrice = Math.round(Number(jobData.price));
    console.log('User balance:', profile.money_balance, 'Job price (rounded):', jobPrice)
    
    if (profile.money_balance < jobPrice) {
      throw new Error(`Insufficient balance. Required: $${jobPrice.toFixed(2)}, Available: $${profile.money_balance.toFixed(2)}`)
    }

    // Deduct from balance using dollars directly
    const { error: updateError } = await supabase
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

    // Create the job with dollars directly
    console.log('Creating job in database...');
    const { data, error } = await supabase
      .from('jobs')
      .insert([
        {
          customer_id: user.id,
          customer_name: customerName,
          urgency: jobData.urgency, // Already uppercase (LOW, NORMAL, HIGH)
          location_address: jobData.address,
          distance: jobData.distance,
          price_amount: jobPrice,
          status: 'OPEN',
          tasks: jobData.tasks,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Create job error:', error)
      throw error
    }

    // Notify all admins about the new job
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (admins && admins.length > 0) {
      await supabase
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

  let query = supabase
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

export async function claimJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.rpc('claim_job', {
    p_job_id: jobId,
    p_employee_id: user.id,
  })

  if (error) throw error
}

export async function updateJobStatus(jobId: string, status: string, proofOfWork?: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const updateData: any = { status: status.toUpperCase() }
  if (proofOfWork) {
    updateData.proof_of_work = proofOfWork
  }

  const { data: jobDataBefore, error: fetchError } = await supabase
    .from('jobs')
    .select('customer_id, worker_id, status')
    .eq('id', jobId)
    .single()

  if (fetchError || !jobDataBefore) throw new Error('Job not found')

  const { error } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', jobId)
    .or(`customer_id.eq.${user.id},worker_id.eq.${user.id}`)

  if (error) throw error

  // Notify the other party
  const otherUserId = user.id === jobDataBefore.customer_id ? jobDataBefore.worker_id : jobDataBefore.customer_id
  if (otherUserId) {
    await supabase
      .from('notifications')
      .insert({
        user_id: otherUserId,
        type: 'JOB_UPDATED',
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

  const { data: job } = await supabase
    .from('jobs')
    .select('*').eq('id', jobId).single()
  if (!job || job.customer_id !== user.id) throw new Error('Forbidden')

  // Calculate payout (85% to employee, 15% platform fee)
  const platformFee = Math.round(job.price_amount * 0.15)
  // const payout = job.price_amount - platformFee // payout is unused

  // Release escrow to employee
  if (!job.worker_id) throw new Error('Job has no worker assigned');
  
  await supabase.rpc('release_escrow', {
    p_job_id: jobId,
    p_employee_id: job.worker_id,
    p_amount: job.price_amount,
    p_platform_fee: platformFee,
  })

  const { error: completeError } = await supabase
    .from('jobs')
    .update({ status: 'COMPLETED' })
    .eq('id', jobId)
  if (completeError) throw completeError
}

export async function getNearbyJobs(lat: number, lng: number, radiusMeters = 50000) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_nearby_jobs', {
    lat,
    lng,
    radius_meters: radiusMeters,
  })
  if (error) throw error
  return data
}

export async function getAllOpenJobs() {
  const supabase = await createClient()
  const { data, error } = await supabase
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

  let query = supabase
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
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') throw new Error('Forbidden')

  const { data, error } = await supabase
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

  // Verify Admin Role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') throw new Error('Forbidden')

  const updateData: any = { status: status.toUpperCase() }

  const { error } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', jobId)

  if (error) throw error
}
