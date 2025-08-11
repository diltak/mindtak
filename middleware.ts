import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for all routes - let client-side auth handle protection
  // This prevents redirect loops and allows proper authentication flow
  return NextResponse.next();
}



export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/migrations (avoid infinite loops)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/migrations|_next/static|_next/image|favicon.ico).*)',
  ],
};
