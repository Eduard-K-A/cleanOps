require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { LocalStorage } = require('node-localstorage');
const { v4: uuidv4 } = require('uuid');

// Import routes
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOriginsList = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(origin => origin.trim());
const localStorage = new LocalStorage('./storage');

// Dynamic CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || allowedOriginsList.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions)); // Apply dynamic CORS
app.use(express.json());

// Use routes
app.use('/api/auth', authRoutes);

// --- Database Helper ---
const DB_KEY = 'orders';
const getOrders = () => JSON.parse(localStorage.getItem(DB_KEY) || '[]');
const saveOrders = (orders) => localStorage.setItem(DB_KEY, JSON.stringify(orders));

// Seed Demo Data if empty
if (!localStorage.getItem(DB_KEY)) {
  saveOrders([
    {
      id: uuidv4(),
      name: 'Demo User',
      email: 'demo@example.com',
      rooms: 3,
      selectedTypes: ['Bedroom', 'Living Room', 'Kitchen'],
      notes: 'Sample cleaning request',
      status: 'Pending',
      paymentStatus: 'Authorized',
      paymentId: 'mock_payment_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    }
  ]);
}

// --- Routes ---

// 1. Create Order (Mock Payment)
app.post('/api/orders', async (req, res) => {
  try {
    const { name, email, rooms, selectedTypes, notes, userId } = req.body;
    
    // Mock payment authorization - always succeeds
    const paymentId = 'mock_payment_' + Math.random().toString(36).substr(2, 9);
    
    const newOrder = {
      id: uuidv4(),
      userId, // Store the user ID to associate order with user
      name,
      email,
      rooms,
      selectedTypes,
      notes,
      status: 'Pending', // Pending admin approval
      paymentStatus: 'Authorized', // Mock payment is always authorized
      paymentId,
      createdAt: new Date().toISOString()
    };

    const orders = getOrders();
    orders.push(newOrder);
    saveOrders(orders);

    res.json({ orderId: newOrder.id, success: true, paymentStatus: 'authorized' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Orders (Admin)
app.get('/api/orders', (req, res) => {
  const { status } = req.query;
  let orders = getOrders();
  if (status) {
    orders = orders.filter(o => o.status === status);
  }
  res.json(orders);
});

// 3. Admin Accept (Confirm Order)
app.post('/api/orders/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    let orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) return res.status(404).json({ error: 'Order not found' });

    // Mock: Mark order as confirmed
    orders[orderIndex].status = 'Confirmed';
    saveOrders(orders);

    console.log(`Order ${id} confirmed. Email sent to ${orders[orderIndex].email}`);
    res.json({ success: true, order: orders[orderIndex] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Admin Decline (Cancel Order)
app.post('/api/orders/:id/decline', async (req, res) => {
  try {
    const { id } = req.params;
    let orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) return res.status(404).json({ error: 'Order not found' });

    // Mock: Mark order as canceled
    orders[orderIndex].status = 'Canceled';
    saveOrders(orders);

    console.log(`Order ${id} declined. Email sent to ${orders[orderIndex].email}`);
    res.json({ success: true, order: orders[orderIndex] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Admin Login (Simple)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password123') {
    res.json({ success: true, token: 'mock-jwt-token-123' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Home route: simple status page
app.get('/', (req, res) => {
  res.send(`<!doctype html>
    <html>
      <head><meta charset="utf-8"><title>CleanOps Backend</title></head>
      <body>
        <h1>CleanOps Backend is running</h1>
        <p>Available API: <a href="/api/orders">/api/orders</a></p>
        <p>Mock payment system is active (no Stripe integration)</p>
      </body>
    </html>`);
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));