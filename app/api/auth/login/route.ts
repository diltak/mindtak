
import { NextResponse } from 'next/server';
import { z } from 'zod';
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

    // For now, we'll return a success response
    // In a production app, you would verify credentials with Firebase Auth
    // and create a proper session token
    
    // Set a simple session cookie
    cookies().set('session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 5, // 5 days
        path: '/',
    });

    return NextResponse.json({ 
      message: 'Login successful!', 
      user: { email: email } 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Login error:', error);

    return NextResponse.json({ 
      error: 'Login failed. Please check your credentials and try again.'
    }, { status: 500 });
  }
}
