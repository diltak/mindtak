
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyName: z.string().min(1, 'Company name is required'),
  companySize: z.string().optional(),
  industry: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { firstName, lastName, email, password, companyName, companySize, industry } = validation.data;

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Generate unique company ID
    const companyId = `company_${userRecord.uid}`;

    // Create company document in Firestore
    const companyRef = doc(db, 'companies', companyId);
    await setDoc(companyRef, {
      id: companyId,
      name: companyName,
      size: companySize || 'Not specified',
      industry: industry || 'Not specified',
      owner_id: userRecord.uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    // Create employer user profile in Firestore
    const userRef = doc(db, 'users', userRecord.uid);
    await setDoc(userRef, {
      id: userRecord.uid,
      email,
      first_name: firstName,
      last_name: lastName,
      role: 'employer',
      company_id: companyId,
      company_name: companyName,
      is_active: true,
      hierarchy_level: 0,
      can_view_team_reports: true,
      can_manage_employees: true,
      can_approve_leaves: true,
      is_department_head: true,
      skip_level_access: true,
      direct_reports: [],
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return NextResponse.json({ message: 'Company account created successfully!', userId: userRecord.uid }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}
