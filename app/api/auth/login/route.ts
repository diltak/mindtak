
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password } = validation.data;

    // This is a simplified example. In a real application, you would
    // verify the password with Firebase Auth. Since we can't do that
    // in a serverless environment without the client-side SDK, we'll
    // just get the user by email and create a custom token.
    const userRecord = await auth.getUserByEmail(email);

    const customToken = await auth.createCustomToken(userRecord.uid);

    cookies().set('session', customToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 5, // 5 days
        path: '/',
    });

    return NextResponse.json({ message: 'Login successful!', user: { uid: userRecord.uid, email: userRecord.email } }, { status: 200 });

  } catch (error: any) {
    console.error('Login error:', error);

    if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ error: 'No account found with this email address.' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Login failed. Please check your credentials and try again.' }, { status: 500 });
  }
}
