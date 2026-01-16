import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // If the user visits the root path and is not authenticated, redirect to login
  if (pathname === '/') {
    // check for a cookie named 'token' (adjust name to your auth cookie if different)
    const token = req.cookies.get('token')?.value
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/',],
}
