import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Env {
    static isProduction = process.env.NODE_ENV === 'production';
    static isDevelopment = process.env.NODE_ENV === 'development';
    static isServerless = !!process.env.VERCEL;

    static loadConfig() {
        if (!Env.isServerless) {
            const envFile = Env.isProduction ? '.env.production' : '.env';
            const result = dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });
            if (result.error) {
                console.warn(`⚠️  Could not load ${envFile}:`, result.error.message);
            } else {
                console.log(`✅ Loaded ${envFile}`);
            }
        }

        // PORT is optional in serverless (ignored by platform). Keep for local only.
        const required = ['REDIS_HOST', 'FIREBASE_PROJECT_ID'];
        if (!Env.isServerless) required.unshift('PORT');
        const missing = required.filter(v => !process.env[v]);
        if (missing.length) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    static getEnvInfo() {
        return {
            environment: process.env.NODE_ENV,
            port: process.env.PORT || 3000,
            isServerless: Env.isServerless,
            redisHost: process.env.REDIS_HOST,
            firebaseProject: process.env.FIREBASE_PROJECT_ID,
            useFirestoreEmulator: !!process.env.FIRESTORE_EMULATOR_HOST
        };
    }

    static consoleLog() {
        console.log('Environment Info:', Env.getEnvInfo());
    }
}


export { Env as default, Env };