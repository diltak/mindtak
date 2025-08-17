import * as admin from "firebase-admin";


if (!admin.apps.length) {
  try {
  admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
  });
  } catch (error: any) {
    console.error('Firebase initialization error:', error);
}
}




const adminAuth = admin.auth();
const adminDB = admin.firestore();


export { admin, adminAuth, adminDB };

