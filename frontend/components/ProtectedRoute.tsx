'use client'

import { useAuth } from '@/lib/authContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Wrapper component to protect individual pages from unauthorized access.
 * Redirects unauthenticated users to /admin/login.
 * 
 * Usage:
 * export default function MyPage() {
 *   return (
 *     <ProtectedRoute>
 *       <YourPageContent />
 *     </ProtectedRoute>
 *   )
 * }
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoggedIn, mounted } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!mounted) return // Wait for hydration

    // If user is not logged in, redirect to login
    if (!isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, mounted, router])

  // Show nothing while checking auth (prevents flash of content)
  if (!mounted) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // If not logged in, show nothing (redirect is happening)
  if (!isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>
  }

  // User is authenticated, show the page
  return <>{children}</>
}
