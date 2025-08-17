import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  console.log('API route hit: /api/createEmployee');
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    const { email, password, firstName, lastName, role, department, position, company_id, managerId, hierarchyLevel, permissions = {} } = body;

    if (!email || !password || !firstName || !lastName || !role || !company_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    try {
      // Create user with Firebase Auth (client-side SDK)
      console.log('Creating user with Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User created successfully:', user.uid);

      // Write to Firestore
      console.log('Writing to Firestore...');
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        email,
        role,
        first_name: firstName,
        last_name: lastName,
        department: department || "",
        position: position || "",
        company_id,
        manager_id: managerId && managerId !== "none" ? managerId : null,
        hierarchy_level: parseInt(hierarchyLevel) || 0,
        ...permissions,
        direct_reports: [],
        reporting_chain: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      console.log('Firestore write completed successfully');

      return NextResponse.json({ success: true, uid: user.uid });
    } catch (firebaseError: any) {
      console.error('Firebase operation failed:', firebaseError);
      
      // Handle specific Firebase errors
      let errorMessage = 'Firebase operation failed';
      if (firebaseError.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already exists';
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      return NextResponse.json({ 
        error: errorMessage, 
        details: firebaseError.message 
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error("Error in createEmployee API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
