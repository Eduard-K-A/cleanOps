'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { UserProfileButton } from './UserProfileButton';

export default function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn, mounted, profile } = useAuth();

  if (pathname !== '/homepage' && pathname !== '/login' && pathname !== '/signup') {
    return null;
  }

  const employeeLinks = [
    { href: '/homepage', label: 'Home' },
    { href: '/employee/feed', label: 'Jobs' },
    { href: '/employee/dashboard', label: 'Dashboard' },
  ];

  const customerLinks = [
    { href: '/homepage', label: 'Home' },
    { href: '/customer/order', label: 'Book service' },
    { href: '/customer/requests', label: 'My requests' },
    { href: '/customer/dashboard', label: 'Dashboard' },
  ];

  const links = !mounted || !isLoggedIn
    ? customerLinks
    : profile?.role === 'employee'
    ? employeeLinks
    : customerLinks;

  return (
    <>
      <style>{`
        .pub-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          height: var(--nav-h);
          background: var(--surface);
          border-bottom: 1px solid var(--divider);
          box-shadow: var(--e1);
          display: flex;
          align-items: center;
          padding: 0 40px;
          gap: 0;
          font-family: var(--font);
        }

        .pub-nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          margin-right: 48px;
          flex-shrink: 0;
        }
        .pub-nav-brand-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--blue-600), var(--blue-400));
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(33,150,243,0.35);
        }
        .pub-nav-brand-name {
          font-size: 17px; font-weight: 700;
          color: var(--blue-800);
          letter-spacing: -0.3px;
        }

        .pub-nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
        }

        .pub-nav-link {
          display: flex; align-items: center;
          padding: 8px 16px;
          border-radius: var(--r-full);
          font-size: 14px; font-weight: 500;
          color: var(--text-2);
          text-decoration: none;
          transition: background var(--md-duration-short) var(--md-motion-standard),
                      color var(--md-duration-short) var(--md-motion-standard);
          white-space: nowrap;
          position: relative;
        }
        .pub-nav-link:hover {
          background: var(--blue-50);
          color: var(--blue-700);
        }
        .pub-nav-link.active {
          background: var(--blue-50);
          color: var(--blue-700);
          font-weight: 600;
        }
        .pub-nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -20px; left: 50%;
          transform: translateX(-50%);
          width: 22px; height: 3px;
          border-radius: 3px 3px 0 0;
          background: var(--blue-500);
        }

        .pub-nav-spacer { flex: 1; }

        .pub-nav-signin {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 20px;
          border-radius: var(--r-full);
          background: var(--blue-600);
          color: #fff;
          font-family: var(--font);
          font-size: 13px; font-weight: 700;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(25,118,210,0.35);
          transition: background var(--md-duration-short) var(--md-motion-standard),
                      box-shadow var(--md-duration-short) var(--md-motion-standard),
                      transform var(--md-duration-short) var(--md-motion-emphasized);
          white-space: nowrap;
        }
        .pub-nav-signin:hover {
          background: var(--blue-700);
          box-shadow: 0 4px 14px rgba(25,118,210,0.4);
          transform: translateY(-1px);
        }

        /* Offset page content so it isn't hidden under fixed nav */
        .pub-nav-offset { height: var(--nav-h); }
      `}</style>

      <header className="pub-nav">
        {/* Brand */}
        <Link href="/homepage" className="pub-nav-brand">
          <span className="pub-nav-brand-name">CleanOps</span>
        </Link>

        {/* Nav links */}
        <nav className="pub-nav-links">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`pub-nav-link${pathname === href ? ' active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="pub-nav-spacer" />

        {/* Right action */}
        {mounted && isLoggedIn ? (
          <UserProfileButton />
        ) : (
          <Link href="/login" className="pub-nav-signin">
            Sign in
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        )}
      </header>

      {/* Spacer to push page content below the fixed nav */}
      <div className="pub-nav-offset" />
    </>
  );
}