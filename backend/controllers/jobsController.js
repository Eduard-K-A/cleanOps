const { supabaseAdmin } = require('../lib/supabase');
const { stripe } = require('../lib/stripe');
const { sendError } = require('../lib/errors');
const { ensureProfile } = require('../lib/profiles');

const FEE_PERCENT = Number(process.env.STRIPE_CONNECT_PLATFORM_FEE_PERCENT) || 15;

function sanitize(s) {
  if (typeof s !== 'string') return '';
  return s.trim().replace(/[<>]/g, '');
}

/**
 * POST /api/jobs — Create job with Stripe PaymentIntent (escrow).
 * Body: { size, location_lat, location_lng, urgency, tasks, price_amount }
 * Validation: customer has < 2 active jobs.
 */
async function createJob(req, res) {
  try {
    const { id: userId } = req.user;
    await ensureProfile(userId, 'customer');

    const { size, location_lat, location_lng, urgency, tasks, price_amount } = req.body;
    const lat = Number(location_lat);
    const lng = Number(location_lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return sendError(res, 'Invalid location coordinates', 400);
    }
    if (!Number.isInteger(price_amount) || price_amount < 100) {
      return sendError(res, 'price_amount must be at least 100 (cents)', 400);
    }

    const { count, error: countErr } = await supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', userId)
      .in('status', ['OPEN', 'IN_PROGRESS']);

    if (countErr) return sendError(res, 'Database error', 500);
    if (count >= 2) return sendError(res, 'You cannot have more than 2 active jobs', 400);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: price_amount,
      currency: 'usd',
      capture_method: 'manual',
      metadata: { type: 'cleanops_job', customer_id: userId },
    });

    const tasksSanitized = (Array.isArray(tasks) ? tasks : []).map((t) => sanitize(String(t))).filter(Boolean);
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .insert({
        customer_id: userId,
        status: 'OPEN',
        urgency: (['LOW', 'NORMAL', 'HIGH'].includes(urgency) ? urgency : 'NORMAL'),
        price_amount,
        stripe_payment_intent_id: paymentIntent.id,
        location_lat: lat,
        location_lng: lng,
        tasks: tasksSanitized,
        proof_of_work: [],
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23514' || error.message?.includes('active jobs')) {
        return sendError(res, 'You cannot have more than 2 active jobs', 400);
      }
      return sendError(res, error.message || 'Failed to create job', 500);
    }

    res.status(201).json({
      success: true,
      job,
      client_secret: paymentIntent.client_secret,
    });
  } catch (e) {
    console.error('createJob', e);
    return sendError(res, e.message || 'Failed to create job', 500);
  }
}

/**
 * GET /api/jobs — List jobs. Customer: own jobs. Employee: OPEN jobs by proximity.
 */
async function listJobs(req, res) {
  try {
    const { id: userId } = req.user;
    const feed = req.query.feed === 'employee' || req.query.role === 'employee';

    if (!feed) {
      await ensureProfile(userId, 'customer');
      const { data, error } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });
      if (error) return sendError(res, 'Failed to fetch jobs', 500);
      return res.json({ success: true, jobs: data || [] });
    }

    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      const { data, error } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false });
      if (error) return sendError(res, 'Failed to fetch jobs', 500);
      return res.json({ success: true, jobs: data || [] });
    }

    const { data, error } = await supabaseAdmin.rpc('nearby_open_jobs', { lat, lng, radius_km: 50 });
    if (error) {
      const { data: fallback, error: e2 } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false });
      if (e2) return sendError(res, 'Failed to fetch jobs', 500);
      return res.json({ success: true, jobs: fallback || [] });
    }
    return res.json({ success: true, jobs: data || [] });
  } catch (e) {
    console.error('listJobs', e);
    return sendError(res, 'Failed to list jobs', 500);
  }
}

/**
 * GET /api/jobs/:id — Get single job.
 */
async function getJob(req, res) {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const { data: job, error } = await supabaseAdmin.from('jobs').select('*').eq('id', id).single();
    if (error || !job) return sendError(res, 'Job not found', 404);
    if (job.customer_id !== userId && job.worker_id !== userId && job.status !== 'OPEN') {
      return sendError(res, 'Forbidden', 403);
    }
    return res.json({ success: true, job });
  } catch (e) {
    console.error('getJob', e);
    return sendError(res, 'Failed to fetch job', 500);
  }
}

/**
 * PATCH /api/jobs/:id/claim — Employee claims job.
 */
