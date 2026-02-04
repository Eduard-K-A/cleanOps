import { Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase';
import { getPlatformFeePercent } from '../config/payment';
import payment from '../config/payment';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { CreateJobRequest, UpdateJobStatusRequest, ClaimJobRequest, Job, ApiResponse } from '../types';

// NOTE: Until you generate/attach a typed Supabase `Database` definition,
// `@supabase/supabase-js` can infer table types as `never` in some setups.
// We cast here so controllers compile while still returning our app-level types.
const supabase = getSupabaseAdmin() as any;

type CreateJobBody = Omit<CreateJobRequest, 'customer_id'>;
type ClaimJobBody = Pick<ClaimJobRequest, 'job_id'>;
type UpdateJobStatusBody = Omit<UpdateJobStatusRequest, 'job_id'>;

/**
 * Create a new job with Stripe PaymentIntent (escrow)
 */
export async function createJob(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ job: Job; client_secret: string }>>
): Promise<void> {
  try {
    const userId = req.user!.id;
    const jobData = req.body as CreateJobBody;
    // use mock payment module

    // Verify customer has < 2 active jobs
    const { data: activeJobs, error: countError } = await supabase
      .from('jobs')
      .select('id')
      .eq('customer_id', userId)
      .in('status', ['OPEN', 'IN_PROGRESS']);

    if (countError) {
      throw new AppError('Failed to check active jobs', 500);
    }

    if (activeJobs && activeJobs.length >= 2) {
      throw new AppError('Customer cannot have more than 2 active jobs', 400, 400);
    }

    // Create Stripe PaymentIntent with manual capture (escrow)
    const paymentIntent = await payment.createPaymentIntent({
      amount: jobData.price_amount,
      currency: 'usd',
      capture_method: 'manual', // Hold funds until job completion
      metadata: {
        customer_id: userId,
        job_type: 'cleaning',
      },
    });
    console.log('Created paymentIntent (mock):', paymentIntent);

    // Create job in database. We store the user-provided address as `location_address`.
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        customer_id: userId,
        urgency: jobData.urgency,
        price_amount: jobData.price_amount,
        stripe_payment_intent_id: paymentIntent.id,
        location_address: (jobData as any).address,
        tasks: jobData.tasks,
        proof_of_work: [],
        status: 'OPEN',
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Job insert failed:', jobError);
      // Rollback: cancel payment intent if job creation fails
      await payment.cancelPaymentIntent(paymentIntent.id).catch(console.error);
      throw new AppError('Failed to create job', 500);
    }

    res.status(201).json({
      success: true,
      data: {
        job: job as Job,
        client_secret: paymentIntent.client_secret!,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('createJob error:', error);
    const msg = process.env.NODE_ENV === 'production'
      ? 'Failed to create job'
      : `Failed to create job: ${error instanceof Error ? error.message : String(error)}`;
    throw new AppError(msg, 500);
  }
}

/**
 * Get jobs (filtered by user role)
 */
export async function getJobs(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<Job[]>>
): Promise<void> {
  try {
    const userId = req.user!.id;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const role = req.user?.role;

    let query = supabase.from('jobs').select('*');

    // Customers see their own jobs
    // Employees see open jobs and their assigned jobs
    if (role === 'customer') {
      query = query.eq('customer_id', userId);
    } else if (role === 'employee') {
      query = query.or(`status.eq.OPEN,worker_id.eq.${userId}`);
    } else {
      // Default: show user's jobs
      query = query.or(`customer_id.eq.${userId},worker_id.eq.${userId}`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch jobs', 500);
    }

    res.json({
      success: true,
      data: jobs as Job[],
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch jobs', 500);
  }
}

/**
 * Get nearby open jobs for employees (sorted by proximity)
 */
export async function getJobFeed(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<Job[]>>
): Promise<void> {
  try {
    const userId = req.user!.id;

    // Debug: log request user
    try {
      console.debug('getJobFeed called', { userId });
    } catch (e) {
      // ignore logging errors
    }

    // Get employee's location
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('location_lat, location_lng, location_point')
      .eq('id', userId)
      .eq('role', 'employee')
      .single();

    // Debug: log profile fetch result
    try {
      console.debug('profile fetch result', { profile, profileError });
    } catch (e) {
      // ignore logging errors
    }

    if (profileError || !profile || !profile.location_point) {
      console.warn('getJobFeed: missing employee location', { userId, profile, profileError });
      throw new AppError('Employee location not set', 400);
    }

    // Get open jobs within 50km, ordered by distance
    const { data: jobs, error } = await supabase.rpc('get_nearby_jobs', {
      employee_location: profile.location_point,
      max_distance_meters: 50000, // 50km in meters
    });

    if (error) {
      // Fallback: get all open jobs if RPC fails
      const { data: fallbackJobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(50);

      res.json({
        success: true,
        data: (fallbackJobs || []) as Job[],
      });
      return;
    }

    res.json({
      success: true,
      data: (jobs || []) as Job[],
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch job feed', 500);
  }
}

/**
 * Claim a job (employee)
 */
export async function claimJob(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<Job>>
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { job_id } = req.body as ClaimJobBody;

    // Atomically claim: only succeed if still OPEN and unassigned
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        worker_id: userId,
        status: 'IN_PROGRESS',
      })
      .eq('id', job_id)
      .eq('status', 'OPEN')
      .is('worker_id', null)
      .select()
      .single();

    if (updateError || !updatedJob) {
      // If another worker claimed it first, Supabase returns no row (or an error depending on config).
      throw new AppError('Job not found or not available', 409);
    }

    // Create notification for customer
    await supabase.from('notifications').insert({
      user_id: updatedJob.customer_id,
      type: 'JOB_ASSIGNED',
      payload: {
        job_id: job_id,
        worker_id: userId,
      },
    });

    res.json({
      success: true,
      data: updatedJob as Job,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to claim job', 500);
  }
}

/**
 * Update job status (with proof of work)
 */
export async function updateJobStatus(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<Job>>
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { job_id } = req.params as { job_id: string };
    const { status, proof_of_work } = req.body as UpdateJobStatusBody;

    // Get current job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      throw new AppError('Job not found', 404);
    }

    // Verify user has permission (customer or assigned worker)
    if (job.customer_id !== userId && job.worker_id !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Prevent bypassing the approval/payout flow
    if (status === 'COMPLETED') {
      throw new AppError('Use /jobs/:job_id/approve to complete and pay out this job', 400);
    }

    // Only the assigned worker can submit proof for review
    if (status === 'PENDING_REVIEW' && job.worker_id !== userId) {
      throw new AppError('Only the assigned worker can submit work for review', 403);
    }

    const updateData: Partial<Job> = { status };

    if (proof_of_work && status === 'PENDING_REVIEW') {
      updateData.proof_of_work = proof_of_work;
    }

    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', job_id)
      .select()
      .single();

    if (updateError || !updatedJob) {
      throw new AppError('Failed to update job', 500);
    }

    res.json({
      success: true,
      data: updatedJob as Job,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update job', 500);
  }
}

/**
 * Approve job completion and process payout
 */
export async function approveJob(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<Job>>
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { job_id } = req.params;
    // use mock payment module

    // Get job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*, worker:profiles!worker_id(stripe_account_id)')
      .eq('id', job_id)
      .eq('customer_id', userId)
      .eq('status', 'PENDING_REVIEW')
      .single();

    if (jobError || !job) {
      throw new AppError('Job not found or not ready for approval', 404);
    }

    if (!job.stripe_payment_intent_id) {
      throw new AppError('Payment intent not found', 400);
    }

    // Capture the PaymentIntent (funds move to platform)
    const paymentIntent = await payment.capturePaymentIntent(job.stripe_payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
      throw new AppError('Payment capture failed', 500);
    }

    // Calculate payout amount (minus platform fee)
    const platformFeePercent = getPlatformFeePercent();
    const platformFee = Math.round((job.price_amount * platformFeePercent) / 100);
    const payoutAmount = job.price_amount - platformFee;

    // Get worker's Stripe account
    const workerJoin = (job as any).worker;
    const workerProfile = Array.isArray(workerJoin) ? workerJoin[0] : workerJoin;
    if (!workerProfile?.stripe_account_id) {
      throw new AppError('Worker Stripe account not connected', 400);
    }

    // Create transfer to worker's connected account
    const transfer = await payment.createTransfer({
      amount: payoutAmount,
      currency: 'usd',
      destination: workerProfile.stripe_account_id,
      metadata: {
        job_id: job_id,
        platform_fee: platformFee.toString(),
      },
    });

    // Update job status
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job_id)
      .select()
      .single();

    if (updateError || !updatedJob) {
      throw new AppError('Failed to update job status', 500);
    }

    // Create notifications
    await supabase.from('notifications').insert([
      {
        user_id: job.worker_id!,
        type: 'PAYMENT_RECEIVED',
        payload: {
          job_id: job_id,
          amount: payoutAmount,
          transfer_id: transfer.id,
        },
      },
      {
        user_id: userId,
        type: 'JOB_UPDATED',
        payload: {
          job_id: job_id,
          status: 'COMPLETED',
        },
      },
    ]);

    res.json({
      success: true,
      data: updatedJob as Job,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to approve job', 500);
  }
}
