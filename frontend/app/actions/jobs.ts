'use server'
import { createClient } from '@/lib/supabase/server'
import { generateMockCoordinates } from '@/lib/mockLocations'

export async function createJob(jobData: {
  title: string
  tasks: string[]
  urgency: 'LOW' | 'NORMAL' | 'HIGH'  // Changed to uppercase to match JobUrgency type
  address: string
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
    
    // Generate mock coordinates for the user's address
    const coordinates = generateMockCoordinates(jobData.address)
    console.log('Using user address:', jobData.address, 'with mock coordinates:', coordinates)

    // Hold escrow first - check balance
    console.log('Checking user balance...');
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('money_balance')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      throw new Error('Failed to fetch profile')
    }
    
    const profileData = profile as any
    console.log('User balance:', profileData.money_balance, 'Job price:', jobData.price)
    
    // Convert price to decimal format for comparison with money_balance
    const priceAsDecimal = Number(jobData.price) / 100 // Convert cents to dollars
    console.log('Price as decimal:', priceAsDecimal)
    
    if (profileData.money_balance < priceAsDecimal) {
      // For development, let's add balance if insufficient
      console.log('Insufficient balance, adding funds for development')
      const { error: addFundsError } = await (supabase as any)
        .from('profiles')
        .update({ 
          money_balance: priceAsDecimal + 1000 // Add enough for job + buffer
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

    // Deduct from balance using decimal format
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({ 
        money_balance: updatedProfileData.money_balance - priceAsDecimal 
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('Balance update error:', updateError)
      throw new Error('Failed to update balance')
    }

    // Create the job with user's address and mock coordinates
    console.log('Creating job in database...');
    const { data, error } = await (supabase as any)
      .from('jobs')
      .insert([
        {
          customer_id: user.id,
          urgency: jobData.urgency, // Already uppercase (LOW, NORMAL, HIGH)
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

export async function getCustomerJobs(status?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let query = supabase
    .from('jobs')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data
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
