import express from 'express';
import helmet from 'helmet';
import { Env } from './config/env.js';
import { FirebaseService } from './config/firebase.js';
import { RedisService } from './config/redis.js';
import qikUrlRoutes from './routes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

// Load environment configuration first
Env.loadConfig();

export const app = express();

// Initialize services for serverless environment
let servicesInitialized = false;
async function initializeServices() {
  if (servicesInitialized) return;
  console.log('🚀 Initializing Firebase & Redis services...');
  await FirebaseService.initialize();
  await RedisService.initialize();
  servicesInitialized = true;
  console.log('✅ Firebase & Redis services ready');
}

// Middleware to ensure services are initialized for each request in serverless
app.use(async (req, res, next) => {
  try {
    await initializeServices();
    next();
  } catch (error) {
    res.status(503).json({ error: 'Service initialization failed' });
  }
});

// Apply Helmet for security by setting common HTTP headers.
// By default, Helmet’s Content Security Policy (CSP) blocks inline <script> tags,
// which can break some frontend code or libraries.
// Here, we override the CSP to allow inline scripts, eval, and external scripts from unpkg.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://unpkg.com"
        ]
      }
    }
  })
);

// Parse JSON request bodies
app.use(express.json());

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

app.use('/', qikUrlRoutes); // routes first

app.use(errorHandler);

app.use(notFoundHandler);

const PORT = process.env.PORT || 3000;

export async function start() {
  try {
    console.log('🚀 Starting Qik URL API...');
    await FirebaseService.initialize();
    await RedisService.initialize();

    // Start server & log environment info
    const server = app.listen(PORT, Env.consoleLog);

    // Graceful shutdown
    const gracefulShutdown = signal => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Vercel (serverless) => do NOT call app.listen(); just export the app.
// Vercel sets VERCEL="1". We only pre-initialize services asynchronously.
if (process.env.VERCEL === '1') {
  initializeServices().catch(err => console.error('Init error (serverless):', err));
} else {
  start();  // Local / traditional runtime
}