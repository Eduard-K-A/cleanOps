'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { NavbarSkeleton, PageSkeleton } from '@/components/ui/Skeleton';

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
    if (requiredRole && !loading && profile?.role && profile.role !== requiredRole) {
      setIsRedirecting(true);
      router.push(redirectTo ?? '/');
      return;
    }
    
    setIsRedirecting(false);
  }, [isLoggedIn, mounted, router, requiredRole, redirectTo, loading, profile?.role]);

  // Show skeleton while auth state is loading
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavbarSkeleton />
        <PageSkeleton />
      </div>
    );
  }

  // Show skeleton while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavbarSkeleton />
        <PageSkeleton />
      </div>
    );
  }

  // Show redirect message for unauthenticated users
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavbarSkeleton />
        <main className="mx-auto max-w-5xl p-5">
          <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
            Redirecting to sign in…
          </div>
        </main>
      </div>
    );
  }

  // Show redirect message for wrong role
  if (requiredRole && profile?.role && profile.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavbarSkeleton />
        <main className="mx-auto max-w-5xl p-5">
          <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
            Redirecting…
          </div>
        </main>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}
