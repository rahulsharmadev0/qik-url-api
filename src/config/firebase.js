import admin from 'firebase-admin';
import { readFileSync } from 'fs';

class FirebaseService {

  static _instance = null;

  static async initialize() {
    if (!FirebaseService._instance) {
      FirebaseService._instance = new FirebaseService();
      await FirebaseService._instance.init();
    }
    return FirebaseService._instance;
  }

  static get firestore() { return FirebaseService._instance.fs; }

  #fs;
  constructor() {
    this.#fs = null;
  }

  get fs() {
    if (!this.#fs) throw new Error('Firestore not initialized.');
    return this.#fs;
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

      this.#fs = admin.firestore();

      // Test connection
      await this.#fs.collection('_health').doc('test').set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'connected'
      });

      console.log('🚀 Firestore initialized');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }

  async _initProductionFirebase() {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      // Use service account JSON from environment variable (for Vercel)
      const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('🔑 Firebase service account loaded from environment');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
      // Use service account from file (for local production testing)
      const serviceAccount = JSON.parse(readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('🔑 Firebase service account loaded from file');
    } else {
      // Use Application Default Credentials (for cloud deployments)
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
      console.log('🏗️ Using Firebase ADC');
    }
  }

}

export {FirebaseService}

