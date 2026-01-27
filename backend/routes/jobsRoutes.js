const express = require('express');
const Joi = require('joi');
const { requireAuth } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const {
  createJob,
  listJobs,
  getJob,
  claimJob,
  submitProof,
  approveJob,
} = require('../controllers/jobsController');

const router = express.Router();

const createJobSchema = Joi.object({
  size: Joi.string().max(100).allow('').optional(),
  location_lat: Joi.number().min(-90).max(90).required(),
  location_lng: Joi.number().min(-180).max(180).required(),
  urgency: Joi.string().valid('LOW', 'NORMAL', 'HIGH').default('NORMAL'),
  tasks: Joi.array().items(Joi.string().max(500)).default([]),
  price_amount: Joi.number().integer().min(100).required(),
});

const proofSchema = Joi.object({
  proof_of_work: Joi.array().items(Joi.string().uri()).required(),
});

router.post('/', requireAuth, validateRequest(createJobSchema), createJob);
router.get('/', requireAuth, listJobs);
router.get('/:id', requireAuth, getJob);
router.patch('/:id/claim', requireAuth, claimJob);
router.patch('/:id/proof', requireAuth, validateRequest(proofSchema), submitProof);
router.patch('/:id/approve', requireAuth, approveJob);

module.exports = router;
