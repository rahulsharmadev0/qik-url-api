import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { loadEnvConfig, getEnvInfo } from './config/env.js';
import { FirebaseService } from './config/firebase.js';
import { RedisService } from './config/redis.js';
import qikUrlRoutes from './routes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

// Load environment configuration first
loadEnvConfig();

export const app = express();

// Initialize services for serverless environment
let servicesInitialized = false;
async function initializeServices() {
  if (servicesInitialized) return;
  console.log('🚀 Initializing backing services...');
  await FirebaseService.initialize();
  await RedisService.initialize();
  servicesInitialized = true;
  console.log('✅ Backing services ready');
}

// Middleware to ensure services are initialized for each request in serverless
app.use(async (req, res, next) => {
  try {
    await initializeServices();
    next();
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    res.status(503).json({ error: 'Service initialization failed' });
  }
});

// Security middleware
app.use(helmet());

// Compression middleware for better performance
app.use(compression());

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/', qikUrlRoutes); // routes

// Global error handler
app.use(errorHandler);

// 404 handler for unknown routes (must be last)
app.use(notFoundHandler);

const PORT = process.env.PORT || 3000;

export async function start() {
  try {
  console.log('🚀 Starting Qik URL API...');    
    await FirebaseService.initialize();
    await RedisService.initialize();
    
    // Get environment info
    const envInfo = getEnvInfo();
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`✅ Qik Url API listening on :${PORT}`);
      console.log(`🌍 Environment: ${envInfo.environment}`);
      console.log(`🔥 Firebase Project: ${envInfo.firebaseProject}`);
      console.log(`📦 Redis Host: ${envInfo.redisHost}`);
    });

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

// Only auto-start if not under test environment
// For traditional (non-serverless) runtime only
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  start();
} else if (process.env.VERCEL) {
  // Kick off async initialization (don't block cold start response path too long)
  initializeServices().catch(err => console.error('Init error (serverless):', err));
}






