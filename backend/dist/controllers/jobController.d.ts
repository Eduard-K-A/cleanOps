import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Job, ApiResponse } from '../types';
/**
 * Create a new job with Stripe PaymentIntent (escrow)
 */
export declare function createJob(req: AuthenticatedRequest, res: Response<ApiResponse<{
    job: Job;
    client_secret: string;
}>>): Promise<void>;
/**
 * Get jobs (filtered by user role)
 */
export declare function getJobs(req: AuthenticatedRequest, res: Response<ApiResponse<Job[]>>): Promise<void>;
/**
 * Get single job by id
 */
export declare function getJob(req: AuthenticatedRequest, res: Response<ApiResponse<Job>>): Promise<void>;
/**
 * Get open jobs for employees.
 *
 * Requirement: the employee feed must display **every available job**
 * (i.e. all OPEN jobs) regardless of the employee's location.
 * We therefore no longer filter by distance; we simply return all
 * OPEN jobs, ordered by recency. Any future proximity UX should be
 * implemented client‑side (e.g. sort) without hiding jobs server‑side.
 */
export declare function getJobFeed(_req: AuthenticatedRequest, res: Response<ApiResponse<Job[]>>): Promise<void>;
/**
 * Claim a job (employee)
 */
export declare function claimJob(req: AuthenticatedRequest, res: Response<ApiResponse<Job>>): Promise<void>;
/**
 * Update job status (with proof of work)
 */
export declare function updateJobStatus(req: AuthenticatedRequest, res: Response<ApiResponse<Job>>): Promise<void>;
/**
 * Approve job completion and process payout
 */
export declare function approveJob(req: AuthenticatedRequest, res: Response<ApiResponse<Job>>): Promise<void>;
//# sourceMappingURL=jobController.d.ts.map