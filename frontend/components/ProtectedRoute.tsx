'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'employee';
  redirectTo?: string;
}

// ---------------------------------------------------------------------------
// Shared skeleton UI helpers
// ---------------------------------------------------------------------------

function NavSkeleton() {
  return (
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
  );
}

function LoadingSkeleton() {
  return (
    <div className="shell">
      <NavSkeleton />
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

function RedirectingSkeleton({ label = 'Redirecting…' }: { label?: string }) {
  return (
    <div className="shell">
      <NavSkeleton />
      <div className="page-body">
        <div className="content-area">
          <div className="flex items-center justify-center min-h-64 text-gray-500">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProtectedRoute
// ---------------------------------------------------------------------------
// ⚠️  IMPORTANT: no localStorage or window checks in render body — that causes
//     SSR / client mismatch (hydration errors).  All client-only reads happen
//     in useEffect inside AuthProvider; this component just consumes context.
// ---------------------------------------------------------------------------

export function ProtectedRoute({ children, requiredRole, redirectTo }: ProtectedRouteProps) {
  const { isLoggedIn, mounted, profile, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Only act once auth state is fully known.
    if (!mounted) return;

    // Unauthenticated user — send to login.
    if (!isLoggedIn) {
      setIsRedirecting(true);
      router.push('/login');
      return;
    }

    // Wrong role (fully confirmed from server) — redirect.
    if (requiredRole && profile?.role && profile.role !== requiredRole) {
      setIsRedirecting(true);
      router.push(redirectTo ?? '/');
      return;
    }

    setIsRedirecting(false);
  }, [isLoggedIn, mounted, profile?.role, router, requiredRole, redirectTo, loading]);

  // Before mounting: server and client agree — both render the same skeleton.
  // AuthProvider's useEffect populates mounted+profile from localStorage almost
  // instantly after first paint, so this flash is imperceptible in practice.
  if (!mounted) {
    return <LoadingSkeleton />;
  }

  // Actively redirecting (useEffect above triggered a push).
  if (isRedirecting) {
    return <RedirectingSkeleton />;
  }

  // Mounted + confirmed unauthenticated.
  if (!isLoggedIn) {
    return <RedirectingSkeleton label="Redirecting to sign in…" />;
  }

  // Mounted + wrong role confirmed.
  if (requiredRole && profile?.role && profile.role !== requiredRole) {
    return <RedirectingSkeleton />;
  }

  // All checks passed — render page content.
  return <>{children}</>;
}
