'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'employee' | 'admin';
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
//
// Rendering strategy:
//
//   Phase 1 — pre-mount (SSR + first client frame)
//     mounted=false, loading=true, profile=null  →  LoadingSkeleton
//     (server and client agree → no hydration mismatch)
//
//   Phase 1b — cache seeded (useEffect in AuthProvider fires, ~0ms)
//     mounted=false, loading=true, profile={role}
//     If the cached role satisfies the requiredRole → render children OPTIMISTICALLY.
//     This eliminates the visible skeleton flash on hard refresh / navigation.
//
//   Phase 2 — Supabase getSession() resolves (~100-500ms)
//     mounted=true, loading=false, isLoggedIn=true/false
//     Now we have the ground truth. If expired/unauthenticated → redirect.
//
// Key rule: NEVER redirect before `loading=false`. Doing so causes false
// redirects to /login on hard refresh because user is null until getSession resolves.
// ---------------------------------------------------------------------------

export function ProtectedRoute({ children, requiredRole, redirectTo }: ProtectedRouteProps) {
  const { isLoggedIn, mounted, profile, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Wait until Supabase has fully resolved the session.
    // `mounted` becomes true only after getSession() completes in AuthProvider.
    // Checking `loading` as well guards against any edge cases where mounted
    // flips before loading finishes.
    if (!mounted || loading) return;

    if (!isLoggedIn) {
      setIsRedirecting(true);
      router.push('/login');
      return;
    }

    if (profile?.role === 'admin') {
      if (requiredRole && requiredRole !== 'admin') {
        setIsRedirecting(true);
        router.push('/admin/dashboard');
        return;
      }
      // Admins bypass all other checks if they hit a generic or admin route
    } else if (requiredRole && profile?.role && profile?.role !== requiredRole) {
      setIsRedirecting(true);
      router.push(redirectTo ?? '/');
      return;
    }

    setIsRedirecting(false);
  }, [isLoggedIn, mounted, loading, profile?.role, router, requiredRole, redirectTo]);

  // ── Phase 1b: Optimistic render from localStorage cache ──────────────────
  // profile is populated immediately by the cache useEffect in AuthProvider
  // (before getSession resolves). If it passes the role check, render children
  // right away — Supabase validation still runs in background.
  
  // If user is admin and requiredRole is something else, this optimistic 
  // check will fail so they don't see unauthorized UI before redirect.
  const cachedRolePasses = profile?.role !== undefined &&
    profile?.role === 'admin' 
      ? (!requiredRole || requiredRole === 'admin') 
      : (!requiredRole || profile?.role === requiredRole);

  if (cachedRolePasses && !isRedirecting) {
    return <>{children}</>;
  }

  // ── Phase 1: No cached info yet — show skeleton (SSR-safe) ───────────────
  if (!mounted || loading) {
    return <LoadingSkeleton />;
  }

  // ── Phase 2: Supabase resolved ────────────────────────────────────────────
  if (isRedirecting) {
    return <RedirectingSkeleton />;
  }

  if (!isLoggedIn) {
    return <RedirectingSkeleton label="Redirecting to sign in…" />;
  }

  if (profile?.role === 'admin' && requiredRole && requiredRole !== 'admin') {
    return <RedirectingSkeleton />;
  } else if (profile?.role !== 'admin' && requiredRole && profile?.role && profile?.role !== requiredRole) {
    return <RedirectingSkeleton />;
  }

  return <>{children}</>;
}
