const { LocalStorage } = require('node-localstorage');
const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const localStorage = new LocalStorage('./storage');
const DB_KEY = 'users';

/**
 * Initialize the users database if it doesn't exist
 */
function initializeDB() {
  if (!localStorage.getItem(DB_KEY)) {
    localStorage.setItem(DB_KEY, JSON.stringify([]));
  }
}

/**
 * Get all users from the JSON file
 */
function getAllUsers() {
  initializeDB();
  return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
}

/**
 * Save users to the JSON file
 */
function saveUsers(users) {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
}

/**
 * Find a user by username
 * @param {string} username
 * @returns {object|null} User object or null if not found
 */
function findByUsername(username) {
  const users = getAllUsers();
  return users.find(u => u.username === username) || null;
}

/**
 * Find a user by email
 * @param {string} email
 * @returns {object|null} User object or null if not found
 */
function findByEmail(email) {
  const users = getAllUsers();
  return users.find(u => u.email === email) || null;
}

/**
 * Find a user by ID
 * @param {string} id
 * @returns {object|null} User object or null if not found
 */
function findById(id) {
  const users = getAllUsers();
  return users.find(u => u.id === id) || null;
}

/**
 * Create a new user
 * @param {object} userData - { username, password, email }
 * @returns {object} Created user object (without password)
 */
async function create(userData) {
  const { username, password, email } = userData;

  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcryptjs.hash(password, saltRounds);

  // Create user object
  const newUser = {
    id: uuidv4(),
    username,
    email,
    password: hashedPassword,
    role: 'Customer', // Default role
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Save to database
  const users = getAllUsers();
  users.push(newUser);
  saveUsers(users);

  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

module.exports = {
  findByUsername,
  findByEmail,
  findById,
  create,
  getAllUsers
};
