"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJob = createJob;
exports.getJobs = getJobs;
exports.getJob = getJob;
exports.getJobFeed = getJobFeed;
exports.claimJob = claimJob;
exports.updateJobStatus = updateJobStatus;
exports.approveJob = approveJob;
const supabase_1 = require("../config/supabase");
const payment_1 = require("../config/payment");
const payment_2 = __importDefault(require("../config/payment"));
const errorHandler_1 = require("../middleware/errorHandler");
const cache_1 = require("../utils/cache");
// cache TTLs (milliseconds)
const FEED_CACHE_TTL = 10 * 1000; // 10 seconds
const JOBS_CACHE_TTL = 2 * 60 * 1000; // 2 minutes (matches frontend)
// NOTE: Until you generate/attach a typed Supabase `Database` definition,
// `@supabase/supabase-js` can infer table types as `never` in some setups.
// We cast here so controllers compile while still returning our app-level types.
const supabase = (0, supabase_1.getSupabaseAdmin)();
/**
 * Create a new job with Stripe PaymentIntent (escrow)
 */
async function createJob(req, res) {
    // Invalidate cached feed since a new OPEN job has been added
    (0, cache_1.clearCache)();
    try {
        const userId = req.user.id;
        const jobData = req.body;
        // use mock payment module
        // Verify customer has < 2 active jobs
        const { data: activeJobs, error: countError } = await supabase
            .from('jobs')
            .select('id')
            .eq('customer_id', userId)
            .in('status', ['OPEN', 'IN_PROGRESS']);
        if (countError) {
            throw new errorHandler_1.AppError('Failed to check active jobs', 500);
        }
        if (activeJobs && activeJobs.length >= 2) {
            throw new errorHandler_1.AppError('Customer cannot have more than 2 active jobs', 400, 400);
        }
        // Create Stripe PaymentIntent with manual capture (escrow)
        const paymentIntent = await payment_2.default.createPaymentIntent({
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
            location_address: jobData.address,
            tasks: jobData.tasks,
            proof_of_work: [],
            status: 'OPEN',
        })
            .select()
            .single();
        if (jobError || !job) {
            console.error('Job insert failed:', jobError);
            // Rollback: cancel payment intent if job creation fails
            await payment_2.default.cancelPaymentIntent(paymentIntent.id).catch(console.error);
            throw new errorHandler_1.AppError('Failed to create job', 500);
        }
        res.status(201).json({
            success: true,
            data: {
                job: job,
                client_secret: paymentIntent.client_secret,
            },
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        console.error('createJob error:', error);
        const msg = process.env.NODE_ENV === 'production'
            ? 'Failed to create job'
            : `Failed to create job: ${error instanceof Error ? error.message : String(error)}`;
        throw new errorHandler_1.AppError(msg, 500);
    }
}
/**
 * Get jobs (filtered by user role)
 */
async function getJobs(req, res) {
    try {
        const userId = req.user.id;
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const role = req.user?.role;
        // build a cache key so that each user/role/status combination is stored separately
        const cacheKey = `jobs:${userId}:${role || 'none'}:${status || 'all'}`;
        const cached = (0, cache_1.getCached)(cacheKey);
        if (cached) {
            res.json({ success: true, data: cached });
            return;
        }
        let query = supabase.from('jobs').select('*');
        // Customers see their own jobs
        // Employees see open jobs and their assigned jobs
        if (role === 'customer') {
            query = query.eq('customer_id', userId);
        }
        else if (role === 'employee') {
            query = query.or(`status.eq.OPEN,worker_id.eq.${userId}`);
        }
        else {
            // Default: show user's jobs
            query = query.or(`customer_id.eq.${userId},worker_id.eq.${userId}`);
        }
        if (status) {
            query = query.eq('status', status);
        }
        const { data: jobs, error } = await query.order('created_at', { ascending: false });
        if (error) {
            throw new errorHandler_1.AppError('Failed to fetch jobs', 500);
        }
        const result = (jobs || []);
        (0, cache_1.setCache)(cacheKey, result, JOBS_CACHE_TTL);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        throw new errorHandler_1.AppError('Failed to fetch jobs', 500);
    }
}
/**
 * Get single job by id
 */
async function getJob(req, res) {
    try {
        const userId = req.user.id;
        const { job_id } = req.params;
        // Debug: log incoming request
        console.debug('getJob called', { userId, job_id });
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', job_id)
            .single();
        if (jobError || !job) {
            console.warn('getJob: job not found', { job_id, jobError });
            throw new errorHandler_1.AppError('Job not found', 404);
        }
        // Optionally enforce visibility rules: customers see own jobs, employees see open/assigned
        const role = req.user?.role;
        if (role === 'customer' && job.customer_id !== userId) {
            throw new errorHandler_1.AppError('Unauthorized', 403);
        }
        res.json({
            success: true,
            data: job,
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        console.error('getJob error:', error);
        throw new errorHandler_1.AppError('Failed to fetch job', 500);
    }
}
/**
 * Get open jobs for employees.
 *
 * Requirement: the employee feed must display **every available job**
 * (i.e. all OPEN jobs) regardless of the employee's location.
 * We therefore no longer filter by distance; we simply return all
 * OPEN jobs, ordered by recency. Any future proximity UX should be
 * implemented client‑side (e.g. sort) without hiding jobs server‑side.
 */
async function getJobFeed(_req, res) {
    try {
        const cacheKey = 'feed:openJobs';
        const cached = (0, cache_1.getCached)(cacheKey);
        if (cached) {
            res.json({ success: true, data: cached });
            return;
        }
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('status', 'OPEN')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('getJobFeed error:', error);
            throw new errorHandler_1.AppError('Failed to fetch job feed', 500);
        }
        const result = (jobs || []);
        (0, cache_1.setCache)(cacheKey, result, FEED_CACHE_TTL);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        throw new errorHandler_1.AppError('Failed to fetch job feed', 500);
    }
}
/**
 * Claim a job (employee)
 */
async function claimJob(req, res) {
    // any change that affects open jobs should invalidate feed cache
    (0, cache_1.clearCache)();
    try {
        const userId = req.user.id;
        const { job_id } = req.body;
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
            throw new errorHandler_1.AppError('Job not found or not available', 409);
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
            data: updatedJob,
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        throw new errorHandler_1.AppError('Failed to claim job', 500);
    }
}
/**
 * Update job status (with proof of work)
 */
async function updateJobStatus(req, res) {
    // status updates may change which jobs are considered "open" so clear feed
    (0, cache_1.clearCache)();
    try {
        const userId = req.user.id;
        const { job_id } = req.params;
        const { status, proof_of_work } = req.body;
        // Get current job
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', job_id)
            .single();
        if (jobError || !job) {
            throw new errorHandler_1.AppError('Job not found', 404);
        }
        // Verify user has permission (customer or assigned worker)
        if (job.customer_id !== userId && job.worker_id !== userId) {
            throw new errorHandler_1.AppError('Unauthorized', 403);
        }
        // Prevent bypassing the approval/payout flow
        if (status === 'COMPLETED') {
            throw new errorHandler_1.AppError('Use /jobs/:job_id/approve to complete and pay out this job', 400);
        }
        // Only the assigned worker can submit proof for review
        if (status === 'PENDING_REVIEW' && job.worker_id !== userId) {
            throw new errorHandler_1.AppError('Only the assigned worker can submit work for review', 403);
        }
        const updateData = { status };
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
            throw new errorHandler_1.AppError('Failed to update job', 500);
        }
        res.json({
            success: true,
            data: updatedJob,
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        throw new errorHandler_1.AppError('Failed to update job', 500);
    }
}
/**
 * Approve job completion and process payout
 */
async function approveJob(req, res) {
    // once a job is completed and removed from the open set, invalidate caches
    (0, cache_1.clearCache)();
    try {
        const userId = req.user.id;
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
            throw new errorHandler_1.AppError('Job not found or not ready for approval', 404);
        }
        if (!job.stripe_payment_intent_id) {
            throw new errorHandler_1.AppError('Payment intent not found', 400);
        }
        // Capture the PaymentIntent (funds move to platform)
        const paymentIntent = await payment_2.default.capturePaymentIntent(job.stripe_payment_intent_id);
        if (paymentIntent.status !== 'succeeded') {
            throw new errorHandler_1.AppError('Payment capture failed', 500);
        }
        // Calculate payout amount (minus platform fee)
        const platformFeePercent = (0, payment_1.getPlatformFeePercent)();
        const platformFee = Math.round((job.price_amount * platformFeePercent) / 100);
        const payoutAmount = job.price_amount - platformFee;
        // Get worker's Stripe account
        const workerJoin = job.worker;
        const workerProfile = Array.isArray(workerJoin) ? workerJoin[0] : workerJoin;
        if (!workerProfile?.stripe_account_id) {
            throw new errorHandler_1.AppError('Worker Stripe account not connected', 400);
        }
        // Create transfer to worker's connected account
        const transfer = await payment_2.default.createTransfer({
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
            throw new errorHandler_1.AppError('Failed to update job status', 500);
        }
        // Create notifications
        await supabase.from('notifications').insert([
            {
                user_id: job.worker_id,
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
            data: updatedJob,
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        throw new errorHandler_1.AppError('Failed to approve job', 500);
    }
}
//# sourceMappingURL=jobController.js.map