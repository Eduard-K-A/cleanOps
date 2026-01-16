const express = require('express');
const Joi = require('joi');
const authController = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

/**
 * Joi schema for registration validation
 */
const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username must not exceed 30 characters',
      'any.required': 'Username is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    })
});

/**
 * Joi schema for login validation
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validateRequest(registerSchema), authController.register);

/**
 * POST /api/auth/login
 * Login a user
 */
router.post('/login', validateRequest(loginSchema), authController.login);

/**
 * GET /api/auth/users
 * Get all registered users (Admin/Debug route)
 * Returns users without password field for security
 */
router.get('/users', authController.getUsers);

module.exports = router;
