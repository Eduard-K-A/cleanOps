import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public pages that don't require authentication
  const publicPages = ['/admin/login', '/admin/signup', '/homepage', '/']

  // Check if user is authenticated by looking for 'user' in cookies
  // In Next.js, we can't directly read localStorage in middleware, 
  // so we'll handle auth checks on client-side in ProtectedRoute component
  
  // This middleware just ensures proper redirects for known routes
  if (pathname === '/' && !publicPages.includes('/')) {
    // Allow root to be handled by layout
  }

  return NextResponse.next()
}

export const config = {
  // Apply middleware to all routes except api, static files, and _next
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

