import { NextResponse } from 'next/server';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role = 'employee' } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      id: user.uid,
      email: email,
      first_name: 'Test',
      last_name: 'User',
      role: role,
      is_active: true,
      hierarchy_level: 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return NextResponse.json({ 
      message: 'Test user created successfully!', 
      user: { uid: user.uid, email: email, role: role }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create test user error:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to create test user' }, { status: 500 });
  }
}
