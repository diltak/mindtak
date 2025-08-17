import * as admin from "firebase-admin";


if (!admin.apps.length) {
  try {
    // Use the same project ID as the client config
    const projectId = process.env.FIREBASE_PROJECT_ID || "mindtest-94298";
    
    // Check if we have service account credentials
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
      });
    } else {
      // Fallback to default credentials (for development)
      console.log('Using default Firebase Admin credentials');
      admin.initializeApp({
        projectId: projectId,
      });
    }
  } catch (error: any) {
    console.error('Firebase initialization error:', error);
  }
}




const adminAuth = admin.auth();
const adminDB = admin.firestore();


export { admin, adminAuth, adminDB };

