// src/index.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import * as admin from 'firebase-admin';

// Middleware imports
import { errorHandler } from './middleware/error.middleware';
import { createRateLimiter } from './middleware/rate-limit.middleware';

// Route imports
import serviceRoutes from './services/openai/openai.routes';
import websiteAnalysisRoutes from './services/analyzeWebsite/analyzeWebsite.routes';
import authRoutes from './services/auth/auth.routes';
import stripeRoutes from './services/stripe/stripe.routes';
import statusRoutes from './services/status/status.routes'; // NEW IMPORT
import { setAppVersion } from './services/status/status.routes'; // NEW IMPORT
import { ApiError, ErrorCodes } from './errors/errors.utilsts';

// Initialize express
const app = express();

// App version
const APP_VERSION = '1.0.1'; // Update this when you release new versions
// Set app version in status service
setAppVersion(APP_VERSION); // NEW LINE

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Raw body parser for Stripe webhooks
app.use('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }));

// Global rate limiting
app.use(createRateLimiter(15 * 60 * 1000, 100)); // 100 requests per 15 minutes

// More strict rate limiting for OpenAI routes
app.use('/api/v1/services/chat', createRateLimiter(15 * 60 * 1000, 50)); // 50 requests per 15 minutes

// Request parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      throw new ApiError(400, 'Invalid JSON payload', ErrorCodes.INVALID_INPUT);
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Compression and logging
app.use(compression());
app.use(morgan('combined'));

// Add homepage
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'API Service',
      version: APP_VERSION,
      status: 'running',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    }
  });
});

// API Routes
app.use('/api/v1/services', serviceRoutes);        // OpenAI service endpoints
app.use('/api/v1/auth', authRoutes);              // Authentication endpoints
app.use('/api/v1/services', websiteAnalysisRoutes);  // Website Analyzer service endpoints
app.use('/api/v1/stripe', stripeRoutes);          // Stripe payment endpoints
app.use('/api/v1/status', statusRoutes);          // Status endpoints - NEW LINE

// 404 handler - must be before error handler
app.use((req, res, next) => {
  next(new ApiError(
    404,
    `Endpoint ${req.method} ${req.path} not found`,
    ErrorCodes.NOT_FOUND
  ));
});

// Global error handler - must be last
app.use(errorHandler);

// Server initialization
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Graceful shutdown handler
const gracefulShutdown = () => {
  console.log('Received shutdown signal. Closing server...');
  server.close(() => {
    console.log('Server closed. Process terminating...');
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

const server = app.listen(PORT, () => {
  console.log(`
🚀 Server started:
   - Port: ${PORT}
   - Environment: ${NODE_ENV}
   - Time: ${new Date().toISOString()}
   - Version: ${APP_VERSION}
  `);
});

// Shutdown handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Unhandled rejection handler
process.on('unhandledRejection', (reason: Error | any) => {
  console.error('Unhandled Rejection:', reason);
  
  // Prevent server crash, but log the error
  if (reason instanceof Error) {
    console.error(reason.stack);
  }
});

export default app;