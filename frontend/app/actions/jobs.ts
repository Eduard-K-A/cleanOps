'use server'
import { createClient } from '@/lib/supabase/server'
import { generateMockCoordinates } from '@/lib/mockLocations'

export async function createJob(jobData: {
  title: string
  tasks: string[]
  urgency: 'low' | 'normal' | 'high'
  address: string
  price: number
  platformFee: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  try {
    // Generate mock coordinates for the user's address
    const coordinates = generateMockCoordinates(jobData.address)
    console.log('Using user address:', jobData.address, 'with mock coordinates:', coordinates)

    // Hold escrow first - check balance
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('money_balance')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      throw new Error('Failed to fetch profile')
    }
    
    const profileData = profile as any
    console.log('User balance:', profileData.money_balance, 'Job price:', jobData.price)
    
    if (profileData.money_balance < jobData.price) {
      // For development, let's add balance if insufficient
      console.log('Insufficient balance, adding funds for development')
      const { error: addFundsError } = await (supabase as any)
        .from('profiles')
        .update({ 
          money_balance: jobData.price + 1000 // Add enough for job + buffer
        })
        .eq('id', user.id)
      
      if (addFundsError) {
        console.error('Failed to add funds:', addFundsError)
        throw new Error('Failed to add funds for development')
      }
    }

    // Get updated balance
    const { data: updatedProfile } = await (supabase as any)
      .from('profiles')
      .select('money_balance')
      .eq('id', user.id)
      .single()
    
    const updatedProfileData = updatedProfile as any
    console.log('Updated balance:', updatedProfileData.money_balance)

    // Deduct from balance
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({ 
        money_balance: updatedProfileData.money_balance - jobData.price 
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('Balance update error:', updateError)
      throw new Error('Failed to update balance')
    }

    // Create the job with user's address and mock coordinates
    const { data, error } = await (supabase as any)
      .from('jobs')
      .insert([
        {
          customer_id: user.id,
          urgency: jobData.urgency.toUpperCase() as 'LOW' | 'NORMAL' | 'HIGH',
          location_address: jobData.address,
          location_lat: coordinates.lat,
          location_lng: coordinates.lng,
          price_amount: jobData.price,
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
    
    console.log('Job created successfully with user address:', data)
    return data
  } catch (error: any) {
    console.error('Job creation failed:', error)
    throw error
  }
}

export async function claimJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await (supabase as any).rpc('claim_job', {
    p_job_id: jobId,
    p_employee_id: user.id,
  })

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

  const { error } = await (supabase as any)
    .from('jobs')
    .update(updateData)
    .eq('id', jobId)
    .or(`customer_id.eq.${user.id},worker_id.eq.${user.id}`)

  if (error) throw error
}

export async function approveJobCompletion(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: job } = await (supabase as any)
    .from('jobs')
    .select('*').eq('id', jobId).single()
  if (!job || (job as any).customer_id !== user.id) throw new Error('Forbidden')

  // Calculate payout (85% to employee, 15% platform fee)
  const platformFee = Math.round((job as any).price_amount * 0.15)
  const payout = (job as any).price_amount - platformFee

  // Release escrow to employee
  await (supabase as any).rpc('release_escrow', {
    p_job_id: jobId,
    p_employee_id: (job as any).worker_id,
    p_amount: (job as any).price_amount,
    p_platform_fee: platformFee,
  })

  const { error: completeError } = await (supabase as any)
    .from('jobs')
    .update({ status: 'COMPLETED' })
    .eq('id', jobId)
  if (completeError) throw completeError
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
