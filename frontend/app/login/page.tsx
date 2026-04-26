'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';

// ---------------------------------------------------------------------------
// LoginPage — refactored for instant redirect.
//
// OLD: signIn → wait for onAuthStateChange → wait for fetchProfile → useEffect
//      detects profile → router.push                    (up to 2-3s)
//
// NEW: signIn → read role from the JWT that Supabase returns RIGHT NOW →
//      router.push immediately                           (~0ms extra)
//
// The authContext picks up the session via onAuthStateChange in the background
// and loads the full DB profile without blocking the user at all.
// ---------------------------------------------------------------------------

function dashboardForRole(role?: string) {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'employee':
      return '/homepage';
    default:
      return '/dashboard';
  }
}

export default function LoginPage() {
  const { navigate, prefetch } = useOptimizedNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    prefetch('/signup');
    prefetch('/forgot-password');
  }, [prefetch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!normalizedEmail || !password) {
      toast.error('Email and password are required');
      return;
    }

    // Basic validation: password length for login attempts
    if (password.length < 8) {
      toast.error('Invalid email or password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        toast.error(error.message ?? 'Sign in failed');
        setLoading(false);
        return;
      }

      // ── ADMIN ONLY ENFORCEMENT ──────────────────────────────────────────
      const role = data.session?.user?.user_metadata?.role as string | undefined;
      
      if (role !== 'admin') {
        // Log them out immediately
        await supabase.auth.signOut();
        toast.error('Use the mobile app for customer/employee accounts.');
        setLoading(false);
        return;
      }

      toast.success('Admin access granted!');
      navigate('/admin/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed');
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .login-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg);
          font-family: var(--font);
        }
        .login-panel-left {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: var(--md-space-12) 48px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          overflow: hidden;
        }
        .login-panel-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='28' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/svg%3E") repeat;
          pointer-events: none;
        }
        .left-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          position: relative;
          z-index: 1;
        }
        .left-brand-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: rgba(255,255,255,0.1);
          border: 1.5px solid rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px);
        }
        .left-brand-name { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }
        .left-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 0;
          position: relative;
          z-index: 1;
        }
        .left-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(255,255,255,0.5);
          margin-bottom: var(--md-space-4);
        }
        .left-headline {
          font-family: var(--md-font-display);
          font-size: clamp(28px, 3vw, 40px);
          font-weight: 700; line-height: 1.12;
          color: #fff; letter-spacing: -0.5px;
          margin: 0 0 var(--md-space-6);
        }
        .left-body-text {
          font-size: 14px; color: rgba(255,255,255,0.6);
          line-height: 1.7; max-width: 340px;
          margin-bottom: var(--md-space-10);
        }
        
        .login-panel-right {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: var(--md-space-12) 48px;
          background: var(--surface);
        }
        .login-form-wrap {
          width: 100%; max-width: 390px;
          animation: md-fade-in var(--md-duration-medium) var(--md-motion-decelerate) both;
        }
        .login-form-header { margin-bottom: var(--md-space-8); }
        .login-form-title {
          font-family: var(--md-font-display);
          font-size: var(--md-text-headline-md);
          font-weight: 700; color: var(--text-1);
          margin: 0 0 var(--md-space-2);
          letter-spacing: -0.3px; line-height: 1.15;
        }
        .login-form-sub { font-size: var(--md-text-body-md); color: var(--text-3); margin: 0; }

        .login-field { margin-bottom: var(--md-space-4); }
        .login-label {
          display: block;
          font-size: 11px; font-weight: 600; color: var(--text-2);
          letter-spacing: 0.07em; text-transform: uppercase;
          margin-bottom: var(--md-space-2);
        }
        .login-input-wrap { position: relative; }
        .login-input {
          width: 100%; height: 46px;
          background: var(--surface-2);
          border: 1.5px solid var(--divider);
          border-radius: var(--r-md);
          color: var(--text-1); font-family: var(--font); font-size: 14px;
          padding: 0 46px 0 14px; outline: none;
          box-sizing: border-box;
        }
        .login-input:focus {
          border-color: var(--blue-400); background: var(--surface);
          box-shadow: 0 0 0 3px rgba(33,150,243,0.12);
        }
        .login-input-icon {
          position: absolute; right: 13px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-3); display: flex; align-items: center;
        }

        .login-submit {
          width: 100%; height: 46px;
          background: #0f172a; border: none;
          border-radius: var(--r-md);
          font-family: var(--font); font-size: 14px; font-weight: 700; color: #fff;
          cursor: pointer; margin-top: var(--md-space-4);
          transition: background 0.2s;
          display: flex; align-items: center; justify-content: center;
          gap: 8px;
        }
        .login-submit:hover:not(:disabled) { background: #1e293b; }
        .login-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        
        @keyframes login-spin { to { transform: rotate(360deg); } }
        .login-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: login-spin 0.65s linear infinite;
        }

        @media (max-width: 768px) {
          .login-shell { grid-template-columns: 1fr; }
          .login-panel-left { display: none; }
          .login-panel-right { padding: 40px 24px; }
        }
      `}</style>

      <div className="login-shell">
        <div className="login-panel-left">
          <Link href="/homepage" className="left-brand">
            <div className="left-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 21l7-7m0 0l7.5-7.5M10 14l2-2m5.5-5.5L20 3M10 14L6 10l8.5-8.5 4 4L10 14z"
                  stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="left-brand-name">CleanOps</span>
          </Link>

          <div className="left-content">
            <p className="left-eyebrow">Administration Portal</p>
            <h1 className="left-headline">
              Management &<br />
              <span>Oversight</span>
            </h1>
            <p className="left-body-text">
              Secure access for CleanOps administrators to manage operations, resolve disputes, and oversee platform growth.
            </p>
          </div>
        </div>

        <div className="login-panel-right">
          <div className="login-form-wrap">
            <div className="login-form-header">
              <h2 className="login-form-title">Admin Login</h2>
              <p className="login-form-sub">
                Enterprise management console
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-label" htmlFor="email">Admin Email</label>
                <div className="login-input-wrap">
                  <input
                    id="email"
                    className="login-input"
                    type="email"
                    placeholder="admin@cleanops.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <span className="login-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                      <path d="M22 7L12 13 2 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </span>
                </div>
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="password">Password</label>
                <div className="login-input-wrap">
                  <input
                    id="password"
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    className="login-input-icon clickable"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" strokeLinecap="round"/>
                      </svg>
                    )}
                  </span>
                </div>
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? <div className="login-spinner" /> : 'Enter Portal'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
