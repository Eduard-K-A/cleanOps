import { Router } from 'express';
import { z } from 'zod';
import { verifyAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createJob,
  getJobs,
  getJobFeed,
  claimJob,
  updateJobStatus,
  approveJob,
} from '../controllers/jobController';

const router = Router();

// All routes require authentication
router.use(verifyAuth);

// Create job (customer only)
router.post(
  '/',
  requireRole('customer'),
  validate({
    body: z.object({
      urgency: z.enum(['LOW', 'NORMAL', 'HIGH']),
      price_amount: z.number().int().positive(),
      location_coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().min(1),
      }),
      tasks: z.array(
        z.object({
          id: z.string(),
          name: z.string().min(1),
          description: z.string().optional(),
        })
      ).min(1),
    }),
  }),
  asyncHandler(createJob as any)
);

// Get jobs (filtered by role)
router.get('/', asyncHandler(getJobs as any));

// Get job feed for employees (sorted by proximity)
router.get('/feed', requireRole('employee'), asyncHandler(getJobFeed as any));

// Claim a job (employee)
router.post(
  '/claim',
  requireRole('employee'),
  validate({
    body: z.object({
      job_id: z.string().uuid(),
    }),
  }),
  asyncHandler(claimJob as any)
);

// Update job status
router.patch(
  '/:job_id/status',
  validate({
    params: z.object({
      job_id: z.string().uuid(),
    }),
    body: z.object({
      status: z.enum(['OPEN', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED', 'CANCELLED']),
      proof_of_work: z.array(z.string().url()).optional(),
    }),
  }),
  asyncHandler(updateJobStatus as any)
);

// Approve job completion (customer only)
router.post(
  '/:job_id/approve',
  requireRole('customer'),
  validate({
    params: z.object({
      job_id: z.string().uuid(),
    }),
  }),
  asyncHandler(approveJob as any)
);

export default router;
