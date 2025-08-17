import type { NextApiRequest, NextApiResponse } from 'next'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  return NextResponse.json({ message: 'Endpoint hit' })
}
