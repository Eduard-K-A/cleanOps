'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Link from 'next/link'

function CustomerDashboardContent() {
  return (
    <main className="max-w-5xl mx-auto px-5 py-7">
      <div className="mb-5">
        <h1 className="m-0 text-2xl font-bold">Welcome back, Customer</h1>
        <p className="mt-1.5 text-gray-500">Overview of your recent orders and activity.</p>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4.5 items-start">
        <div className="bg-white rounded-lg p-4.5 shadow-sm">
          <h2 className="m-0 text-lg font-semibold">Active Orders</h2>
          <ul className="mt-3 p-0 list-none flex flex-col gap-2.5">
            <li className="bg-slate-100 p-3 rounded-lg text-slate-900">Order #1024 — Kitchen deep clean — In progress</li>
            <li className="bg-slate-100 p-3 rounded-lg text-slate-900">Order #1019 — Office weekly — Scheduled</li>
            <li className="bg-slate-100 p-3 rounded-lg text-slate-900">Order #1007 — Window cleaning — Completed</li>
          </ul>
        </div>

        <aside className="flex flex-col gap-3">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h3 className="m-0 mb-2 text-sm font-semibold">Quick actions</h3>
            <Link href="/customer/order" className="block w-full p-2.5 bg-sky-500 text-white rounded-lg mb-2 cursor-pointer font-semibold hover:bg-sky-600 transition-colors text-center">Create order</Link>
            <Link href="/customer/payment" className="block w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg cursor-pointer font-semibold hover:bg-slate-50 transition-colors text-center">View invoices</Link>
          </div>

          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h3 className="m-0 mb-2 text-sm font-semibold">Account</h3>
            <p className="m-0">Plan: Business</p>
            <p className="m-0">Next billing: 2026-02-01</p>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default function CustomerDashboardPage() {
  return (
    <ProtectedRoute>
      <CustomerDashboardContent />
    </ProtectedRoute>
  )
}