async function claimJob(req, res) {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;
    await ensureProfile(userId, 'employee');

    const { data: job, error: fetchErr } = await supabaseAdmin.from('jobs').select('*').eq('id', id).single();
    if (fetchErr || !job) return sendError(res, 'Job not found', 404);
    if (job.status !== 'OPEN') return sendError(res, 'Job is no longer available', 400);
    if (job.worker_id) return sendError(res, 'Job already claimed', 400);

    const { data: profile } = await supabaseAdmin.from('profiles').select('stripe_account_id').eq('id', userId).single();
    if (!profile?.stripe_account_id) return sendError(res, 'Connect your Stripe account before claiming jobs', 400);

    const { data: updated, error } = await supabaseAdmin
      .from('jobs')
      .update({ worker_id: userId, status: 'IN_PROGRESS' })
      .eq('id', id)
      .select()
      .single();

    if (error) return sendError(res, error.message || 'Failed to claim job', 500);

    const io = req.app.get('io');
    if (io) io.to(`job_${id}`).emit('status_update', { jobId: id, status: 'IN_PROGRESS', worker_id: userId });

    return res.json({ success: true, job: updated });
  } catch (e) {
    console.error('claimJob', e);
    return sendError(res, 'Failed to claim job', 500);
  }
}

/**
 * PATCH /api/jobs/:id/proof — Employee submits proof-of-work URLs.
 * Body: { proof_of_work: string[] }
 */
async function submitProof(req, res) {
  try {
    const { id } = req.params;
    const { proof_of_work } = req.body;
    const { id: userId } = req.user;

    const urls = Array.isArray(proof_of_work) ? proof_of_work.filter((u) => typeof u === 'string' && /^https?:\/\//.test(u)) : [];
    const { data: job, error: fetchErr } = await supabaseAdmin.from('jobs').select('*').eq('id', id).single();
    if (fetchErr || !job) return sendError(res, 'Job not found', 404);
    if (job.worker_id !== userId) return sendError(res, 'Forbidden', 403);
    if (job.status !== 'IN_PROGRESS') return sendError(res, 'Job is not in progress', 400);

    const { data: updated, error } = await supabaseAdmin
      .from('jobs')
      .update({ proof_of_work: urls, status: 'PENDING_REVIEW' })
      .eq('id', id)
      .select()
      .single();

    if (error) return sendError(res, error.message || 'Failed to submit proof', 500);

    const io = req.app.get('io');
    if (io) io.to(`job_${id}`).emit('status_update', { jobId: id, status: 'PENDING_REVIEW' });

    return res.json({ success: true, job: updated });
  } catch (e) {
    console.error('submitProof', e);
    return sendError(res, 'Failed to submit proof', 500);
  }
}

/**
 * PATCH /api/jobs/:id/approve — Customer approves; capture PaymentIntent, transfer to worker, mark COMPLETED.
 */
async function approveJob(req, res) {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const { data: job, error: fetchErr } = await supabaseAdmin.from('jobs').select('*').eq('id', id).single();
    if (fetchErr || !job) return sendError(res, 'Job not found', 404);
    if (job.customer_id !== userId) return sendError(res, 'Forbidden', 403);
    if (job.status !== 'PENDING_REVIEW') return sendError(res, 'Job is not pending approval', 400);
    if (!job.stripe_payment_intent_id || !job.worker_id) return sendError(res, 'Invalid job state', 400);

    const { data: workerProfile } = await supabaseAdmin.from('profiles').select('stripe_account_id').eq('id', job.worker_id).single();
    const destAccount = workerProfile?.stripe_account_id;
    if (!destAccount) return sendError(res, 'Worker Stripe account not found', 400);

    const pi = await stripe.paymentIntents.capture(job.stripe_payment_intent_id);
    const chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge?.id;
    if (!chargeId) return sendError(res, 'Could not retrieve charge after capture', 500);

    const feeAmount = Math.round((job.price_amount * FEE_PERCENT) / 100);
    const transferAmount = job.price_amount - feeAmount;
    await stripe.transfers.create({
      amount: transferAmount,
      currency: 'usd',
      destination: destAccount,
      source_transaction: chargeId,
    });

    const { data: updated, error } = await supabaseAdmin
      .from('jobs')
      .update({ status: 'COMPLETED' })
      .eq('id', id)
      .select()
      .single();

    if (error) return sendError(res, error.message || 'Failed to complete job', 500);

    const io = req.app.get('io');
    if (io) io.to(`job_${id}`).emit('status_update', { jobId: id, status: 'COMPLETED' });

    return res.json({ success: true, job: updated });
  } catch (e) {
    console.error('approveJob', e);
    return sendError(res, e.message || 'Failed to approve job', 500);
  }
}

module.exports = {
  createJob,
  listJobs,
  getJob,
  claimJob,
  submitProof,
  approveJob,
};
