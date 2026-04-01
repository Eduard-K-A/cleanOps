'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type User, type Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { api } from './api';
import type { Profile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  mounted: boolean;
  loading: boolean; // Initial auth loading only
  profileLoading: boolean; // Profile-specific loading
  isLoggedIn: boolean;
  logout: () => Promise<void>;
  signOut: () => Promise<void>; // Alias for compatibility
  refetchProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>; // Alias for compatibility
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // ⚠️  Initial state MUST match server render (null / false) to avoid
  //     hydration mismatches.  localStorage is read in a useEffect below,
  //     which only runs on the client after hydration.
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Client-only cache seed ────────────────────────────────────────────────
  // Runs immediately after the first paint (before any network round-trip).
  // Sets profile + mounted from localStorage so protected pages skip the
  // loading skeleton on refresh / navigation without causing hydration errors.
  useEffect(() => {
    try {
      const role = localStorage.getItem('cleanops_role');
      const id   = localStorage.getItem('cleanops_role_id');
      if (role && id) {
        setProfile((prev) => prev ?? ({ role } as Profile));
        setMounted(true);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once, on mount only

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      setProfileLoading(true);
      const response = await api.getProfile(userId);
      if (response.success && response.data) {
        setProfile(response.data as Profile);
        // Cache the role for faster startup on next refresh
        if (typeof window !== 'undefined') {
          localStorage.setItem('cleanops_role', response.data.role);
          localStorage.setItem('cleanops_role_id', userId);
        }
      } else {
        setProfile(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cleanops_role');
          localStorage.removeItem('cleanops_role_id');
        }
      }
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refetchProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  // Alias for compatibility
  const refreshProfile = refetchProfile;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s ?? null);
      setUser(s?.user ?? null);

      // Clear profile on sign out or when there is no session
      if (event === 'SIGNED_OUT' || !s?.user?.id) {
        setProfile(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cleanops_role');
          localStorage.removeItem('cleanops_role_id');
        }
        setLoading(false);
        return;
      }

      // Fetch profile for signed in users
      if (s.user.id) {
        await fetchProfile(s.user.id);
      }
      
      // Set loading to false after initial auth check
      setLoading(false);
    });

    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      setUser(s?.user ?? null);
      
      if (s?.user?.id) {
        // Try to load cached role FIRST for instant access
        if (typeof window !== 'undefined') {
          const cachedRole = localStorage.getItem('cleanops_role');
          const cachedId = localStorage.getItem('cleanops_role_id');
          if (cachedRole && cachedId === s.user.id) {
            console.log('[AUTH] Role cache hit:', cachedRole);
            setProfile({ role: cachedRole } as Profile);
          }
        }
        
        // Then fetch fresh profile in background
        await fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false); // Set loading to false after initial check
      setMounted(true);
    })();

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    console.log('[DEBUG-LOGOUT] Pre-logout auth state:', { user, profile, session });
    await supabase.auth.signOut();
    // Clear any user-specific storage (sessionStorage/localStorage)
    if (typeof window !== 'undefined') {
      try {
        // Session storage (short-lived payment/session keys)
        for (const k of Object.keys(sessionStorage)) {
          if (k.startsWith('cleanops_') || k === 'cleanops_payment') sessionStorage.removeItem(k);
        }
      } catch (e) {}

      try {
        // Local storage entries
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith('cleanops_') || k.includes('payment') || k.includes('user')) localStorage.removeItem(k);
        }
      } catch (e) {}
    }

    // Optionally clear third-party caches if present (React Query / SWR)
    try {
      // If the app exposes a global QueryClient for convenience (not required), clear it
      const globalRQ = (window as any).__REACT_QUERY_CLIENT__;
      if (globalRQ) {
        try { globalRQ.clear?.(); } catch (e) {}
        try { globalRQ.removeQueries?.(); } catch (e) {}
      }
    } catch (e) {}

    // Reset in-memory auth state
    setUser(null);
    setProfile(null);
    setSession(null);
    console.log('[DEBUG-LOGOUT] Post-logout auth state:', { previousRole: profile?.role ?? null, currentRole: null });
  }, []);

  // Alias for compatibility
  const signOut = logout;

  // Log user role for debugging when profile changes
  useEffect(() => {
    if (profile) {
      console.log('User role:', profile.role);
    } else {
      console.log('User role: none');
    }
  }, [profile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        mounted,
        loading,
        profileLoading,
        isLoggedIn: !!user,
        logout,
        signOut,
        refetchProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
