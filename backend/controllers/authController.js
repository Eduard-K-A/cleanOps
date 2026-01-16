const userModel = require('../models/userModel');
const bcryptjs = require('bcryptjs');

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

/**
 * Login a user
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Search for user by email
    const user = userModel.findByEmail(email);

    // If user not found, return 401 Unauthorized
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Compare password with hashed password
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    // If password doesn't match, return 401 Unauthorized
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Return success response with user data (exclude password)
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

/**
 * Get all users (Admin/Debug route)
 * GET /api/auth/users
 */
function getUsers(req, res) {
  try {
    const users = userModel.getAllUsers();

    // Remove password field from all users for security
    const usersWithoutPasswords = users.map(user => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return res.status(200).json({
      success: true,
      count: usersWithoutPasswords.length,
      users: usersWithoutPasswords
    });

  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

module.exports = {
  register,
  login,
  getUsers
};
