'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

export default function Navbar() {
  const router = useRouter();
  const { isLoggedIn, mounted, logout, profile } = useAuth();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/homepage" className="font-bold text-lg text-slate-900 no-underline">
          CleanOps
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/homepage" className="rounded-lg px-2.5 py-2 text-slate-500 no-underline hover:text-slate-700">
            Home
          </Link>

          {profile?.role === 'employee' ? (
            <>
            <Link href="/employee/feed" className="rounded-lg px-2.5 py-2 text-slate-500 no-underline hover:text-slate-700">
              Jobs feed
            </Link>
              <Link href="/employee/history" className="rounded-lg px-2.5 py-2 text-slate-500 no-underline hover:text-slate-700">
              My Activities
            </Link>
            </>
          ) : (
            <>
              <Link href="/customer/order" className="rounded-lg px-2.5 py-2 text-slate-500 no-underline hover:text-slate-700">
                Book
              </Link>
              <Link href="/customer/requests" className="rounded-lg px-2.5 py-2 text-slate-500 no-underline hover:text-slate-700">
                My requests
              </Link>
              <Link href="/customer/dashboard" className="rounded-lg px-2.5 py-2 text-slate-500 no-underline hover:text-slate-700">
                Dashboard
              </Link>
            </>
          )}
        </nav>

        <div>
          {mounted &&
            (isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="cursor-pointer rounded-lg border-none bg-sky-500 px-3 py-2 font-semibold text-white hover:bg-sky-600"
              >
                Sign out
              </button>
            ) : (
              <Link href="/login" className="rounded-lg bg-sky-500 px-3 py-2 font-semibold text-white no-underline hover:bg-sky-600">
                Sign in
              </Link>
            ))}
        </div>
      </div>
    </header>
  );
}
