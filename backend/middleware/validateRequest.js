/**
 * Generic request validation middleware using Joi
 * @param {object} schema - Joi schema to validate against
 * @returns {function} Express middleware function
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: true, // Stop at first error
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      // Extract the first validation error message
      const errorMessage = error.details[0].message;
      return res.status(400).json({
        error: errorMessage
      });
    }

    // Replace req.body with validated value
    req.body = value;
    next();
  };
}

module.exports = validateRequest;
