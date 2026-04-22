'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// ---------------------------------------------------------------------------
// SignupPage — refactored for instant redirect.
//
// OLD: client signUp → await createProfile server action → toast → router.push
//      Then onAuthStateChange fires AGAIN → fetchProfile (duplicate DB call)
//      Total: 3 sequential network round-trips before the user sees anything.
//
// NEW: client signUp (sets JWT metadata with role) → router.push immediately
//      createProfile runs in the BACKGROUND (fire-and-forget)
//      onAuthStateChange builds optimistic profile from JWT — zero wait.
//      Total: 1 network call before the user is redirected.
// ---------------------------------------------------------------------------

function dashboardForRole(role: 'customer' | 'employee') {
  return role === 'employee' ? '/homepage' : '/dashboard';
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'customer' | 'employee'>('customer');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFullName = fullName.trim();

    if (!normalizedEmail || !password || !normalizedFullName) {
      toast.error('Email, password, and full name are required');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // ── Step 1: Register with Supabase Auth ──────────────────────────────
      // user_metadata (role, full_name) is embedded in the JWT and returned
      // instantly. We don't need to wait for the DB profile to exist before
      // redirecting — authContext will derive the optimistic profile from it.
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: normalizedFullName,
            role,
          },
        },
      });

      if (error) {
        toast.error(error.message || 'Sign up failed');
        return;
      }

      // ── Step 2: Fire-and-forget profile creation ─────────────────────────
      // We do NOT await this. The dashboard will work with the JWT metadata
      // while the DB row is being created in the background. If it fails,
      // authContext's fetchProfile will retry on the next page load.
      if (data.user) {
        import('@/app/actions/auth').then(({ createProfile }) => {
          createProfile({
            id: data.user!.id,
            fullName: normalizedFullName,
            role,
          }).catch((err) => {
            // Non-fatal: profile can be created on next login via upsert.
            console.warn('[signup] Background profile creation failed:', err);
          });
        });
      }

      // ── Step 3: Redirect immediately ─────────────────────────────────────
      toast.success('Account created!');
      router.push(dashboardForRole(role));
    } catch (err: any) {
      toast.error(err?.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .signup-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg);
          font-family: var(--font);
        }
        .signup-panel-left {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: var(--md-space-12) 48px;
          background: linear-gradient(135deg, var(--blue-800) 0%, var(--blue-600) 60%, var(--blue-400) 100%);
          overflow: hidden;
        }
        .signup-panel-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='28' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/%3E%3C/svg%3E") repeat;
          pointer-events: none;
        }
        .signup-panel-left::after {
          content: '';
          position: absolute;
          bottom: -140px; right: -100px;
          width: 440px; height: 440px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          pointer-events: none;
        }
        .signup-brand {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; position: relative; z-index: 1;
        }
        .signup-brand-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(255,255,255,0.18);
          border: 1.5px solid rgba(255,255,255,0.28);
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px);
        }
        .signup-brand-name { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }

        .signup-left-content {
          flex: 1; display: flex; flex-direction: column;
          justify-content: center; padding: 48px 0;
          position: relative; z-index: 1;
        }
        .signup-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(255,255,255,0.6);
          margin-bottom: var(--md-space-4);
        }
        .signup-headline {
          font-family: var(--md-font-display);
          font-size: clamp(28px, 3vw, 40px);
          font-weight: 700; line-height: 1.12;
          color: #fff; letter-spacing: -0.5px;
          margin: 0 0 var(--md-space-6);
        }
        .signup-headline span { opacity: 0.7; font-weight: 300; }
        .signup-body-text {
          font-size: 14px; color: rgba(255,255,255,0.65);
          line-height: 1.7; max-width: 340px; margin-bottom: var(--md-space-8);
        }
        .signup-benefits { display: flex; flex-direction: column; gap: 10px; }
        .benefit-card {
          display: flex; align-items: flex-start; gap: 12px;
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: var(--r-md);
          padding: 14px 16px; backdrop-filter: blur(4px);
          transition: background var(--md-duration-short) var(--md-motion-standard);
        }
        .benefit-card.active-benefit {
          background: rgba(255,255,255,0.16);
          border-color: rgba(255,255,255,0.28);
        }
        .benefit-icon {
          width: 34px; height: 34px; border-radius: 8px;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .benefit-text { flex: 1; }
        .benefit-title { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 2px; line-height: 1.3; }
        .benefit-desc { font-size: 11.5px; color: rgba(255,255,255,0.55); line-height: 1.5; }

        .signup-left-footer { display: flex; align-items: center; gap: var(--md-space-3); position: relative; z-index: 1; }
        .signup-avatars { display: flex; }
        .signup-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          border: 2px solid var(--blue-700);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: #fff;
          margin-left: -6px; background: var(--blue-500);
        }
        .signup-avatar:first-child { margin-left: 0; }
        .signup-avatar-b { background: var(--blue-400); }
        .signup-avatar-c { background: rgba(255,255,255,0.2); }
        .signup-footer-text { font-size: 12px; color: rgba(255,255,255,0.55); }
        .signup-footer-text strong { color: rgba(255,255,255,0.85); font-weight: 600; }

        /* Right panel */
        .signup-panel-right {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: var(--md-space-12) 48px;
          background: var(--surface); overflow-y: auto;
        }
        .signup-form-wrap {
          width: 100%; max-width: 390px;
          animation: md-fade-in var(--md-duration-medium) var(--md-motion-decelerate) both;
        }
        .signup-form-header { margin-bottom: var(--md-space-8); }
        .signup-form-title {
          font-family: var(--md-font-display);
          font-size: var(--md-text-headline-md);
          font-weight: 700; color: var(--text-1);
          margin: 0 0 var(--md-space-2); letter-spacing: -0.3px; line-height: 1.15;
        }
        .signup-form-sub { font-size: var(--md-text-body-md); color: var(--text-3); margin: 0; }
        .signup-form-sub a {
          color: var(--blue-600); text-decoration: none; font-weight: 600;
          transition: color var(--md-duration-short) var(--md-motion-standard);
        }
        .signup-form-sub a:hover { color: var(--blue-700); text-decoration: underline; }

        .role-toggle-wrap { margin-bottom: var(--md-space-5); }
        .role-toggle-label {
          display: block; font-size: 11px; font-weight: 600; color: var(--text-2);
          letter-spacing: 0.07em; text-transform: uppercase;
          margin-bottom: var(--md-space-2);
        }
        .role-toggle {
          display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
          background: var(--surface-2); border: 1.5px solid var(--divider);
          border-radius: var(--r-md); padding: 4px;
        }
        .role-btn {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 10px 14px; border-radius: calc(var(--r-md) - 2px);
          border: none; background: transparent;
          font-family: var(--font); font-size: 13px; font-weight: 500;
          color: var(--text-3); cursor: pointer;
          transition: all var(--md-duration-short) var(--md-motion-standard);
        }
        .role-btn:hover:not(.role-btn-active) {
          background: rgba(25,118,210,0.06); color: var(--text-2);
        }
        .role-btn-active {
          background: var(--surface); color: var(--blue-700); font-weight: 700;
          box-shadow: var(--e1); border: 1px solid var(--divider);
        }

        .signup-field { margin-bottom: var(--md-space-4); }
        .signup-label {
          display: block; font-size: 11px; font-weight: 600; color: var(--text-2);
          letter-spacing: 0.07em; text-transform: uppercase;
          margin-bottom: var(--md-space-2);
        }
        .signup-input-wrap { position: relative; }
        .signup-input {
          width: 100%; height: 46px;
          background: var(--surface-2); border: 1.5px solid var(--divider);
          border-radius: var(--r-md); color: var(--text-1);
          font-family: var(--font); font-size: 14px;
          padding: 0 46px 0 14px; outline: none;
          transition: border-color var(--md-duration-short) var(--md-motion-standard),
                      box-shadow var(--md-duration-short) var(--md-motion-standard),
                      background var(--md-duration-short) var(--md-motion-standard);
          box-sizing: border-box;
        }
        .signup-input::placeholder { color: var(--text-3); }
        .signup-input:hover { border-color: var(--blue-200); }
        .signup-input:focus {
          border-color: var(--blue-400); background: var(--surface);
          box-shadow: 0 0 0 3px rgba(33,150,243,0.12);
        }
        .signup-input-icon {
          position: absolute; right: 13px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-3); display: flex; align-items: center;
          pointer-events: none;
        }
        .signup-input-icon.clickable {
          pointer-events: auto; cursor: pointer;
          transition: color var(--md-duration-short) var(--md-motion-standard);
        }
        .signup-input-icon.clickable:hover { color: var(--blue-600); }

        .pw-strength { margin-top: 6px; display: flex; align-items: center; gap: 8px; }
        .pw-bars { display: flex; gap: 4px; flex: 1; }
        .pw-bar {
          flex: 1; height: 3px; border-radius: 2px; background: var(--divider);
          transition: background var(--md-duration-short) var(--md-motion-standard);
        }
        .pw-bar.fill-weak   { background: var(--error); }
        .pw-bar.fill-fair   { background: var(--warning); }
        .pw-bar.fill-strong { background: var(--success); }
        .pw-label { font-size: 11px; font-weight: 600; color: var(--text-3); min-width: 44px; text-align: right; }
        .pw-label.weak   { color: var(--error); }
        .pw-label.fair   { color: var(--warning); }
        .pw-label.strong { color: var(--success); }

        .signup-submit {
          width: 100%; height: 46px;
          background: var(--blue-600); border: none;
          border-radius: var(--r-md);
          font-family: var(--font); font-size: 14px; font-weight: 700; color: #fff;
          cursor: pointer; margin-top: var(--md-space-2);
          box-shadow: 0 4px 14px rgba(25,118,210,0.35);
          transition: background var(--md-duration-short) var(--md-motion-standard),
                      box-shadow var(--md-duration-short) var(--md-motion-standard),
                      transform var(--md-duration-short) var(--md-motion-emphasized);
          display: flex; align-items: center; justify-content: center;
          gap: 8px; letter-spacing: -0.01em;
        }
        .signup-submit:hover:not(:disabled) {
          background: var(--blue-700);
          box-shadow: 0 6px 20px rgba(25,118,210,0.4);
          transform: translateY(-1px);
        }
        .signup-submit:active:not(:disabled) { transform: scale(0.99); }
        .signup-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .signup-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: signup-spin 0.65s linear infinite;
        }
        @keyframes signup-spin { to { transform: rotate(360deg); } }

        .signup-divider {
          display: flex; align-items: center;
          gap: var(--md-space-3); margin: var(--md-space-5) 0;
        }
        .signup-divider-line { flex: 1; height: 1px; background: var(--divider); }
        .signup-divider-text { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; color: var(--text-3); }

        .signup-oauth {
          width: 100%; height: 46px;
          background: var(--surface); border: 1.5px solid var(--divider);
          border-radius: var(--r-md);
          font-family: var(--font); font-size: 13px; font-weight: 600; color: var(--text-2);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: var(--e1);
          transition: border-color var(--md-duration-short) var(--md-motion-standard),
                      box-shadow var(--md-duration-short) var(--md-motion-standard),
                      color var(--md-duration-short);
        }
        .signup-oauth:hover { border-color: var(--blue-200); box-shadow: var(--e2); color: var(--text-1); }

        .signup-login-nudge {
          margin-top: var(--md-space-6); text-align: center;
          font-size: 13px; color: var(--text-3);
        }
        .signup-login-nudge a {
          color: var(--blue-600); text-decoration: none; font-weight: 600;
          transition: color var(--md-duration-short);
        }
        .signup-login-nudge a:hover { color: var(--blue-700); text-decoration: underline; }
        .signup-terms {
          margin-top: var(--md-space-4); font-size: 11.5px; color: var(--text-3);
          text-align: center; line-height: 1.6;
        }
        .signup-terms a { color: var(--blue-600); text-decoration: none; transition: color var(--md-duration-short); }
        .signup-terms a:hover { color: var(--blue-700); text-decoration: underline; }

        @media (max-width: 768px) {
          .signup-shell { grid-template-columns: 1fr; }
          .signup-panel-left { display: none; }
          .signup-panel-right { padding: 40px 24px; }
        }
      `}</style>

      <div className="signup-shell">
        {/* Left panel */}
        <div className="signup-panel-left">
          <a href="/" className="signup-brand">
            <div className="signup-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 21l7-7m0 0l7.5-7.5M10 14l2-2m5.5-5.5L20 3M10 14L6 10l8.5-8.5 4 4L10 14z"
                  stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="signup-brand-name">CleanOps</span>
          </a>

          <div className="signup-left-content">
            <p className="signup-eyebrow">Join CleanOps today</p>
            <h1 className="signup-headline">
              Clean spaces,<br />
              <span>happy lives.</span>
            </h1>
            <p className="signup-body-text">
              Whether you're booking a clean or offering your services, CleanOps connects the right people at the right time.
            </p>
            <div className="signup-benefits">
              <div className={`benefit-card ${role === 'customer' ? 'active-benefit' : ''}`}>
                <div className="benefit-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 22V12h6v10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="benefit-text">
                  <p className="benefit-title">For customers</p>
                  <p className="benefit-desc">Book vetted cleaners, track jobs live, and pay only when you're satisfied.</p>
                </div>
              </div>
              <div className={`benefit-card ${role === 'employee' ? 'active-benefit' : ''}`}>
                <div className="benefit-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="#fff" strokeWidth="1.8"/>
                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="1" fill="#fff"/>
                  </svg>
                </div>
                <div className="benefit-text">
                  <p className="benefit-title">For employees</p>
                  <p className="benefit-desc">Browse available jobs, set your schedule, and get paid quickly and reliably.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="signup-left-footer">
            <div className="signup-avatars">
              <div className="signup-avatar">JR</div>
              <div className="signup-avatar signup-avatar-b">ML</div>
              <div className="signup-avatar signup-avatar-c">AK</div>
            </div>
            <p className="signup-footer-text">Join <strong>2,000+</strong> happy users</p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="signup-panel-right">
          <div className="signup-form-wrap">
            <div className="signup-form-header">
              <h2 className="signup-form-title">Create account</h2>
              <p className="signup-form-sub">
                Already have an account? <Link href="/login">Sign in</Link>
              </p>
            </div>

            <div className="role-toggle-wrap">
              <label className="role-toggle-label">I am a…</label>
              <div className="role-toggle">
                <button
                  type="button"
                  className={`role-btn ${role === 'customer' ? 'role-btn-active' : ''}`}
                  onClick={() => setRole('customer')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
                  </svg>
                  Customer
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === 'employee' ? 'role-btn-active' : ''}`}
                  onClick={() => setRole('employee')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    <circle cx="12" cy="14" r="1.5" fill="currentColor"/>
                  </svg>
                  Employee
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="signup-field">
                <label className="signup-label" htmlFor="fullName">Full name</label>
                <div className="signup-input-wrap">
                  <input
                    id="fullName" className="signup-input" type="text"
                    autoComplete="name" placeholder="John Doe"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                  />
                  <span className="signup-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.6"/>
                    </svg>
                  </span>
                </div>
              </div>

              <div className="signup-field">
                <label className="signup-label" htmlFor="email">Email</label>
                <div className="signup-input-wrap">
                  <input
                    id="email" className="signup-input" type="email"
                    autoComplete="email" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                  <span className="signup-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                      <path d="M22 7L12 13 2 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </span>
                </div>
              </div>

              <div className="signup-field">
                <label className="signup-label" htmlFor="password">Password</label>
                <div className="signup-input-wrap">
                  <input
                    id="password" className="signup-input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password" placeholder="Min. 6 characters"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    className="signup-input-icon clickable"
                    onClick={() => setShowPassword(!showPassword)}
                    role="button" aria-label="Toggle password visibility"
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

                {password.length > 0 && (() => {
                  const len = password.length;
                  const strength = len < 6 ? 'weak' : len < 10 ? 'fair' : 'strong';
                  const fills = strength === 'weak' ? 1 : strength === 'fair' ? 2 : 3;
                  return (
                    <div className="pw-strength">
                      <div className="pw-bars">
                        {[0, 1, 2].map(i => (
                          <div key={i} className={`pw-bar ${i < fills ? `fill-${strength}` : ''}`} />
                        ))}
                      </div>
                      <span className={`pw-label ${strength}`}>
                        {strength.charAt(0).toUpperCase() + strength.slice(1)}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <button type="submit" className="signup-submit" disabled={loading}>
                {loading ? (
                  <><div className="signup-spinner" />Creating account…</>
                ) : (
                  <>
                    Create account
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="signup-divider">
              <div className="signup-divider-line" />
              <span className="signup-divider-text">OR</span>
              <div className="signup-divider-line" />
            </div>

            <button type="button" className="signup-oauth">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.31a3.68 3.68 0 01-1.6 2.42v2h2.59c1.52-1.4 2.4-3.46 2.4-5.88z" fill="#4285F4"/>
                <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.59-2a4.8 4.8 0 01-7.15-2.52H.96v2.07A8 8 0 008 16z" fill="#34A853"/>
                <path d="M3.56 9.54A4.8 4.8 0 013.32 8c0-.53.09-1.05.24-1.54V4.39H.96A8 8 0 000 8c0 1.29.31 2.51.96 3.61l2.6-2.07z" fill="#FBBC05"/>
                <path d="M8 3.18c1.22 0 2.31.42 3.17 1.24l2.37-2.37A8 8 0 00.96 4.39l2.6 2.07A4.77 4.77 0 018 3.18z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <p className="signup-login-nudge">
              Already have an account? <Link href="/login">Sign in</Link>
            </p>

            <p className="signup-terms">
              By creating an account, you agree to our{' '}
              <Link href="/terms">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}