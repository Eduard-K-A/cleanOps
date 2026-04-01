'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import Link from 'next/link'

function CustomerDashboardContent() {
  return (
    <div className="max-w-5xl mx-auto">
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4.5 items-start">
        <div className="bg-white rounded-lg p-4.5 shadow-sm">
          <h2 className="m-0 text-lg font-semibold">Active Orders</h2>
          <ul className="mt-3 p-0 list-none flex flex-col gap-2.5">
            <li className="bg-slate-100 p-3 rounded-lg text-slate-900">Order #1024 — Kitchen deep clean — In progress</li>
            <li className="bg-slate-100 p-3 rounded-lg text-slate-900">Order #1019 — Office weekly — Scheduled</li>
          </ul>
        </div>
        
        <div className="space-y-4.5">
          <div className="bg-white rounded-lg p-4.5 shadow-sm">
            <h3 className="m-0 text-lg font-semibold">Quick Actions</h3>
            <div className="mt-3 space-y-2">
              <Link href="/customer/order" className="block w-full text-center bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
                New Order
              </Link>
              <Link href="/customer/requests" className="block w-full text-center border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50">
                View All Requests
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function CustomerDashboardPage() {
  return (
    <ProtectedRoute>
      <MainLayout
        title="Welcome back, Customer"
        subtitle="Overview of your recent orders and activity."
        breadcrumb="Dashboard"
      >
        <CustomerDashboardContent />
      </MainLayout>
    </ProtectedRoute>
  )
}
