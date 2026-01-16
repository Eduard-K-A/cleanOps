'use client'

import { useAuth } from '@/lib/authContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean // If true, requires login. If false, public page
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { isLoggedIn, mounted } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Public pages that don't require authentication
  const publicPages = ['/admin/login', '/admin/signup', '/homepage', '/']

  useEffect(() => {
    if (!mounted) return // Wait for hydration

    const isPublicPage = publicPages.includes(pathname)

    // If page requires auth and user is not logged in
    if (requireAuth && !isLoggedIn && !isPublicPage) {
      router.push('/admin/login')
      return
    }

    // If user is logged in and tries to access login/signup, redirect to homepage
    if (isLoggedIn && (pathname === '/admin/login' || pathname === '/admin/signup')) {
      router.push('/homepage')
      return
    }
  }, [isLoggedIn, mounted, pathname, router])

  // Show nothing while checking auth (prevents flash of content)
  if (!mounted) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // If page requires auth and user is not logged in, show nothing (redirect is happening)
  if (requireAuth && !isLoggedIn && !publicPages.includes(pathname)) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>
  }

  return <>{children}</>
}
