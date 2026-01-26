"use client"

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/authContext'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { isLoggedIn, mounted, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center"> 
          <Link href="/homepage" className="no-underline">
            <span className="font-bold text-lg text-slate-900">cleanOps</span>
          </Link>
        </div>

        <nav className="flex gap-3 items-center">
          <Link href="/homepage" className="text-slate-500 no-underline px-2.5 py-2 rounded-lg text-base hover:text-slate-700 transition-colors">Homepage</Link>
          <Link href="/customer/order" className="text-slate-500 no-underline px-2.5 py-2 rounded-lg text-base hover:text-slate-700 transition-colors">Clean</Link>
          <Link href="/customer/requests" className="text-slate-500 no-underline px-2.5 py-2 rounded-lg text-base hover:text-slate-700 transition-colors">My Requests</Link>
          <Link href="/customer/dashboard" className="text-slate-500 no-underline px-2.5 py-2 rounded-lg text-base hover:text-slate-700 transition-colors"> My Dashboard</Link>
                </nav>

        <div>
          {mounted && (
            !isLoggedIn ? (
              <Link href="/login" className="bg-sky-500 text-white px-3 py-2 rounded-lg no-underline font-semibold text-base">
                Sign in
              </Link>
            ) : (
              <button onClick={handleLogout} className="bg-sky-500 text-white px-3 py-2 rounded-lg font-semibold text-base border-none cursor-pointer">
                Sign out
              </button>
            )
          )}
        </div>
      </div>
    </header>
  )
}