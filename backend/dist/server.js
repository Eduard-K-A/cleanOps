"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const env_1 = require("./config/env");
const socket_1 = require("./socket");
const cronService_1 = require("./services/cronService");
const errorHandler_1 = require("./middleware/errorHandler");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const messages_1 = __importDefault(require("./routes/messages"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const payments_1 = __importDefault(require("./routes/payments"));
// Validate environment variables
(0, env_1.validateEnv)();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Initialize Socket.io
const io = (0, socket_1.initializeSocket)(httpServer);
// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// IMPORTANT: Webhooks must receive the raw body for signature verification.
// Mount webhook routes BEFORE JSON/urlencoded parsers.
app.use('/api/webhooks', webhooks_1.default);
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
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
app.use('/api/auth', auth_1.default);
app.use('/api/jobs', jobs_1.default);
// Note: previously there was an incorrect mount `app.use('api/jobs/feed', jobsRouter)`
// which lacked a leading slash and was unnecessary because `/api/jobs` is already mounted above.
app.use('/api/messages', messages_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/payments', payments_1.default);
// Error handling middleware (must be last)
app.use(errorHandler_1.errorHandler);
// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 CleanOps Backend Server running on port ${PORT}`);
    console.log(`📡 Socket.io server initialized`);
    // Initialize cron jobs
    (0, cronService_1.initializeCronJobs)();
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
//# sourceMappingURL=server.js.map