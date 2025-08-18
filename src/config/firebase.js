import admin from 'firebase-admin';
import { readFileSync } from 'fs';

class FirebaseService {
  constructor() {
    this._fs = null;
    this._initialized = false;
  }

  async init() {
    try {
      if (admin.apps.length) return; // Already initialized

      if (process.env.FIRESTORE_EMULATOR_HOST) {
        // Development with emulator
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
        console.log(`🔥 Firebase connected to ${process.env.FIREBASE_PROJECT_ID}`);
      } else {
        // Production setup
        await this._initProductionFirebase();
      }

      this._fs = admin.firestore();

      // Test connection
      await this._fs.collection('_health').doc('test').set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'connected'
      });

      this._initialized = true;
      console.log('🚀 Firestore initialized');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }

  async _initProductionFirebase() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
      const serviceAccount = JSON.parse(readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('🔑 Firebase service account loaded');
    } else {
      // Use Application Default Credentials (for cloud deployments)
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
      console.log('🏗️ Using Firebase ADC');
    }
  }

  get instance() {
    if (!this._initialized || !this._fs) {
      throw new Error('Firebase not initialized. Call FirebaseService.init() first.');
    }
    return this._fs;
  }

  get admin() {
    return admin;
  }
}

// Create singleton instance
const firebaseService = new FirebaseService();

// Export the service instance and legacy functions for compatibility
export { firebaseService };
export const firestore = () => firebaseService.instance;
export const initFirebase = () => firebaseService.init();
export { admin };
