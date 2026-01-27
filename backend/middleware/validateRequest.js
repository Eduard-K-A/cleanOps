const { sendError } = require('../lib/errors');

/**
 * Generic request validation middleware using Joi.
 * Uses standardized error shape: { success: false, error: string, code: number }.
 * @param {object} schema - Joi schema to validate against
 * @returns {function} Express middleware function
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details[0]?.message || 'Validation failed';
      return sendError(res, message, 400);
    }

    req.body = value;
    next();
  };
}

module.exports = validateRequest;
