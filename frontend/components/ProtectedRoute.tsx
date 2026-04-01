'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'employee';
  redirectTo?: string;
}

export function ProtectedRoute({ children, requiredRole, redirectTo }: ProtectedRouteProps) {
  const { isLoggedIn, mounted, profile, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    
    // Handle unauthenticated users
    if (!isLoggedIn) {
      setIsRedirecting(true);
      router.push('/login');
      return;
    }
    
    // Handle role-based access
    // allow check if we have a role, even if still loading background profile
    if (requiredRole && profile?.role && profile.role !== requiredRole) {
      setIsRedirecting(true);
      router.push(redirectTo ?? '/');
      return;
    }
    
    setIsRedirecting(false);
  }, [isLoggedIn, mounted, router, requiredRole, redirectTo, loading, profile?.role]);

  // Show skeleton while auth state is loading AND we don't have a cached role
  if (!mounted || (loading && !profile?.role)) {
    return (
      <div className="shell">
        <nav className="topnav">
          <div className="nav-brand">
            <div className="nav-brand-icon shimmer"></div>
            <span className="nav-brand-text">CleanOps</span>
          </div>
          <div className="nav-links">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-20 bg-gray-200 rounded-full animate-pulse"></div>
            ))}
          </div>
          <div className="nav-user">
            <div className="nav-avatar bg-gray-200 animate-pulse"></div>
            <div className="nav-user-info">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </nav>
        <div className="page-body">
          <div className="content-area">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show skeleton while redirecting
  if (isRedirecting) {
    return (
      <div className="shell">
        <nav className="topnav">
          <div className="nav-brand">
            <div className="nav-brand-icon shimmer"></div>
            <span className="nav-brand-text">CleanOps</span>
          </div>
          <div className="nav-links">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-20 bg-gray-200 rounded-full animate-pulse"></div>
            ))}
          </div>
          <div className="nav-user">
            <div className="nav-avatar bg-gray-200 animate-pulse"></div>
            <div className="nav-user-info">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </nav>
        <div className="page-body">
          <div className="content-area">
            <div className="flex items-center justify-center min-h-64 text-gray-500">
              Redirecting...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show redirect message for unauthenticated users
  if (!isLoggedIn) {
    return (
      <div className="shell">
        <nav className="topnav">
          <div className="nav-brand">
            <div className="nav-brand-icon shimmer"></div>
            <span className="nav-brand-text">CleanOps</span>
          </div>
          <div className="nav-links">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-20 bg-gray-200 rounded-full animate-pulse"></div>
            ))}
          </div>
          <div className="nav-user">
            <div className="nav-avatar bg-gray-200 animate-pulse"></div>
            <div className="nav-user-info">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </nav>
        <div className="page-body">
          <div className="content-area">
            <div className="flex items-center justify-center min-h-64 text-gray-500">
              Redirecting to sign in…
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show redirect message for wrong role
  if (requiredRole && profile?.role && profile.role !== requiredRole) {
    return (
      <div className="shell">
        <nav className="topnav">
          <div className="nav-brand">
            <div className="nav-brand-icon shimmer"></div>
            <span className="nav-brand-text">CleanOps</span>
          </div>
          <div className="nav-links">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-20 bg-gray-200 rounded-full animate-pulse"></div>
            ))}
          </div>
          <div className="nav-user">
            <div className="nav-avatar bg-gray-200 animate-pulse"></div>
            <div className="nav-user-info">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </nav>
        <div className="page-body">
          <div className="content-area">
            <div className="flex items-center justify-center min-h-64 text-gray-500">
              Redirecting…
            </div>
          </div>
        </div>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}
