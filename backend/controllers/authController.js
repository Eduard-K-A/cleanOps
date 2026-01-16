const userModel = require('../models/userModel');

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { username, password, email } = req.body;

    // Check if user already exists by username
    const existingByUsername = userModel.findByUsername(username);
    if (existingByUsername) {
      return res.status(409).json({
        error: 'Username already exists'
      });
    }

    // Check if user already exists by email
    const existingByEmail = userModel.findByEmail(email);
    if (existingByEmail) {
      return res.status(409).json({
        error: 'Email already exists'
      });
    }

    // Create the user
    const newUser = await userModel.create({
      username,
      password,
      email
    });

    // Return success response with user data
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

module.exports = {
  register
};
