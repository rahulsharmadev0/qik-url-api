import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Smart environment configuration loader
 */
export function loadEnvConfig() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isVercel = !!process.env.VERCEL; // Vercel sets this automatically
    
    // Skip loading .env files for test environment
    if (nodeEnv === 'test') {
        console.log('🧪 Test environment - using setupEnv.js configuration');
        return;
    }
    
    // On Vercel we rely purely on dashboard-provided env vars (no local file access)
    if (!isVercel) {
        const envFile = nodeEnv === 'production' ? '.env.production' : '.env';
        const envPath = path.resolve(__dirname, '../../', envFile);
        const result = dotenv.config({ path: envPath });
        if (result.error) {
            console.warn(`⚠️  Could not load ${envFile}:`, result.error.message);
        } else {
            console.log(`✅ Loaded ${envFile}`);
        }
    } else {
        console.log('🌐 Vercel environment detected - skipping .env file loading');
    }
    
    // Validate required variables
    // PORT is optional in serverless (ignored by platform). Keep for local only.
    const required = ['REDIS_HOST', 'FIREBASE_PROJECT_ID'];
    if (!isVercel) required.unshift('PORT');
    const missing = required.filter(v => !process.env[v]);
    
    if (missing.length) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

/**
 * Get current environment info
 */
export function getEnvInfo() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    return {
        environment: nodeEnv,
        port: process.env.PORT || 3000,
        isProduction: nodeEnv === 'production',
        isDevelopment: nodeEnv === 'development',
        isTest: nodeEnv === 'test',
        redisHost: process.env.REDIS_HOST,
        firebaseProject: process.env.FIREBASE_PROJECT_ID,
        useFirestoreEmulator: !!process.env.FIRESTORE_EMULATOR_HOST
    };
}
