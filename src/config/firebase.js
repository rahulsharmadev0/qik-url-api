import admin from 'firebase-admin';

let _fs;

export async function initFirebase() {
  try {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      // For development with emulator, we don't need credentials
      if (process.env.FIRESTORE_EMULATOR_HOST) {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'qik-url-firestore-emulator'
        });
        console.log('🔥 Firebase connected to emulator');
      } else {
        // Production setup would require service account key
        throw new Error('Production Firebase setup not configured. Please set up service account credentials.');
      }
    }

    _fs = admin.firestore();
    
    // Test the connection
    await _fs.collection('_health').doc('test').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'connected'
    });
    
    console.log('🚀 Firestore initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    throw error;
  }
}

export  const firestore = () =>{
  if (!_fs) {
    throw new Error('Firestore not initialized. Call initFirebase() first.');
  }
  return _fs;
}

export { admin };
