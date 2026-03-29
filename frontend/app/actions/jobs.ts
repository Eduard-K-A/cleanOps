'use server'
import { createClient } from '@/lib/supabase/server'

export async function createJob(jobData: {
  title: string
  tasks: string[]
  urgency: 'low' | 'normal' | 'high'
  address: string
  lat: number
  lng: number
  price: number
  platformFee: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Hold escrow first - check balance
  const { data: profile, error: profileError } = await supabase.from('profiles')
    .select('money_balance')
    .eq('id', user.id)
    .single()
  
  const profileData = profile as any
  if (profileError || !profileData || profileData.money_balance < jobData.price) {
    throw new Error('Insufficient balance')
  }

  // Deduct from balance
  // @ts-expect-error - Supabase SDK type limitation, runtime is valid
  const profileUpdate = supabase.from('profiles').update({ money_balance: profileData.money_balance - jobData.price })
  const { error: updateError } = await profileUpdate.eq('id', user.id)
  if (updateError) throw updateError

  // @ts-expect-error - Supabase SDK type limitation, runtime is valid
  const { data, error } = await supabase.from('jobs').insert([
    {
      customer_id: user.id,
      urgency: jobData.urgency.toUpperCase() as 'LOW' | 'NORMAL' | 'HIGH',
      location_address: jobData.address,
      location_lat: jobData.lat,
      location_lng: jobData.lng,
      price_amount: jobData.price,
      status: 'OPEN',
      tasks: jobData.tasks,
    },
  ]).select().single()

  if (error) {
    console.error('Create job error:', error)
    throw error
  }
  return data
}

export async function claimJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.rpc('claim_job', {
    p_job_id: jobId,
    p_employee_id: user.id,
  } as any)

  if (error) throw error
}

export async function updateJobStatus(jobId: string, status: string, proofOfWork?: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const updateData: Record<string, any> = { status: status.toUpperCase() }
  if (proofOfWork) {
    updateData.proof_of_work = proofOfWork
  }

  // @ts-expect-error - Supabase SDK type limitation, runtime is valid
  const jobUpdate = supabase.from('jobs').update(updateData)
  const { error } = await jobUpdate
    .eq('id', jobId)
    .or(`customer_id.eq.${user.id},worker_id.eq.${user.id}`)

  if (error) throw error
}

export async function approveJobCompletion(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: job } = await supabase.from('jobs')
    .select('*').eq('id', jobId).single()
  if (!job || (job as any).customer_id !== user.id) throw new Error('Forbidden')

  // Calculate payout (85% to employee, 15% platform fee)
  const platformFee = Math.round((job as any).price_amount * 0.15)
  const payout = (job as any).price_amount - platformFee

  // Release escrow to employee
  await supabase.rpc('release_escrow', {
    p_job_id: jobId,
    p_employee_id: (job as any).worker_id,
    p_amount: (job as any).price_amount,
    p_platform_fee: platformFee,
  } as any)

  // @ts-expect-error - Supabase SDK type limitation, runtime is valid
  const jobStatusUpdate = supabase.from('jobs').update({ status: 'COMPLETED' })
  const { error: completeError } = await jobStatusUpdate.eq('id', jobId)
  if (completeError) throw completeError
}

export async function getNearbyJobs(lat: number, lng: number, radiusMeters = 50000) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_nearby_jobs', {
    lat,
    lng,
    radius_meters: radiusMeters,
  } as any)
  if (error) throw error
  return data
}
