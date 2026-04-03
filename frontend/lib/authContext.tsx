'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { type User, type Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { api } from './api';
import { syncJwtMetadata } from './authUtils';
import type { Profile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  mounted: boolean;
  loading: boolean;
  profileLoading: boolean;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Build a lightweight "optimistic" profile from the JWT user_metadata.
// This is available instantly after sign-in/sign-up with zero extra network
// calls. The real DB profile is fetched in the background and replaces this.
// ---------------------------------------------------------------------------
function buildOptimisticProfile(user: User): Profile | null {
  const meta = user.user_metadata ?? {};
  if (!meta.role) return null;
  return {
    id: user.id,
    role: meta.role as 'customer' | 'employee' | 'admin',
    full_name: meta.full_name ?? '',
    email: user.email ?? '',
    // all other optional fields stay undefined — pages must handle that
  } as unknown as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Client-only cache seed ─────────────────────────────────────────────
  // Seeds role from localStorage so pages survive a hard-refresh without a
  // flash of "not logged in". Does NOT set mounted — that is the job of the
  // onAuthStateChange handler below.
  useEffect(() => {
    try {
      const role = localStorage.getItem('cleanops_role');
      const id = localStorage.getItem('cleanops_role_id');
      if (role && id) {
        setProfile((prev) => prev ?? ({ role } as Profile));
      }
    } catch {}
  }, []);

  // ── Fetch the real DB profile in the background ────────────────────────
  // KEY CHANGE: we no longer set profile to null on failure. If the DB call
  // fails (404 race during sign-up, network hiccup, etc.) we keep whatever
  // optimistic/cached value we already have. Only an explicit sign-out clears it.
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      setProfileLoading(true);
      const response = await api.getProfile(userId);
      if (response.success && response.data) {
        setProfile(response.data as Profile);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cleanops_role', response.data.role);
          localStorage.setItem('cleanops_role_id', userId);
        }

        // SYNC JWT METADATA: Keep JWT in sync with database role
        // This ensures JWT metadata is always reliable for authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && session.user.id === userId) {
          await syncJwtMetadata(session.user);
        }
      }
      // Do NOT set profile=null here. A 404 during sign-up is normal
      // (profile row may not exist yet). Keep the optimistic value.
    } catch {
      // Silently keep existing optimistic profile on error.
    } finally {
      setProfileLoading(false);
    }
  }, [supabase]);

  const refetchProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  const refreshProfile = refetchProfile;

  // ── Auth state listener ────────────────────────────────────────────────
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      try {
        setSession(s ?? null);
        setUser(s?.user ?? null);

        if (event === 'SIGNED_OUT' || !s?.user?.id) {
          // Explicit sign-out: clear everything.
          setProfile(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('cleanops_role');
            localStorage.removeItem('cleanops_role_id');
          }
          setLoading(false);
          setMounted(true);
          return;
        }

        // ── CRITICAL CHANGE ──────────────────────────────────────────────
        // 1. Set optimistic profile from JWT metadata — zero latency.
        // 2. Flip mounted=true and loading=false IMMEDIATELY so the UI
        //    can render and redirect without waiting for the DB round-trip.
        // 3. Kick off the real profile fetch in the BACKGROUND.
        // ─────────────────────────────────────────────────────────────────
        const optimistic = buildOptimisticProfile(s.user);
        if (optimistic) {
          setProfile((prev) => {
            // Don't downgrade a richer existing profile with an optimistic one
            if (prev?.id === s.user.id && prev.full_name) return prev;
            return optimistic;
          });
        }

        setLoading(false);
        setMounted(true);

        // Background fetch — result will update profile state when ready.
        fetchProfile(s.user.id);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('[authContext] onAuthStateChange error:', err);
        }
        setLoading(false);
        setMounted(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();

    if (typeof window !== 'undefined') {
      try {
        for (const k of Object.keys(sessionStorage)) {
          if (k.startsWith('cleanops_')) sessionStorage.removeItem(k);
        }
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith('cleanops_') || k.includes('payment') || k.includes('user'))
            localStorage.removeItem(k);
        }
      } catch {}
    }

    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  const signOut = logout;

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