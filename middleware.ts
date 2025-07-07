import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Track if migrations have been run in this instance
let migrationsRun = false;
let migrationPromise: Promise<void> | null = null;

export async function middleware(request: NextRequest) {
  // Only run migrations once per application instance
 
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