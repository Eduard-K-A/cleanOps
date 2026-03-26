"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const asyncHandler_1 = require("../utils/asyncHandler");
const jobController_1 = require("../controllers/jobController");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.verifyAuth);
// Create job (customer only)
router.post('/', (0, auth_1.requireRole)('customer'), (0, validate_1.validate)({
    body: zod_1.z.object({
        urgency: zod_1.z.enum(['LOW', 'NORMAL', 'HIGH']),
        price_amount: zod_1.z.number().int().positive(),
        address: zod_1.z.string().min(1),
        tasks: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string().min(1),
            description: zod_1.z.string().optional(),
        })).min(1),
    }),
}), (0, asyncHandler_1.asyncHandler)(jobController_1.createJob));
// Get jobs (filtered by role)
router.get('/', (0, asyncHandler_1.asyncHandler)(jobController_1.getJobs));
// Get job feed for employees (sorted by proximity)
router.get('/feed', (0, auth_1.requireRole)('employee'), (0, asyncHandler_1.asyncHandler)(jobController_1.getJobFeed)); // no api/jobs/feed route in backend yet
// Get single job by id
router.get('/:job_id', (0, validate_1.validate)({
    params: zod_1.z.object({
        job_id: zod_1.z.string().uuid(),
    }),
}), (0, asyncHandler_1.asyncHandler)(jobController_1.getJob));
// Claim a job (employee)
router.post('/claim', (0, auth_1.requireRole)('employee'), (0, validate_1.validate)({
    body: zod_1.z.object({
        job_id: zod_1.z.string().uuid(),
    }),
}), (0, asyncHandler_1.asyncHandler)(jobController_1.claimJob));
// Update job status
router.patch('/:job_id/status', (0, validate_1.validate)({
    params: zod_1.z.object({
        job_id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum(['OPEN', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED', 'CANCELLED']),
        proof_of_work: zod_1.z.array(zod_1.z.string().url()).optional(),
    }),
}), (0, asyncHandler_1.asyncHandler)(jobController_1.updateJobStatus));
// Approve job completion (customer only)
router.post('/:job_id/approve', (0, auth_1.requireRole)('customer'), (0, validate_1.validate)({
    params: zod_1.z.object({
        job_id: zod_1.z.string().uuid(),
    }),
}), (0, asyncHandler_1.asyncHandler)(jobController_1.approveJob));
exports.default = router;
//# sourceMappingURL=jobs.js.map