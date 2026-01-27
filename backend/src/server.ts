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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/notifications', notificationsRouter);

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
