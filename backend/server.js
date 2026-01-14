require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { LocalStorage } = require('node-localstorage');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const localStorage = new LocalStorage('./storage');

// Middleware
app.use(cors({ origin: 'http://localhost:3000' })); // Allow Frontend
app.use(express.json());

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
      serviceType: 'Home Cleaning',
      amount: 5000,
      status: 'Pending',
      paymentIntentId: 'pi_mock_123',
      date: new Date().toISOString()
    }
  ]);
}

// --- Routes ---

// 1. Create Order & Payment Intent
app.post('/api/orders', async (req, res) => {
  try {
    const { name, email, address, serviceType, date, amount } = req.body;
    
    // Create Stripe Intent (Capture Method: Manual for authorization only)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // e.g., 5000 = $50.00
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      capture_method: 'manual', 
    });

    const newOrder = {
      id: uuidv4(),
      name, email, address, serviceType, date,
      amount,
      status: 'Pending', // Pending admin approval
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      createdAt: new Date().toISOString()
    };

    const orders = getOrders();
    orders.push(newOrder);
    saveOrders(orders);

    res.json({ orderId: newOrder.id, clientSecret: newOrder.clientSecret });
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

// 3. Admin Accept (Capture Payment)
app.post('/api/orders/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    let orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) return res.status(404).json({ error: 'Order not found' });

    // Capture the funds
    await stripe.paymentIntents.capture(orders[orderIndex].paymentIntentId);

    orders[orderIndex].status = 'Confirmed';
    saveOrders(orders);

    console.log(`Email sent to ${orders[orderIndex].email}: Your order is confirmed!`);
    res.json({ success: true, order: orders[orderIndex] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Admin Decline (Cancel Payment)
app.post('/api/orders/:id/decline', async (req, res) => {
  try {
    const { id } = req.params;
    let orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) return res.status(404).json({ error: 'Order not found' });

    // Cancel the authorization
    await stripe.paymentIntents.cancel(orders[orderIndex].paymentIntentId);

    orders[orderIndex].status = 'Canceled';
    saveOrders(orders);

    console.log(`Email sent to ${orders[orderIndex].email}: Your order was declined.`);
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
      </body>
    </html>`);
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));