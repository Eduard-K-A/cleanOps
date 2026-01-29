'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'employee';
  redirectTo?: string;
}

export function   ProtectedRoute({ children, requiredRole, redirectTo }: ProtectedRouteProps) {
  const { isLoggedIn, mounted, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!mounted) return;
    if (!isLoggedIn) router.push('/login');
    if (requiredRole && !loading && profile?.role && profile.role !== requiredRole) {
      router.push(redirectTo ?? '/');
    }
  }, [isLoggedIn, mounted, router, requiredRole, redirectTo, loading, profile?.role]);

  if (!mounted || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
      </div>
    );
  }
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Redirecting to sign in…
      </div>
    );
  }
  if (requiredRole && profile?.role && profile.role !== requiredRole) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Redirecting…
      </div>
    );
  }
  return <>{children}</>;
}
