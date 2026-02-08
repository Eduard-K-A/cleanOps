'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type User, type Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { api, cacheManager } from './api';
import type { Profile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  mounted: boolean;
  loading: boolean; // Added for compatibility
  isLoggedIn: boolean;
  logout: () => Promise<void>;
  signOut: () => Promise<void>; // Alias for compatibility
  refetchProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>; // Alias for compatibility
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (_userId: string) => {
    try {
      setLoading(true);
      const response = await api.getProfile();
      if (response.success && response.data) {
        setProfile(response.data as Profile);
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
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
        setLoading(false);
        return;
      }

      // Fetch profile for signed in users
      if (s.user.id) {
        await fetchProfile(s.user.id);
      }
    });

    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user?.id) {
        // Ensure stale cached profile is cleared when session changes
        try {
          cacheManager.invalidate('/auth/me');
        } catch (e) {
          // ignore cache errors
        }
        await fetchProfile(s.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
      setMounted(true);
    })();

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    console.log('[DEBUG-LOGOUT] Pre-logout auth state:', { user, profile, session });
    await supabase.auth.signOut();
    // Clear cached profile so next login fetches fresh data
    try {
      cacheManager.invalidate('/auth/me');
    } catch (e) {
      // swallow
    }
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
