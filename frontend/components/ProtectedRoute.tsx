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
// Synchronous cache read — called inline so it runs before the first paint
// ---------------------------------------------------------------------------
function getCachedRole(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const role = localStorage.getItem('cleanops_role');
    const id   = localStorage.getItem('cleanops_role_id');
    if (role && id) return role;
  } catch {}
  return null;
}

// ---------------------------------------------------------------------------
// ProtectedRoute
// ---------------------------------------------------------------------------

export function ProtectedRoute({ children, requiredRole, redirectTo }: ProtectedRouteProps) {
  const { isLoggedIn, mounted, profile, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!mounted) return;

    // Unauthenticated — send to login
    if (!isLoggedIn) {
      setIsRedirecting(true);
      router.push('/login');
      return;
    }

    // Wrong role — send to redirectTo (or home)
    if (requiredRole && profile?.role && profile.role !== requiredRole) {
      setIsRedirecting(true);
      router.push(redirectTo ?? '/');
      return;
    }

    setIsRedirecting(false);
  }, [isLoggedIn, mounted, router, requiredRole, redirectTo, loading, profile?.role]);

  // ── Fast path via synchronous cache ────────────────────────────────────────
  // getCachedRole() reads localStorage synchronously, so it returns a value on
  // the very first render — before Supabase's async getSession() resolves.
  // If the cached role satisfies the required-role check we render children
  // immediately, eliminating the skeleton flash on page refresh / navigation.
  // The authContext's async validation still runs in the background and will
  // redirect via the useEffect above if the session is actually expired.
  const cachedRole = getCachedRole();
  const cachePassesCheck = cachedRole !== null && (!requiredRole || cachedRole === requiredRole);

  // Show full-page skeleton ONLY when there is truly no information yet:
  //  - context isn't mounted (no async result yet), AND
  //  - Supabase is still loading, AND
  //  - the synchronous cache doesn't satisfy the role check
  if (!mounted && loading && !cachePassesCheck) {
    return <LoadingSkeleton />;
  }

  // Actively redirecting (decided by the useEffect above)
  if (isRedirecting) {
    return <RedirectingSkeleton />;
  }

  // Mounted + genuinely unauthenticated (no cache, no session)
  if (mounted && !isLoggedIn && !cachedRole) {
    return <RedirectingSkeleton label="Redirecting to sign in…" />;
  }

  // Mounted + wrong role confirmed by server
  if (mounted && requiredRole && profile?.role && profile.role !== requiredRole) {
    return <RedirectingSkeleton />;
  }

  // All checks passed — render page content
  return <>{children}</>;
}
