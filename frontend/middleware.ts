import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for Next.js 15+ App Router
 * Auth is checked client-side in ProtectedRoute component
 * This middleware passes through all requests without modification
 */
export function middleware(request: NextRequest): NextResponse {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except:
    // - api routes
    // - static files (jpg, png, gif, etc.)
    // - favicon.ico
    // - _next/* routes
    '/((?!api|_next/static|_next/image|favicon\\.ico).*)',
  ],
};

