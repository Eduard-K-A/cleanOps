'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import Link from 'next/link'
import { useAuth } from '@/lib/authContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { getCustomerJobs, updateJobStatus } from '@/app/actions/jobs'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { JobStatus, Job } from '@/types'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const STATUS_LABELS: Record<JobStatus, string> = {
  OPEN: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  PENDING_REVIEW: 'Pending Review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
}

function CustomerDashboardContent() {
  const router = useRouter()
  const { profile } = useAuth()
  
  const { data: jobs, loading, refetch } = useAsyncData({
    fetchFn: async () => {
      try {
        const data = await getCustomerJobs()
        return { data, success: true }
      } catch (err: any) {
        if (err.message === 'Unauthorized') {
          return { data: [], success: true }
        }
        return { success: false, error: err.message }
      }
    },
    defaultValue: [],
    enabled: !!profile?.id,
    cacheKey: `customer-jobs-${profile?.id}`
  })

  const activeJobs = jobs.filter((job: Job) => 
    ['OPEN', 'IN_PROGRESS', 'PENDING_REVIEW'].includes(job.status)
  )

  const handleCancelJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return

    try {
      await updateJobStatus(jobId, 'CANCELLED')
      toast.success('Order cancelled successfully')
      refetch()
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel order')
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4.5 items-start">
        <div className="bg-white rounded-lg p-4.5 shadow-sm min-h-[300px]">
          <h2 className="m-0 text-lg font-semibold">Active Orders</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <LoadingSpinner />
            </div>
          ) : activeJobs.length > 0 ? (
            <ul className="mt-3 p-0 list-none flex flex-col gap-2.5">
              {activeJobs.map((job: Job) => (
                <li key={job.id} className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-slate-200 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900 truncate">
                        {job.tasks.map((t: any) => typeof t === 'string' ? t : t?.name || 'Cleaning Task').join(', ')}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold ${
                        job.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' :
                        job.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {STATUS_LABELS[job.status]}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {job.location_address || 'No address provided'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/customer/jobs?id=${job.id}`}
                      className="text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50"
                    >
                      View Details
                    </Link>
                    {job.status === 'OPEN' && (
                      <button
                        onClick={() => handleCancelJob(job.id)}
                        className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-8 text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <p className="text-slate-500">You don't have any active orders.</p>
              <Link href="/customer/order" className="mt-3 inline-block text-blue-600 font-semibold hover:underline">
                Book your first clean
              </Link>
            </div>
          )}
        </div>
        
        <div className="space-y-4.5">
          <div className="bg-white rounded-lg p-4.5 shadow-sm">
            <h3 className="m-0 text-lg font-semibold">Quick Actions</h3>
            <div className="mt-3 space-y-2">
              <Link href="/customer/order" className="block w-full text-center bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 font-semibold shadow-sm">
                New Order
              </Link>
              <Link href="/customer/requests" className="block w-full text-center border border-slate-200 bg-white text-slate-700 rounded-lg px-4 py-2 hover:bg-slate-50 font-semibold shadow-sm">
                Order History
              </Link>
            </div>
          </div>
          
          <div className="bg-slate-900 text-white rounded-lg p-4.5 shadow-sm">
            <h3 className="m-0 text-sm font-bold text-slate-400 uppercase tracking-wider">Balance</h3>
            <p className="mt-1 text-2xl font-bold">${profile?.money_balance?.toFixed(2) || '0.00'}</p>
            <Link href="/customer/payment" className="mt-3 block text-center bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded py-2 transition-colors">
              Add Funds
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function CustomerDashboardPage() {
  const { profile } = useAuth()
  
  return (
    <ProtectedRoute>
      <MainLayout
        title={`Welcome back, ${profile?.full_name?.split(' ')[0] || 'Customer'}`}
        subtitle="Overview of your recent orders and activity."
        breadcrumb="Dashboard"
      >
        <CustomerDashboardContent />
      </MainLayout>
    </ProtectedRoute>
  )
}
