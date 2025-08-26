import * as admin from "firebase-admin";


if (!admin.apps.length) {
  try {
    // Use the same project ID as the client config
    const projectId = process.env.FIREBASE_PROJECT_ID || "mindtest-94298";
    
    console.log('Initializing Firebase Admin with project ID:', projectId);
    
    // For development, use a simpler approach without service account
    // This will work for basic operations but may have limitations
    admin.initializeApp({
      projectId: projectId,
    });
    
    console.log('Firebase Admin initialized successfully');
  } catch (error: any) {
    console.error('Firebase initialization error:', error);
    // If initialization fails, we'll handle it gracefully
  }
}




const adminAuth = admin.auth();
const adminDB = admin.firestore();


export { admin, adminAuth, adminDB };

