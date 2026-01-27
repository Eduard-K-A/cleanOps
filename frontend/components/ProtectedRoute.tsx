'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoggedIn, mounted } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!mounted) return;
    if (!isLoggedIn) router.push('/login');
  }, [isLoggedIn, mounted, router]);

  if (!mounted) {
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
  return <>{children}</>;
}
