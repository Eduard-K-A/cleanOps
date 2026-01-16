import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Middleware runs for all matched routes but doesn't enforce auth
  // (Auth is checked client-side in ProtectedRoute component)
  // This middleware passes through all requests
  
  return NextResponse.next()
}

export const config = {
  // Apply middleware to all routes except api, static files, and _next
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

