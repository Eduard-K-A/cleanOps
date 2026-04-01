'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Email and password required');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(error.message ?? 'Sign in failed');
        setLoading(false);
        return;
      }
      try {
        const profileResponse = await api.getProfile();
        if (profileResponse.success && profileResponse.data) {
          const profile = profileResponse.data;
          const dashboardPath =
            profile.role === 'employee' ? '/homepage' : '/dashboard';
          toast.success('Signed in successfully');
          router.push(dashboardPath);
        } else {
          toast.error('Failed to load profile');
          setLoading(false);
        }
      } catch {
        toast.error('Failed to load profile');
        setLoading(false);
      }
    } catch {
      toast.error('Sign in failed');
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

        /* ── Left brand panel ── */
        .login-panel-left {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: var(--md-space-12) 48px;
          background: linear-gradient(135deg, var(--blue-800) 0%, var(--blue-600) 60%, var(--blue-400) 100%);
          overflow: hidden;
        }
        .login-panel-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='28' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/%3E%3C/svg%3E") repeat;
          pointer-events: none;
        }
        .login-panel-left::after {
          content: '';
          position: absolute;
          bottom: -140px;
          right: -100px;
          width: 440px;
          height: 440px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
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
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255,255,255,0.18);
          border: 1.5px solid rgba(255,255,255,0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }
        .left-brand-name {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.3px;
        }

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
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.6);
          margin-bottom: var(--md-space-4);
        }
        .left-headline {
          font-family: var(--md-font-display);
          font-size: clamp(28px, 3vw, 40px);
          font-weight: 700;
          line-height: 1.12;
          color: #fff;
          letter-spacing: -0.5px;
          margin: 0 0 var(--md-space-6);
        }
        .left-headline span {
          opacity: 0.7;
          font-weight: 300;
        }
        .left-body-text {
          font-size: 14px;
          color: rgba(255,255,255,0.65);
          line-height: 1.7;
          max-width: 340px;
          margin-bottom: var(--md-space-10);
        }

        .left-stats {
          display: flex;
          align-items: center;
          gap: var(--md-space-6);
        }
        .left-stat { display: flex; flex-direction: column; gap: 2px; }
        .left-stat-num {
          font-family: var(--md-font-display);
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          line-height: 1;
        }
        .left-stat-label { font-size: 11px; color: rgba(255,255,255,0.55); letter-spacing: 0.04em; }
        .left-stat-divider { width: 1px; height: 34px; background: rgba(255,255,255,0.15); }

        .left-footer {
          display: flex;
          align-items: center;
          gap: var(--md-space-3);
          position: relative;
          z-index: 1;
        }
        .left-avatars { display: flex; }
        .left-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 2px solid var(--blue-700);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: #fff;
          margin-left: -6px;
          background: var(--blue-500);
        }
        .left-avatar:first-child { margin-left: 0; }
        .left-avatar-b { background: var(--blue-400); }
        .left-avatar-c { background: rgba(255,255,255,0.2); }
        .left-footer-text { font-size: 12px; color: rgba(255,255,255,0.55); }
        .left-footer-text strong { color: rgba(255,255,255,0.85); font-weight: 600; }

        /* ── Right form panel ── */
        .login-panel-right {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--md-space-12) 48px;
          background: var(--surface);
        }

        .login-form-wrap {
          width: 100%;
          max-width: 390px;
          animation: md-fade-in var(--md-duration-medium) var(--md-motion-decelerate) both;
        }

        .login-form-header { margin-bottom: var(--md-space-8); }

        .login-form-title {
          font-family: var(--md-font-display);
          font-size: var(--md-text-headline-md);
          font-weight: 700;
          color: var(--text-1);
          margin: 0 0 var(--md-space-2);
          letter-spacing: -0.3px;
          line-height: 1.15;
        }
        .login-form-sub { font-size: var(--md-text-body-md); color: var(--text-3); margin: 0; }
        .login-form-sub a {
          color: var(--blue-600);
          text-decoration: none;
          font-weight: 600;
          transition: color var(--md-duration-short) var(--md-motion-standard);
        }
        .login-form-sub a:hover { color: var(--blue-700); text-decoration: underline; }

        /* Fields */
        .login-field { margin-bottom: var(--md-space-4); }
        .login-field-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--md-space-2);
        }
        .login-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-2);
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: var(--md-space-2);
        }
        .login-input-wrap { position: relative; }
        .login-input {
          width: 100%;
          height: 46px;
          background: var(--surface-2);
          border: 1.5px solid var(--divider);
          border-radius: var(--r-md);
          color: var(--text-1);
          font-family: var(--font);
          font-size: 14px;
          padding: 0 46px 0 14px;
          outline: none;
          transition: border-color var(--md-duration-short) var(--md-motion-standard),
                      box-shadow var(--md-duration-short) var(--md-motion-standard),
                      background var(--md-duration-short) var(--md-motion-standard);
          box-sizing: border-box;
        }
        .login-input::placeholder { color: var(--text-3); }
        .login-input:hover { border-color: var(--blue-200); }
        .login-input:focus {
          border-color: var(--blue-400);
          background: var(--surface);
          box-shadow: 0 0 0 3px rgba(33,150,243,0.12);
        }
        .login-input-icon {
          position: absolute;
          right: 13px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-3);
          display: flex;
          align-items: center;
          pointer-events: none;
        }
        .login-input-icon.clickable {
          pointer-events: auto;
          cursor: pointer;
          transition: color var(--md-duration-short) var(--md-motion-standard);
        }
        .login-input-icon.clickable:hover { color: var(--blue-600); }

        .login-forgot {
          font-size: 12px;
          color: var(--text-3);
          text-decoration: none;
          font-weight: 500;
          transition: color var(--md-duration-short) var(--md-motion-standard);
        }
        .login-forgot:hover { color: var(--blue-600); }

        /* Submit */
        .login-submit {
          width: 100%;
          height: 46px;
          background: var(--blue-600);
          border: none;
          border-radius: var(--r-md);
          font-family: var(--font);
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          margin-top: var(--md-space-2);
          box-shadow: 0 4px 14px rgba(25,118,210,0.35);
          transition: background var(--md-duration-short) var(--md-motion-standard),
                      box-shadow var(--md-duration-short) var(--md-motion-standard),
                      transform var(--md-duration-short) var(--md-motion-emphasized);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: -0.01em;
        }
        .login-submit:hover:not(:disabled) {
          background: var(--blue-700);
          box-shadow: 0 6px 20px rgba(25,118,210,0.4);
          transform: translateY(-1px);
        }
        .login-submit:active:not(:disabled) { transform: scale(0.99); }
        .login-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .login-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: login-spin 0.65s linear infinite;
        }
        @keyframes login-spin { to { transform: rotate(360deg); } }

        /* Divider */
        .login-divider {
          display: flex;
          align-items: center;
          gap: var(--md-space-3);
          margin: var(--md-space-5) 0;
        }
        .login-divider-line { flex: 1; height: 1px; background: var(--divider); }
        .login-divider-text {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--text-3);
        }

        /* OAuth */
        .login-oauth {
          width: 100%;
          height: 46px;
          background: var(--surface);
          border: 1.5px solid var(--divider);
          border-radius: var(--r-md);
          font-family: var(--font);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: var(--e1);
          transition: border-color var(--md-duration-short) var(--md-motion-standard),
                      box-shadow var(--md-duration-short) var(--md-motion-standard),
                      color var(--md-duration-short);
        }
        .login-oauth:hover {
          border-color: var(--blue-200);
          box-shadow: var(--e2);
          color: var(--text-1);
        }

        /* Signup nudge */
        .login-signup-nudge {
          margin-top: var(--md-space-6);
          text-align: center;
          font-size: 13px;
          color: var(--text-3);
        }
        .login-signup-nudge a {
          color: var(--blue-600);
          text-decoration: none;
          font-weight: 600;
          transition: color var(--md-duration-short);
        }
        .login-signup-nudge a:hover { color: var(--blue-700); text-decoration: underline; }

        @media (max-width: 768px) {
          .login-shell { grid-template-columns: 1fr; }
          .login-panel-left { display: none; }
          .login-panel-right { padding: 40px 24px; }
        }
      `}</style>

      <div className="login-shell">

        {/* Left panel */}
        <div className="login-panel-left">
          <a href="/" className="left-brand">
        
            <span className="left-brand-name">CleanOps</span>
          </a>

          <div className="left-content">
            <p className="left-eyebrow">Professional cleaning</p>
            <h1 className="left-headline">
              Your space,<br />
              <span>spotless</span> every time.
            </h1>
            <p className="left-body-text">
              Book vetted cleaners, track jobs in real time, and approve work before you pay — all from one dashboard.
            </p>
            <div className="left-stats">
              <div className="left-stat">
                <span className="left-stat-num">4.9★</span>
                <span className="left-stat-label">Avg. rating</span>
              </div>
              <div className="left-stat-divider" />
              <div className="left-stat">
                <span className="left-stat-num">2k+</span>
                <span className="left-stat-label">Jobs done</span>
              </div>
              <div className="left-stat-divider" />
              <div className="left-stat">
                <span className="left-stat-num">98%</span>
                <span className="left-stat-label">Satisfaction</span>
              </div>
            </div>
          </div>

          <div className="left-footer">
            <div className="left-avatars">
              <div className="left-avatar">JR</div>
              <div className="left-avatar left-avatar-b">ML</div>
              <div className="left-avatar left-avatar-c">AK</div>
            </div>
            <p className="left-footer-text">
              Trusted by <strong>2,000+</strong> households
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="login-panel-right">
          <div className="login-form-wrap">

            <div className="login-form-header">
              <h2 className="login-form-title">Welcome back</h2>
              <p className="login-form-sub">
                No account yet?{' '}
                <Link href="/signup">Create one free</Link>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-label" htmlFor="email">Email</label>
                <div className="login-input-wrap">
                  <input
                    id="email"
                    className="login-input"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
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
                <div className="login-field-row">
                  <label className="login-label" htmlFor="password" style={{ marginBottom: 0 }}>
                    Password
                  </label>
                  <Link href="/forgot-password" className="login-forgot">
                    Forgot password?
                  </Link>
                </div>
                <div className="login-input-wrap">
                  <input
                    id="password"
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    className="login-input-icon clickable"
                    onClick={() => setShowPassword(!showPassword)}
                    role="button"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="1.6"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
                          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                    )}
                  </span>
                </div>
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? (
                  <><div className="login-spinner" />Signing in…</>
                ) : (
                  <>
                    Sign in
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">OR</span>
              <div className="login-divider-line" />
            </div>

            <button type="button" className="login-oauth">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.31a3.68 3.68 0 01-1.6 2.42v2h2.59c1.52-1.4 2.4-3.46 2.4-5.88z" fill="#4285F4"/>
                <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.59-2a4.8 4.8 0 01-7.15-2.52H.96v2.07A8 8 0 008 16z" fill="#34A853"/>
                <path d="M3.56 9.54A4.8 4.8 0 013.32 8c0-.53.09-1.05.24-1.54V4.39H.96A8 8 0 000 8c0 1.29.31 2.51.96 3.61l2.6-2.07z" fill="#FBBC05"/>
                <path d="M8 3.18c1.22 0 2.31.42 3.17 1.24l2.37-2.37A8 8 0 00.96 4.39l2.6 2.07A4.77 4.77 0 018 3.18z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <p className="login-signup-nudge">
              Don&apos;t have an account? <Link href="/signup">Sign up free</Link>
            </p>

          </div>
        </div>

      </div>
    </>
  );
}