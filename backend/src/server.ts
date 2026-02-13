import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { validateEnv } from './config/env';
import { initializeSocket } from './socket';
import { initializeCronJobs } from './services/cronService';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRouter from './routes/auth';
import jobsRouter from './routes/jobs';
import messagesRouter from './routes/messages';
import notificationsRouter from './routes/notifications';
import webhooksRouter from './routes/webhooks';
import paymentsRouter from './routes/payments';

// Validate environment variables
validateEnv();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = initializeSocket(httpServer);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// IMPORTANT: Webhooks must receive the raw body for signature verification.
// Mount webhook routes BEFORE JSON/urlencoded parsers.
app.use('/api/webhooks', webhooksRouter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Welcome page
app.get('/', (req, res) => {
  res.type('html').send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>CleanOps Backend</title>
      </head>
      <body>
        <main style="font-family: Arial, sans-serif; padding: 32px; max-width: 640px; margin: auto;">
          <h1>CleanOps Backend</h1>
          <p>The backend server is running.</p>
          <ul>
            <li>Health check: <code>/health</code></li>
            <li>Test endpoint: <code>/test</code></li>
            <li>API root: <code>/api</code></li>
          </ul>
        </main>
      </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Test endpoint reached',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
// Note: previously there was an incorrect mount `app.use('api/jobs/feed', jobsRouter)`
// which lacked a leading slash and was unnecessary because `/api/jobs` is already mounted above.
app.use('/api/messages', messagesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/payments', paymentsRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 CleanOps Backend Server running on port ${PORT}`);
  console.log(`📡 Socket.io server initialized`);
  
  // Initialize cron jobs
  initializeCronJobs();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
