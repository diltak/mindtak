import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'API is working!' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ 
    message: 'POST is working!', 
    receivedData: body 
  });
}
